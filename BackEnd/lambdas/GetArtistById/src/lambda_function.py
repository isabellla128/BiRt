import json
import requests

def lambda_handler(event, context):
    artist_id = event.get("id")

    accept_header = event.get("Accept", "application/json")
    print("Accept header:", accept_header)

    if not artist_id:
        return {
            "statusCode": 400,
            "message": "Artist ID is required."
        }

    # Interogarea SPARQL pentru obținerea informațiilor de bază ale artistului
    query_artist = f"""
    SELECT ?artist ?name ?birthDate (SAMPLE(STR(?image)) AS ?image) ?deathDate (SAMPLE(?countryLabel) AS ?countryLabel) WHERE {{
        VALUES ?artist {{ {artist_id} }}  # Înlocuiește cu ID-ul artistului dorit
        ?artist rdfs:label ?name FILTER(LANG(?name) = "en").
        OPTIONAL {{ ?artist wdt:P569 ?birthDate. }}
        OPTIONAL {{ ?artist wdt:P18 ?image. }}
        OPTIONAL {{ ?artist wdt:P570 ?deathDate. }}
        ?artist wdt:P27 ?country.
        ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").
    }} GROUP BY ?artist ?name ?birthDate ?deathDate
    """
    print("Query:", query_artist)
    artist_data = query_wikidata(query_artist)

    if not artist_data:
        return {
            "statusCode": 404,
            "message": "Artist not found."
        }

    # Extragerea datelor despre artist
    artist_info = artist_data[0]
    artist = {
        "id": artist_id,
        "name": artist_info["name"]["value"],
        "birth": artist_info.get("birthDate", {}).get("value", None),
        "death": artist_info.get("deathDate", {}).get("value", None),
        "photo": artist_info.get("image", {}).get("value", None),
        "country": artist_info.get("countryLabel", {}).get("value", None)
    }

    query_occupation = f"""
    SELECT ?occupationLabel WHERE {{
        VALUES ?artist {{ {artist_id} }}
        OPTIONAL {{
            ?artist wdt:P106 ?occupation.
            ?occupation rdfs:label ?occupationLabel FILTER(LANG(?occupationLabel) = "en").
        }}
    }}
    """
    occupations_data = query_wikidata(query_occupation)
    if occupations_data and any(occupations_data):
        artist["occupations"] = [occ["occupationLabel"]["value"] for occ in occupations_data]

    query_genres = f"""
    SELECT ?genre ?genreLabel WHERE {{
        VALUES ?artist {{ {artist_id} }}
        OPTIONAL {{
            ?artist wdt:P136 ?genre.
            ?genre rdfs:label ?genreLabel FILTER(LANG(?genreLabel) = "en").
        }}
    }}
    """
    genres_data = query_wikidata(query_genres)
    if genres_data and any(genres_data):
        artist["genres"] = [{"id": g["genre"]["value"].split("/")[-1], "label": g["genreLabel"]["value"]} for g in genres_data]

    query_awards = f"""
    SELECT ?awardLabel WHERE {{
        VALUES ?artist {{ {artist_id} }}
        OPTIONAL {{
            ?artist wdt:P166 ?award.
            ?award rdfs:label ?awardLabel FILTER(LANG(?awardLabel) = "en").
        }}
    }}
    """
    awards_data = query_wikidata(query_awards)
    if awards_data and any(awards_data):
        artist["awards"] = [award["awardLabel"]["value"] for award in awards_data]

    query_nominations = f"""
    SELECT ?nominationLabel WHERE {{
        VALUES ?artist {{ {artist_id} }}
        OPTIONAL {{
            ?artist wdt:P1411 ?nomination.
            ?nomination rdfs:label ?nominationLabel FILTER(LANG(?nominationLabel) = "en").
        }}
    }}
    """
    print("Query for nominations:", query_nominations)
    nominations_data = query_wikidata(query_nominations)
    if nominations_data and any(nominations_data):
        artist["nominations"] = [nom["nominationLabel"]["value"] for nom in nominations_data]

    query_instruments = f"""
    SELECT ?instrumentLabel WHERE {{
        VALUES ?artist {{ {artist_id} }}
        OPTIONAL {{
            ?artist wdt:P1303 ?instrument.
            ?instrument rdfs:label ?instrumentLabel FILTER(LANG(?instrumentLabel) = "en").
        }}
    }}
    """
    instruments_data = query_wikidata(query_instruments)
    if instruments_data and any(instruments_data):
        artist["instruments"] = [inst["instrumentLabel"]["value"] for inst in instruments_data]

    if "application/rdf+xml" in accept_header:
        rdf_data = format_as_rdf(artist)
        return {"statusCode": 200, "headers": {"Content-Type": "application/rdf+xml"}, "body": rdf_data}

    return {
        "statusCode": 200,
        "body": json.dumps(artist)
    }

def format_as_rdf(artist_info):
    rdf_template = f"""<?xml version="1.0"?>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/"
             xmlns:foaf="http://xmlns.com/foaf/0.1/"
             xmlns:wd="http://www.wikidata.org/entity/"
             xmlns:wdt="http://www.wikidata.org/prop/direct/"
             xmlns:skos="http://www.w3.org/2004/02/skos/core#">

      <rdf:Description rdf:about="http://www.wikidata.org/entity/{artist_info['id']}">
        <foaf:name>{artist_info['name']}</foaf:name>
        {f'<wdt:P569 rdf:datatype="http://www.w3.org/2001/XMLSchema#date">{artist_info["birth"]}</wdt:P569>' if artist_info.get("birth") else ''}
        {f'<wdt:P570 rdf:datatype="http://www.w3.org/2001/XMLSchema#date">{artist_info["death"]}</wdt:P570>' if artist_info.get("death") else ''}
        {f'<foaf:depiction rdf:resource="{artist_info["photo"]}"/>' if artist_info.get("photo") else ''}
        {f'<wdt:P27 rdf:resource="http://www.wikidata.org/entity/{artist_info["country"]}"/>' if artist_info.get("country") else ''}

        <!-- Occupations (P106) -->
        {''.join([f'<wdt:P106 rdf:resource="http://www.wikidata.org/entity/{occupation.replace(" ", "_")}"/>' for occupation in artist_info.get("occupations", [])])}
        
        <!-- Genres (P136) -->
        {''.join([f'<wdt:P136 rdf:resource="http://www.wikidata.org/entity/{genre["id"]}"/>' for genre in artist_info.get("genres", [])])}
        
        <!-- Awards (P166) -->
        {''.join([f'<wdt:P166 rdf:resource="http://www.wikidata.org/entity/{award.replace(" ", "_")}"/>' for award in artist_info.get("awards", [])])}
        
        <!-- Nominations (P1411) -->
        {''.join([f'<wdt:P1411 rdf:resource="http://www.wikidata.org/entity/{nomination.replace(" ", "_")}"/>' for nomination in artist_info.get("nominations", [])])}
        
        <!-- Instruments played (P1303) -->
        {''.join([f'<wdt:P1303 rdf:resource="http://www.wikidata.org/entity/{instrument.replace(" ", "_")}"/>' for instrument in artist_info.get("instruments", [])])}
      </rdf:Description>
    </rdf:RDF>"""
    
    return rdf_template

def query_wikidata(sparql_query):
    sparql_endpoint = "https://query.wikidata.org/sparql"
    headers = {"Accept": "application/json"}
    response = requests.get(sparql_endpoint, params={"query": sparql_query}, headers=headers)
    
    if response.status_code != 200:
        return None
    
    return response.json().get("results", {}).get("bindings", [])
