import json
import requests
import boto3

lambda_client = boto3.client('lambda', region_name="eu-north-1")  
def lambda_handler(event, context):

    country = event.get("country", "").lower()

    response = lambda_client.invoke(
        FunctionName="neptune-access-lambda",  
        InvocationType='RequestResponse',  
        Payload=json.dumps({"action": "check-cache", "entity": "genre", "country": country}) 
    )
    
    response_payload = json.loads(response['Payload'].read().decode('utf-8'))

    print(response_payload)

    if response_payload.get('statusCode') == 200:
        return {
            "statusCode": 200,
            "body": response_payload['body']  
        }
    else:
        return query_wikidata(country)

def query_wikidata(country):
    if country:
        query = f"""
        SELECT ?genre ?genreLabel (SAMPLE(STR(?image)) AS ?imageUrl) ?countryLabel WHERE {{
            ?genre wdt:P31 wd:Q188451. # P31 = instanță de, Q188451 = gen muzical
            SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
            ?genre wdt:P18 ?image.
            ?genre wdt:P495 ?country. 
            ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").
            FILTER(CONTAINS(LCASE(?countryLabel), "{country}"))
        }}
        GROUP BY ?genre ?genreLabel ?countryLabel
        LIMIT 100
        """
    else:
        query = """
        SELECT ?genre ?genreLabel (SAMPLE(STR(?image)) AS ?imageUrl) (SAMPLE(?countryLabel) AS ?countryLabel) WHERE {
            ?genre wdt:P31 wd:Q188451. # P31 = instanță de, Q188451 = gen muzical
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            ?genre wdt:P18 ?image.
            ?genre wdt:P495 ?country. 
            ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").
        }
        GROUP BY ?genre ?genreLabel
        LIMIT 100
        """

    genres_data = execute_query_wikidata(query)

    if not genres_data:
        return {
            "statusCode": 404,
            "message": "No genres found."
        }

    genres = []
    for genre in genres_data:
        genres.append({
            "id": f"wd:{genre['genre']['value'].split('/')[-1]}",
            "label": genre["genreLabel"]["value"],
            "image": genre.get("imageUrl", {}).get("value", None),
            "country": genre.get("countryLabel", {}).get("value", None)
        })
    
    
    lambda_client.invoke(
        FunctionName="neptune-access-lambda",
        InvocationType='Event',  
        Payload=json.dumps({"action": "save", "entity": "genre", "data": genres})
    )

    return {
        "statusCode": 200,
        "body": json.dumps({"genres": genres})
    }

def execute_query_wikidata(sparql_query):
    sparql_endpoint = "https://query.wikidata.org/sparql"
    headers = {"Accept": "application/json"}
    response = requests.get(sparql_endpoint, params={"query": sparql_query}, headers=headers)
    
    if response.status_code != 200:
        return None
    
    return response.json().get("results", {}).get("bindings", [])
