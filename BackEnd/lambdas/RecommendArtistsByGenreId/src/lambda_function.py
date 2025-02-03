import json
import requests


def lambda_handler(event, context):
    genre_id = event.get("id")
    
    if not genre_id:
        return {
            "statusCode": 400,
            "message": "Genre ID is required."
        }

    query = f"""
    SELECT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image) (?filteredGenreLabel AS ?genreLabel) 
           (SAMPLE(?countryLabel) AS ?countryLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P136 {genre_id}.
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      {genre_id} rdfs:label ?filteredGenreLabel FILTER(LANG(?filteredGenreLabel) = "en").
      ?artist wdt:P27 ?country.
      ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en"). 
    }}
    GROUP BY ?artist ?artistLabel ?filteredGenreLabel
    LIMIT 10
    """

    artist_results = query_wikidata(query)
    if not artist_results:
        return {"statusCode": 500, "body": json.dumps({"error": "Failed to fetch artists"})}

    response = format_response(artist_results)
    return {
        "statusCode": 200,
        "body": json.dumps(response)
    }

def query_wikidata(sparql_query):
    sparql_endpoint = "https://query.wikidata.org/sparql"
    headers = {"Accept": "application/json"}
    response = requests.get(sparql_endpoint, params={"query": sparql_query}, headers=headers)
    
    if response.status_code != 200:
        return None
    
    return response.json().get("results", {}).get("bindings", [])

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

    