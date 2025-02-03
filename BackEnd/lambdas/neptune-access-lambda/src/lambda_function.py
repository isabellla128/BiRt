import requests
import datetime
import json
from rdflib import Graph
from pyshacl import validate


NEPTUNE_ENDPOINT = "neptune-db-cluster.cluster-c5suku4e6g43.eu-north-1.neptune.amazonaws.com"
PORT = 8182
HEADERS = {"Content-Type": "application/x-www-form-urlencoded"}

def lambda_handler(event, context):
    action = event.get("action")
    entity = event.get("entity")

    if action == "check-cache":
        if entity == "genre":
            country = event.get("country")
            return check_neptune_genre_cache(country)
        elif entity == "artist":
            return check_neptune_artist_cache()
    elif action == "save":
        data = event.get("data")
        if entity == "genre":
            return save_to_neptune_genre(data)
        elif entity == "artist":
            return save_to_neptune_artist(data)

    return {"statusCode": 400, "message": "Invalid action"}

def check_neptune_genre_cache(country=None):
    """ Verifică dacă există genuri în cache, filtrând opțional după țară """

    if country:
        sparql_query = f"""
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?genre ?genreLabel ?image ?dateModified ?countryLabel WHERE {{
            ?genre wdt:P31 wd:Q188451.  # Gen muzical
            ?genre rdfs:label ?genreLabel.  
            FILTER(LANG(?genreLabel) = "en").  

            OPTIONAL {{ ?genre wdt:P18 ?image. }}
            OPTIONAL {{ ?genre schema:dateModified ?dateModified. }}
            
            ?genre wdt:P495 ?countryLabel.  
            FILTER(LANG(?countryLabel) = "en" && LCASE(STR(?countryLabel)) = "{country}"). 
        }}
        LIMIT 100
        """
    else:
        sparql_query = """
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>

        SELECT ?genre ?genreLabel ?image ?dateModified ?countryLabel WHERE {
            ?genre wdt:P31 wd:Q188451.  # Gen muzical
            ?genre rdfs:label ?genreLabel.  
            FILTER(LANG(?genreLabel) = "en").  
            OPTIONAL { ?genre wdt:P18 ?image. }
            OPTIONAL { ?genre schema:dateModified ?dateModified. }
            OPTIONAL { ?genre wdt:P495 ?countryLabel. }  # Direct ca label
        }
        LIMIT 100
        """
    '''
    sparql_query = """
    SELECT ?s ?p ?o WHERE {
        ?s ?p ?o .
        }
        LIMIT 100
    """
    '''
    url = f"https://{NEPTUNE_ENDPOINT}:{PORT}/sparql"
    response = requests.post(url, data={"query": sparql_query}, headers=HEADERS)
    print(response.json())
    if response.status_code != 200:
        return {"statusCode": 500, "message": "Error querying Neptune"}

    results = response.json().get("results", {}).get("bindings", [])
    if not results:
        return {"statusCode": 404, "message": "Not found in cache"}

    if len(results) < 100:
        return {"statusCode": 404, "message": "Not enough data in cache"}

    timestamp = results[0].get("dateModified", {}).get("value", None)
    if not timestamp:
        return {"statusCode": 404, "message": "Cache expired"}

    timestamp_datetime = datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    timestamp_datetime = timestamp_datetime.replace(tzinfo=None)  
    now = datetime.datetime.utcnow()
    diff = now - timestamp_datetime

    if diff.total_seconds() > 86400:
        return {"statusCode": 404, "message": "Cache expired"}

    genres = [
        {
            "id": f"{genre['genre']['value'].split('/')[-1]}",
            "label": genre["genreLabel"]["value"],
            "image": genre.get("image", {}).get("value", None),
            "country": genre.get("countryLabel", {}).get("value", None)
        }
        for genre in results
    ]

    return {"statusCode": 200, "body": json.dumps({"genres": genres})}


def save_to_neptune_genre(genres):
    now_iso = datetime.datetime.utcnow().isoformat()

    validate_shacl_genres(genres, now_iso)

    sparql_insert_statements = []
    
    sparql_insert_prefix = """
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    """
    sparql_insert_statements.append(sparql_insert_prefix) 

    for genre in genres:
        genre_id = genre.get("id")
        label = genre.get("label")
        image = genre.get("image")
        country_label = genre.get("country")

        if not genre_id or not label or not country_label:
            continue 

        sparql_insert = f"""
        INSERT DATA {{
            {f'wd:{genre_id} rdfs:label "{label}"@en .'}
            {f'wd:{genre_id} wdt:P31 wd:Q188451 .'}  # Gen muzical
            {f'wd:{genre_id} wdt:P18 <{image}> .' if image else ""}
            {f'wd:{genre_id} schema:dateModified "{now_iso}"^^xsd:dateTime .' if now_iso else ""}
            {f'wd:{genre_id} wdt:P495 "{country_label}"@en .' if country_label else ""}
        }};
        """
        sparql_insert_statements.append(sparql_insert)

    if not sparql_insert_statements:
        return {"statusCode": 400, "message": "No valid genres to save"}

    sparql_query = "\n".join(sparql_insert_statements)

    print(sparql_query)
    
    url = f"https://{NEPTUNE_ENDPOINT}:{PORT}/sparql"

    '''
    sparql_query = """
    DELETE WHERE {
        ?s ?p ?o .
    }
    """
    '''

    response = requests.post(url, data={"update": sparql_query}, headers=HEADERS)

    if response.status_code == 200:
        return {"statusCode": 200, "message": "Genres inserted successfully"}
    else:
        print(response)
        return {"statusCode": response.status_code, "message": response.text}

def validate_shacl_genres(genres, now_iso):
    
    rdf_graph = Graph()

    for genre in genres:
        genre_id = genre.get("id")
        label = genre.get("label")
        image = genre.get("image")
        country_label = genre.get("country")

        if not genre_id or not label or not country_label:
            continue  

        genre_rdf = f"""
        @prefix wd: <http://www.wikidata.org/entity/> .
        @prefix wdt: <http://www.wikidata.org/prop/direct/> .
        @prefix schema: <http://schema.org/> .
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

        {genre_id} rdfs:label "{label}"@en .
        {genre_id} wdt:P31 wd:Q188451 .
        {f'{genre_id} wdt:P18 <{image}> .' if image else ""}
        {f'{genre_id} schema:dateModified "{now_iso}"^^xsd:dateTime .' if now_iso else ""}
        {f'{genre_id} wdt:P495 "{country_label}"@en .' if country_label else ""}
        """
        rdf_graph.parse(data=genre_rdf, format="turtle")

    shacl_graph = Graph()
    shacl_graph.parse("genre_shapes.ttl", format="turtle")

    conforms, results_graph, results_text = validate(rdf_graph, shacl_graph=shacl_graph)

    if not conforms:
        print("Eroare de validare SHACL:", results_text)
        return {"statusCode": 400, "message": "Invalid genres", "errors": results_text}
    else:
        print("Successful SHACL validation!")

def check_neptune_artist_cache():

    sparql_query = """
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikadata.org/prop/direct/>
    PREFIX schema: <http://schema.org/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?artist ?artistLabel ?image ?genreLabel ?countryLabel ?dateModified WHERE {
    ?artist wdt:P106 wd:Q177220 .        # Selectează entitățile cu profesia de artist
    ?artist rdfs:label ?artistLabel .     # Eticheta artistului
    FILTER(LANG(?artistLabel) = "en").
    
    OPTIONAL { ?artist wdt:P18 ?image. }    # Imaginea artistului
    OPTIONAL { ?artist wdt:P136 ?genreLabel. }   # Genul muzical (ex: "Latin pop")
    OPTIONAL { ?artist wdt:P27 ?countryLabel. }  # Țara artistului (ex: "Venezuela")
    OPTIONAL { ?artist schema:dateModified ?dateModified. }  # Data modificării
    }
    LIMIT 100

    """
    
    url = f"https://{NEPTUNE_ENDPOINT}:{PORT}/sparql"
    response = requests.post(url, data={"query": sparql_query}, headers=HEADERS)

    if response.status_code != 200:
        return {"statusCode": 500, "message": "Error querying Neptune"}
    print(response.json())
    results = response.json().get("results", {}).get("bindings", [])
    if not results:
        return {"statusCode": 404, "message": "Not found in cache"}

    if len(results) < 100:
        return {"statusCode": 404, "message": "Not enough data in cache"}

    timestamp = results[0].get("dateModified", {}).get("value", None)
    if not timestamp:
        return {"statusCode": 404, "message": "Cache expired"}

    timestamp_datetime = datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    timestamp_datetime = timestamp_datetime.replace(tzinfo=None)
    now = datetime.datetime.utcnow()
    diff = now - timestamp_datetime

    if diff.total_seconds() > 86400:
        return {"statusCode": 404, "message": "Cache expired"}

    artists = [
        {
            "id": f"{artist['artist']['value'].split('/')[-1]}",
            "name": artist["artistLabel"]["value"],
            "photo": artist.get("image", {}).get("value", None),
            "genre": artist.get("genreLabel", {}).get("value", None),
            "country": artist.get("countryLabel", {}).get("value", None)
        }
        for artist in results
    ]

    return {"statusCode": 200, "body": json.dumps({"artists": artists})}

def save_to_neptune_artist(artists):
    now_iso = datetime.datetime.utcnow().isoformat()

    validate_shacl_artists(artists, now_iso)

    sparql_insert_statements = []
    
    sparql_insert_prefix = """
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikadata.org/prop/direct/>
        PREFIX schema: <http://schema.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    """
    sparql_insert_statements.append(sparql_insert_prefix) 

    for artist in artists:
        artist_id = artist.get("id")
        label = artist.get("name")
        image = artist.get("photo")
        genre_label = artist.get("genre")
        country_label = artist.get("country")

        if not artist_id or not label or not country_label:
            continue 

        sparql_insert = f"""
        INSERT DATA {{
            {f'wd:{artist_id} wdt:P106 wd:Q177220 .' }  # Artist
            {f'wd:{artist_id} rdfs:label "{label}"@en .' }
            {f'wd:{artist_id} wdt:P18 <{image}> .' if image else ""}
            {f'wd:{artist_id} wdt:P136 "{genre_label}"@en .' if genre_label else ""}
            {f'wd:{artist_id} wdt:P27 "{country_label}"@en .' if country_label else ""}
            {f'wd:{artist_id} schema:dateModified "{now_iso}"^^xsd:dateTime .' if now_iso else ""}
        }};
        """
        sparql_insert_statements.append(sparql_insert)

    if not sparql_insert_statements:
        return {"statusCode": 400, "message": "No valid artists to save"}

    sparql_query = "\n".join(sparql_insert_statements)

    url = f"https://{NEPTUNE_ENDPOINT}:{PORT}/sparql"
    response = requests.post(url, data={"update": sparql_query}, headers=HEADERS)

    if response.status_code == 200:
        return {"statusCode": 200, "message": "Artists inserted successfully"}
    else:
        print(response)
        return {"statusCode": response.status_code, "message": response.text}

def validate_shacl_artists(artists, now_iso):
    rdf_graph = Graph()

    for artist in artists:
        artist_id = artist.get("id")
        label = artist.get("name")
        image = artist.get("photo")
        genre_label = artist.get("genre")
        country_label = artist.get("country")

        if not artist_id or not label or not country_label:
            continue  

        artist_rdf = f"""
        @prefix wd: <http://www.wikidata.org/entity/> .
        @prefix wdt: <http://www.wikidata.org/prop/direct/> .
        @prefix schema: <http://schema.org/> .
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

        {artist_id} wdt:P106 wd:Q177220 .  # Ocupație: Artist
        {artist_id} rdfs:label "{label}"@en .
        {f'{artist_id} wdt:P18 <{image}> .' if image else ""}
        {f'{artist_id} wdt:P136 "{genre_label}"@en .' if genre_label else ""}
        {f'{artist_id} wdt:P27 "{country_label}"@en .' if country_label else ""}
        {f'{artist_id} schema:dateModified "{now_iso}"^^xsd:dateTime .' if now_iso else ""}
        """

        rdf_graph.parse(data=artist_rdf, format="turtle")

    shacl_graph = Graph()
    shacl_graph.parse("artist_shapes.ttl", format="turtle")

    conforms, results_graph, results_text = validate(rdf_graph, shacl_graph=shacl_graph)

    if not conforms:
        print("Eroare de validare SHACL:", results_text)
        return {"statusCode": 400, "message": "Invalid artists", "errors": results_text}
    else:
        print("Successful SHACL validation!")

