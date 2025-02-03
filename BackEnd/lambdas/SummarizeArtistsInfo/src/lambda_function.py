import json
import boto3
import requests

def lambda_handler(event, context):
    print("Request to get summary for artists information.")
    
    genre = event.get("genre", "").lower()
    country = event.get("country", "").lower()
    from_to_year = event.get("from-to", "").lower()
    limit_countries = event.get("limit-countries", "")
    limit_genres = event.get("limit-genres", "")

    limit_countries = int(limit_countries) if limit_countries.isdigit() else 100
    limit_genres = int(limit_genres) if limit_genres.isdigit() else 100

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
    
    by_country = get_number_of_artists_by_country(genre_id, country_id, from_year, to_year, limit_countries)
    by_genre = get_number_of_artists_by_genre(genre_id, country_id, from_year, to_year, limit_genres)
    by_decade = get_number_of_artists_by_decade(genre_id, country_id, from_year, to_year)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "byCountry": by_country,
            "byGenre": by_genre,
            "byDecade": by_decade
        })
    }

def get_number_of_artists_by_country(genre_id, country_id, from_year, to_year, limit_countries):
    sparql_query = f""" 
    SELECT ?countryLabel (COUNT(?artist) AS ?artistCount) WHERE {{
    ?artist wdt:P106 wd:Q177220.  # Selectăm artiști
    ?artist wdt:P27 ?country.
    {f'?artist wdt:P27 wd:{country_id}.' if country_id else ''}
    {f'?artist wdt:P136 wd:{genre_id}.' if genre_id else ''}
    
    # Legătura cu eticheta țării
    #?country rdfs:label ?countryLabel.
    #FILTER(LANG(?countryLabel) = "en")  # Asigurăm că eticheta este în limba engleză
    
    {f'OPTIONAL {{ ?artist wdt:P569 ?birth_date. }}' if from_year else ''}  # Data nașterii (dacă există)
    # Filtru pentru perioada de naștere, dacă variabilele from_year și to_year sunt specificate
    {f'FILTER (!BOUND(?birth_date) || YEAR(?birth_date) >= {from_year} && YEAR(?birth_date) <= {to_year}) ' if from_year is not None and to_year is not None else ''}
    SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?countryLabel
    ORDER BY DESC(?artistCount)
    LIMIT {limit_countries}
    """
    print(sparql_query)

    results = query_wikidata(sparql_query)
    print(results)
    by_country = []
    for result in results:
        country = result["countryLabel"]["value"]
        artist_count = int(result["artistCount"]["value"])
        by_country.append({"country": country.lower(), "count": artist_count})
    
    return by_country

def get_number_of_artists_by_genre(genre_id, country_id, from_year, to_year, limit_genres):
    sparql_query = f""" 
    SELECT ?genreLabel (COUNT(?artist) AS ?artistCount) WHERE {{
    ?artist wdt:P106 wd:Q177220.  # Selectăm artiști
    ?artist wdt:P136 ?genre.
    {f'?artist wdt:P27 wd:{country_id}.' if country_id else ''}
    {f'?artist wdt:P136 wd:{genre_id}.' if genre_id else ''}
    
    # Legătura cu eticheta țării
    ?genre rdfs:label ?genreLabel.
    FILTER(LANG(?genreLabel) = "en")  # Asigurăm că eticheta este în limba engleză
    
    OPTIONAL {{ ?artist wdt:P569 ?birth_date. }}  # Data nașterii (dacă există)
    # Filtru pentru perioada de naștere, dacă variabilele from_year și to_year sunt specificate
    {f'FILTER (!BOUND(?birth_date) || YEAR(?birth_date) >= {from_year} && YEAR(?birth_date) <= {to_year}) ' if from_year is not None and to_year is not None else ''}
    SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?genreLabel
    ORDER BY DESC(?artistCount)
    LIMIT {limit_genres}
    """
    print(sparql_query)

    results = query_wikidata(sparql_query)
    
    by_genre = []
    for result in results:
        genre = result["genreLabel"]["value"]
        artist_count = int(result["artistCount"]["value"])
        by_genre.append({"genre": genre.lower(), "count": artist_count})
    
    return by_genre

def get_number_of_artists_by_decade(genre_id, country_id, from_year, to_year):
    if from_year is None:
        from_year = 1990
    if to_year is None:
        to_year = 2025

    sparql_query = f"""
    SELECT ?decade (COUNT(?artist) AS ?artistCount) WHERE {{
    ?artist wdt:P106 wd:Q177220.  # Selectăm artiști
    {f'?artist wdt:P27 wd:{country_id}.' if country_id else ''}
    {f'?artist wdt:P136 wd:{genre_id}.' if genre_id else ''}

    ?artist wdt:P569 ?birth_date. # Data nașterii (dacă există)

    # Filtru pentru perioada de naștere, dacă variabilele from_year și to_year sunt specificate
    {f'FILTER (!BOUND(?birth_date) || YEAR(?birth_date) >= {from_year} && YEAR(?birth_date) <= {to_year}) ' if from_year is not None and to_year is not None else ''}
    
    BIND(
        IF(YEAR(?birth_date) >= FLOOR({to_year}/10)*10 && YEAR(?birth_date) <= {to_year}, 
        CONCAT(STR(FLOOR({to_year}/10)*10), "-", STR({to_year})),
        CONCAT(STR(FLOOR(YEAR(?birth_date)/10)*10), "-", STR(FLOOR(YEAR(?birth_date)/10)*10 + 9)))
         AS ?decade
    )
    
    SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    GROUP BY ?decade
    ORDER BY ?decade
    LIMIT 100
    """
    print(sparql_query)

    results = query_wikidata(sparql_query)
    
    by_decade = []
    for result in results:
        decade = result["decade"]["value"]
        artist_count = int(result["artistCount"]["value"])
        by_decade.append({"decade": decade, "count": artist_count})
    
    return by_decade

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

def query_wikidata(sparql_query):
    sparql_endpoint = "https://query.wikidata.org/sparql"
    headers = {"Accept": "application/json"}
    response = requests.get(sparql_endpoint, params={"query": sparql_query}, headers=headers)
    
    if response.status_code != 200:
        return None
    
    return response.json().get("results", {}).get("bindings", [])

