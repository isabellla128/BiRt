import json
import requests

def lambda_handler(event, context):
    genre_id = event.get("id")
    
    if not genre_id:
        return {
            "statusCode": 400,
            "message": "Genre ID is required."
        }

    query_recommendations = f"""
    SELECT DISTINCT ?genre ?genreLabel 
           (SAMPLE(STR(?image)) AS ?imageUrl) 
           (SAMPLE(?countryLabel) AS ?countryLabel) 
    WHERE {{
      # Găsim artiști care cântă genul dorit 
      ?artist wdt:P136 {genre_id}.  

      # Găsim toate genurile muzicale asociate acestor artiști
      ?artist wdt:P136 ?genre.
      
      # Ne asigurăm că genul returnat este diferit de cel țintă
      FILTER(?genre != {genre_id}) 

      # Obținem informații despre gen
      ?genre wdt:P31 wd:Q188451. # Gen muzical
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}

      # Obținem imaginea genului (opțional)
      OPTIONAL {{ ?genre wdt:P18 ?image. }}

      # Obținem țara asociată genului (dacă există)
      OPTIONAL {{ 
        ?genre wdt:P495 ?country. 
        ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").
      }}
    }}
    GROUP BY ?genre ?genreLabel
    LIMIT 10
    """

    recommended_genres_data = query_wikidata(query_recommendations)

    if not recommended_genres_data:
        return {
            "statusCode": 404,
            "message": "No recommended genres found."
        }

    recommended_genres = [
        {
            "id": f"wd:{g['genre']['value'].split('/')[-1]}",
            "label": g["genreLabel"]["value"],
            "image": g.get("imageUrl", {}).get("value", None),
            "country": g.get("countryLabel", {}).get("value", None)
        }
        for g in recommended_genres_data
    ]

    return {
        "statusCode": 200,
        "body": json.dumps({"genres": recommended_genres})
    }

def query_wikidata(sparql_query):
    sparql_endpoint = "https://query.wikidata.org/sparql"
    headers = {"Accept": "application/json"}
    response = requests.get(sparql_endpoint, params={"query": sparql_query}, headers=headers)
    
    if response.status_code != 200:
        return None
    
    return response.json().get("results", {}).get("bindings", [])
