import requests

def lambda_handler(event, context):
    genre = event.get("genre", "").strip()
    country = event.get("country", "").strip()

    print(genre, country)
    
    if not genre and not country:
        return {
            "statusCode": 400,
            "message": "At least one of 'genre' or 'country' is required."
        }

    sparql_endpoint = "https://query.wikidata.org/sparql"

    genre_query = None
    country_query = None

    if genre:
        genre_query = f"""
        SELECT ?genre WHERE {{
        ?genre wdt:P31 wd:Q188451;
        rdfs:label "{genre}"@en.
        SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        }}
        LIMIT 1
        """

    if country:
        country_query = f"""
        SELECT DISTINCT ?country WHERE {{
        ?country wdt:P31 wd:Q6256.
        ?country rdfs:label ?countryLabel.
        FILTER(LANG(?countryLabel) = "en")
        FILTER(CONTAINS(LCASE(?countryLabel), "{country}"))
        SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        }}
        LIMIT 1
        """

    def execute_sparql(query):
        response = requests.get(sparql_endpoint, params={"query": query, "format": "json"})
        response.raise_for_status()
        data = response.json()
        bindings = data.get("results", {}).get("bindings", [])
        if bindings:
            uri = bindings[0].get("genre", {}).get("value") or bindings[0].get("country", {}).get("value")
            return uri.split("/")[-1] if uri else None
        return None

    try:
        result = {"statusCode": 200}

        if genre_query:
            genre_id = execute_sparql(genre_query)
            if genre_id:
                result["genre_id"] = genre_id

        if country_query:
            country_id = execute_sparql(country_query)
            if country_id:
                result["country_id"] = country_id

        if "genre_id" not in result and "country_id" not in result:
            return {
                "statusCode": 404,
                "message": f"Could not find IDs for genre '{genre}' or country '{country}'."
            }

        return result

    except Exception as e:
        return {
            "statusCode": 500,
            "message": f"An error occurred: {str(e)}"
        }
