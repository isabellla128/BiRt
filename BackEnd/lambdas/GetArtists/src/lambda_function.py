import json
import requests
import random
import boto3


def lambda_handler(event, context):
    genre = event.get("genre", "").lower()
    country = event.get("country", "").lower()
    from_to_year = event.get("from-to", "").lower()

    print(genre, country, from_to_year)

    from_year, to_year = None, None
    if from_to_year:
        if '-' in from_to_year:
            years = from_to_year.split('-')
            if len(years) == 2 and years[0].isdigit() and years[1].isdigit():
                from_year, to_year = int(years[0]), int(years[1])
                if from_year > to_year:
                    return {
                        "statusCode": 400,
                        "message": "The 'from-to' years are invalid. The first year must be less than or equal to the second year."
                    }
            else:
                return {
                    "statusCode": 400,
                    "message": "The 'from-to' years format is incorrect. Please use the format 'YYYY-YYYY'."
                }
        else:
            return {
                "statusCode": 400,
                "message": "The 'from-to' parameter is missing a hyphen ('-'). Please use the format 'YYYY-YYYY'."
            }

    genre_id = get_metadata_mapping("genre", genre) if genre else None
    country_id = get_metadata_mapping("country", country) if country else None

    if genre and not genre_id:
        return {
            "statusCode": 404,
            "message": f"Genre '{genre}' not found in Wikidata."
        }

    if country and not country_id:
        return {
            "statusCode": 404,
            "message": f"Country '{country}' not found in Wikidata."
        }

    to_save = False

    if genre and not country and not from_year:
        query = get_query_by_genre(genre_id)
    elif country and not genre and not from_year:
        query = get_query_by_country(country_id)
    elif from_year and to_year and not genre and not country:
        random_countries = get_random_countries(3)
        query = get_query_by_years(from_year, to_year, random_countries)
    elif genre and from_year and to_year and not country:
        query = get_query_by_genre_and_years(genre_id, from_year, to_year)
    elif country and from_year and to_year and not genre:
        query = get_query_by_country_and_years(country_id, from_year, to_year)
    elif genre and country and not from_year and not to_year:
        query = get_query_by_genre_and_country(genre_id, country_id)
    elif genre and country and from_year and to_year:
        query = get_query_by_all_filters(genre_id, country_id, from_year, to_year)
    else:
        lambda_client = boto3.client('lambda', region_name="eu-north-1")  # Specifică regiunea ta
        response = lambda_client.invoke(
            FunctionName="neptune-access-lambda",  
            InvocationType='RequestResponse',  
            Payload=json.dumps({"action": "check-cache", "entity": "artist"}) 
        )
        
        response_payload = json.loads(response['Payload'].read().decode('utf-8'))

        if response_payload.get('statusCode') == 200:
            print("Cache hit!")
            return {
                "statusCode": 200,
                "body": response_payload['body']  
            }
        else:
            random_countries = get_random_countries(4)
            query = get_query_default(random_countries)
            to_save = True


    print("SPARQL Query:", query)

    artist_results = query_wikidata(query)
    if not artist_results:
        return {"statusCode": 500, "body": json.dumps({"error": "Failed to fetch artists"})}

    response = format_response(artist_results)

    if to_save:
        lambda_client = boto3.client('lambda', region_name="eu-north-1")  
        lambda_response = lambda_client.invoke(
            FunctionName="neptune-access-lambda",
            InvocationType='Event',
            Payload=json.dumps({"action": "save", "entity": "artist", "data": response["artists"]})
        )
    
    return {
        "statusCode": 200,
        "body": json.dumps(response)
    }

def get_metadata_mapping(type_, value):
    if type_ == "genre":
        payload = {"genre": value}
    else :
        payload = {"country": value}
    lambda_client = boto3.client('lambda')
    metadata_response = lambda_client.invoke(
        FunctionName='GetMetadataMappings',
        Payload=json.dumps(payload)
    )
    metadata = json.loads(metadata_response['Payload'].read())
    genre_id = metadata.get("genre_id")
    country_id = metadata.get("country_id")

    if genre_id:
        return genre_id
    else:
        return country_id

def get_random_countries(limit):
    random_offset = random.randint(0, 190)
    country_query = f"""
    SELECT ?country WHERE {{
      ?country wdt:P31 wd:Q6256.
    }}
    ORDER BY RAND()
    LIMIT {limit}
    OFFSET {random_offset}
    """
    results = query_wikidata(country_query)
    return [res["country"]["value"].split("/")[-1] for res in results] if results else []

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

def get_query_by_genre(genre_id):
    return f"""
    SELECT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image) (?filteredGenreLabel AS ?genreLabel) 
           (SAMPLE(?countryLabel) AS ?countryLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P136 wd:{genre_id}.
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      wd:{genre_id} rdfs:label ?filteredGenreLabel FILTER(LANG(?filteredGenreLabel) = "en").
      ?artist wdt:P27 ?country.
      ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en"). 
    }}
    GROUP BY ?artist ?artistLabel ?filteredGenreLabel
    LIMIT 100
    """


def get_query_by_country(country_id):
    return f"""
    SELECT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image) (SAMPLE(?genreLabel) AS ?genreLabel) 
           (?filteredCountryLabel AS ?countryLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P27 wd:{country_id}.
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      ?artist wdt:P136 ?genre. 
      ?genre rdfs:label ?genreLabel FILTER(LANG(?genreLabel) = "en").
      wd:{country_id} rdfs:label ?filteredCountryLabel FILTER(LANG(?filteredCountryLabel) = "en").
    }}
    GROUP BY ?artist ?artistLabel ?filteredCountryLabel
    LIMIT 100
    """


def get_query_by_years(from_year, to_year, country_ids):
    country_filter = ", ".join([f"wd:{c}" for c in country_ids])
    return f"""
    SELECT DISTINCT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image) 
           (SAMPLE(?genreLabel) AS ?genreLabel) (SAMPLE(?countryLabel) AS ?countryLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P27 ?country.
      FILTER(?country IN ({country_filter}))
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      ?artist wdt:P136 ?genre.
      ?genre rdfs:label ?genreLabel FILTER(LANG(?genreLabel) = "en").
      ?artist wdt:P27 ?country.
      ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").
      ?artist wdt:P569 ?birth_date.
      OPTIONAL {{ ?artist wdt:P570 ?death_date. }}
      FILTER(((YEAR(?birth_date)) <= {to_year}) && ((!(BOUND(?death_date))) || ((YEAR(?death_date)) >= {from_year})))
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?artist ?artistLabel
    LIMIT 100
    """

def get_query_by_genre_and_years(genre_id, from_year, to_year):
    return f"""
    SELECT DISTINCT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image)
           (?filteredGenreLabel AS ?genreLabel)
           (SAMPLE(?countryLabel) AS ?countryLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P136 wd:{genre_id}.
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      ?artist wdt:P27 ?country.
      ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").
      ?artist wdt:P569 ?birth_date.
      OPTIONAL {{ ?artist wdt:P570 ?death_date. }}
      FILTER(((YEAR(?birth_date)) <= {to_year}) && ((!(BOUND(?death_date))) || ((YEAR(?death_date)) >= {from_year})))
      wd:{genre_id} rdfs:label ?filteredGenreLabel FILTER(LANG(?filteredGenreLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?artist ?artistLabel ?filteredGenreLabel
    LIMIT 100
    """
def get_query_by_country_and_years(country_id, from_year, to_year):
    return f"""
    SELECT DISTINCT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image)
           (?filteredCountryLabel AS ?countryLabel)
           (SAMPLE(?genreLabel) AS ?genreLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P27 wd:{country_id}.
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      ?artist wdt:P136 ?genre.
      ?genre rdfs:label ?genreLabel FILTER(LANG(?genreLabel) = "en").
      ?artist wdt:P569 ?birth_date.
      OPTIONAL {{ ?artist wdt:P570 ?death_date. }}
      FILTER(((YEAR(?birth_date)) <= {to_year}) && ((!(BOUND(?death_date))) || ((YEAR(?death_date)) >= {from_year})))
      wd:{country_id} rdfs:label ?filteredCountryLabel FILTER(LANG(?filteredCountryLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?artist ?artistLabel ?filteredCountryLabel
    LIMIT 100
    """

def get_query_by_genre_and_country(genre_id, country_id):
    return f"""
    SELECT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image) (?filteredCountryLabel AS ?countryLabel) (?filteredGenreLabel AS ?genreLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P136 wd:{genre_id}.
      ?artist wdt:P27 wd:{country_id}.
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      wd:{country_id} rdfs:label ?filteredCountryLabel FILTER(LANG(?filteredCountryLabel) = "en").
      wd:{genre_id} rdfs:label ?filteredGenreLabel FILTER(LANG(?filteredGenreLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?artist ?artistLabel ?filteredCountryLabel ?filteredGenreLabel
    LIMIT 100
    """

def get_query_by_all_filters(genre_id, country_id, from_year, to_year):
    return f"""
    SELECT DISTINCT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image) (?filteredCountryLabel AS ?countryLabel) (?filteredGenreLabel AS ?genreLabel)WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P136 wd:{genre_id}.
      ?artist wdt:P27 wd:{country_id}.
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      ?artist wdt:P569 ?birth_date.
      OPTIONAL {{ ?artist wdt:P570 ?death_date. }}
      FILTER(((YEAR(?birth_date)) <= {to_year}) && ((!(BOUND(?death_date))) || ((YEAR(?death_date)) >= {from_year})))
      wd:{country_id} rdfs:label ?filteredCountryLabel FILTER(LANG(?filteredCountryLabel) = "en").
      wd:{genre_id} rdfs:label ?filteredGenreLabel FILTER(LANG(?filteredGenreLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?artist ?artistLabel ?filteredCountryLabel ?filteredGenreLabel
    LIMIT 100
    """

def get_query_default(random_countries):
    country_filter = ", ".join([f"wd:{c}" for c in random_countries])
    return f"""
    SELECT ?artist ?artistLabel (SAMPLE(STR(?image)) AS ?image) 
           (SAMPLE(?genreLabel) AS ?genreLabel) (SAMPLE(?countryLabel) AS ?countryLabel) WHERE {{
      ?artist wdt:P106 wd:Q177220.
      ?artist wdt:P27 ?country.
      FILTER(?country IN ({country_filter}))
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
      OPTIONAL {{ ?artist wdt:P18 ?image. }}
      ?artist wdt:P136 ?genre. ?genre rdfs:label ?genreLabel FILTER(LANG(?genreLabel) = "en").
      OPTIONAL {{ ?artist wdt:P27 ?country. ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en"). }}
    }}
    GROUP BY ?artist ?artistLabel
    LIMIT 100
    """