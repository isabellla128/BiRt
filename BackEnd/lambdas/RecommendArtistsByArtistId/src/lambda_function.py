import json
import requests

def lambda_handler(event, context):
    artist_id = event.get("id")
    
    if not artist_id:
        return {
            "statusCode": 400,
            "message": "Artist ID is required."
        }

    query_genres = f"""
    SELECT DISTINCT ?genre WHERE {{
        VALUES ?artist {{ {artist_id} }}
        ?artist wdt:P136 ?genre.
    }}
    """
    genres_data = query_wikidata(query_genres)

    if not genres_data:
        return {
            "statusCode": 404,
            "message": "Genres not found."
        }

    genres = [genre["genre"]["value"].split("/")[-1] for genre in genres_data]

    query_birth_year = f"""
    SELECT (YEAR(?birthdate) AS ?birthYear) WHERE {{
        VALUES ?artist {{ {artist_id} }}
        ?artist wdt:P569 ?birthdate.
    }}
    """
    birth_data = query_wikidata(query_birth_year)

    if not birth_data:
        return {
            "statusCode": 404,
            "message": "Birth year not found."
        }

    birth_year = birth_data[0]["birthYear"]["value"]

    genre_filter = ', '.join([f"wd:{genre}" for genre in genres])
    
    query_recommendations = f"""
    SELECT DISTINCT (SAMPLE(?artist) AS ?artist)
                       (SAMPLE(?artistLabel) AS ?artistLabel)
                       (SAMPLE(STR(?image)) AS ?image)
                       (SAMPLE(?genreLabel) AS ?genreLabel)
                       ?countryLabel 
    WHERE {{
        # Selectăm artiști care sunt muzicieni
        ?artist wdt:P106 wd:Q177220.  

        # Filtrăm artiștii care au cel puțin un gen în comun
        ?artist wdt:P136 ?artistGenre.
        FILTER(?artistGenre IN ({genre_filter}))

        # Anul nașterii și filtrare pe ±5 ani față de anul artistului
        ?artist wdt:P569 ?artistBirthdate.
        BIND(YEAR(?artistBirthdate) AS ?artistBirthYear)
        FILTER(ABS(?artistBirthYear - {birth_year}) <= 5)

        # Țara artistului
        ?artist wdt:P27 ?country.
        ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").

        # Genuri artistului
        OPTIONAL {{
            ?artist wdt:P136 ?genre.
            ?genre rdfs:label ?genreLabel FILTER(LANG(?genreLabel) = "en").
        }}

        # Imaginea artistului
        OPTIONAL {{ ?artist wdt:P18 ?image. }}

        ?artist rdfs:label ?artistLabel FILTER(LANG(?artistLabel) = "en").

    }} 
    GROUP BY ?countryLabel
    ORDER BY RAND()
    LIMIT 10
    """
    print(query_recommendations)
    recommendations_data = query_wikidata(query_recommendations)

    if not recommendations_data:
        return {
            "statusCode": 404,
            "message": "No recommendations found."
        }

    response = format_response(recommendations_data)
    
    return {
        "statusCode": 200,
        "body": json.dumps(response)
    }

def format_response(results):
    artists = []
    for res in results:
        artists.append({
            "id": f"wd:{res['artist']['value'].split('/')[-1]}",
            "name": res["artistLabel"]["value"],
            "photo": res.get("image", {}).get("value", None),
            "genre": res.get("genreLabel", {}).get("value", None),
            "country": res.get("countryLabel", {}).get("value", None)
        })
    return {"artists": artists}

def query_wikidata(sparql_query):
    sparql_endpoint = "https://query.wikidata.org/sparql"
    headers = {"Accept": "application/json"}
    response = requests.get(sparql_endpoint, params={"query": sparql_query}, headers=headers)
    
    if response.status_code != 200:
        return None
    
    return response.json().get("results", {}).get("bindings", [])
