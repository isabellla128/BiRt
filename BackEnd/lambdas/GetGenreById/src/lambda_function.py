import json
import requests
import boto3

def lambda_handler(event, context):

    accept_header = event.get("Accept", "application/json")
    print("Accept header:", accept_header)
    genre_id = event.get("id")
    
    if not genre_id:
        return {
            "statusCode": 400,
            "message": "Genre ID is required."
        }

    query_details = f"""
      SELECT ?genre ?genreLabel 
            (SAMPLE(STR(?image)) AS ?image) 
            (COALESCE(MIN(?wikipediaLink), "") AS ?wikipediaLink)
            ?description 
      WHERE {{
        VALUES ?genre {{ {genre_id} }}  
        ?genre wdt:P31 wd:Q188451.
        
        SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        
        OPTIONAL {{ ?genre wdt:P18 ?image. }}
        
        OPTIONAL {{
          ?link schema:about ?genre;  
                schema:inLanguage "en".
          BIND(IF(CONTAINS(STR(?link), "wikipedia.org"), ?link, "") AS ?wikipediaLink)
        }}
        
        OPTIONAL {{
          ?genre schema:description ?description FILTER(LANG(?description) = "en").
        }}
      }}
      GROUP BY ?genre ?genreLabel ?description
      LIMIT 1
      """

      # Interogări separate pentru subgenuri, țări, categorii părinte și superclase
    query_subgenres = f"""
    SELECT DISTINCT ?subgenre ?subgenreLabel WHERE {{
      ?subgenre wdt:P31 wd:Q188451.
      ?subgenre wdt:P279 {genre_id}.  
      ?subgenre rdfs:label ?subgenreLabel FILTER(LANG(?subgenreLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    """

    query_countries = f"""
    SELECT DISTINCT ?country ?countryLabel WHERE {{
      {genre_id} wdt:P495 ?country.
      ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    """

    query_parent_categories = f"""
    SELECT DISTINCT ?parentCategory ?parentCategoryLabel WHERE {{
      {genre_id} wdt:P31 ?parentCategory.
      ?parentCategory rdfs:label ?parentCategoryLabel FILTER(LANG(?parentCategoryLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    """

    query_superclasses = f"""
    SELECT DISTINCT ?superclass ?superclassLabel WHERE {{
      {genre_id} wdt:P279 ?superclass.
      ?superclass rdfs:label ?superclassLabel FILTER(LANG(?superclassLabel) = "en").
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    """

    genre_data = execute_query_wikidata(query_details)
    subgenres_data = execute_query_wikidata(query_subgenres)
    countries_data = execute_query_wikidata(query_countries)
    parent_categories_data = execute_query_wikidata(query_parent_categories)
    superclasses_data = execute_query_wikidata(query_superclasses)

    if not genre_data:
        return {
            "statusCode": 404,
            "message": "Genre not found."
        }

    genre_info = genre_data[0]
    genre = {
        "id": genre_id,
        "label": genre_info["genreLabel"]["value"],
        "image": genre_info.get("image", {}).get("value", None),
        "wikipediaLink": genre_info["wikipediaLink"]["value"] if "wikipediaLink" in genre_info else None,
        "description": genre_info["description"]["value"] if "description" in genre_info else None,
        "subgenres": [{"id": f"wd:{g['subgenre']['value'].split('/')[-1]}", "label": g["subgenreLabel"]["value"]} for g in subgenres_data],
        "countries": [{"id": f"wd:{c['country']['value'].split('/')[-1]}", "label": c["countryLabel"]["value"]} for c in countries_data],
        "parentCategories": [{"id": f"wd:{p['parentCategory']['value'].split('/')[-1]}", "label": p["parentCategoryLabel"]["value"]} for p in parent_categories_data],
        "superclasses": [{"id": f"wd:{s['superclass']['value'].split('/')[-1]}", "label": s["superclassLabel"]["value"]} for s in superclasses_data],
    }

    if "application/rdf+xml" in accept_header:
        rdf_data = format_as_rdf(genre)
        return {"statusCode": 200, "headers": {"Content-Type": "application/rdf+xml"}, "body": rdf_data}

    return {
        "statusCode": 200,
        "body": json.dumps(genre)
    }

def format_as_rdf(genre):
    rdf_template = f"""<?xml version="1.0"?>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/"
             xmlns:foaf="http://xmlns.com/foaf/0.1/"
             xmlns:wd="http://www.wikidata.org/entity/"
             xmlns:wdt="http://www.wikidata.org/prop/direct/"
             xmlns:skos="http://www.w3.org/2004/02/skos/core#">

      <rdf:Description rdf:about=http://www.wikidata.org/entity/{genre["id"].replace("wd:", "")}>
        <skos:prefLabel>{genre['label']}</skos:prefLabel>
        <dc:description>{genre.get('description', 'No description available')}</dc:description>
        {"<foaf:depiction rdf:resource=\"" + genre['image'] + "\"/>" if genre.get("image") else ""}
        {"<dc:source rdf:resource=\"" + genre['wikipediaLink'] + "\"/>" if genre.get("wikipediaLink") else ""}

        <!-- Subgenres (P279 - subclass of) -->
        {"".join([f'<wdt:P279 rdf:resource="http://www.wikidata.org/entity/{sub["id"].replace("wd:", "")}"/>' for sub in genre.get("subgenres", [])])}

        <!-- Countries of origin (P495) -->
        {"".join([f'<wdt:P495 rdf:resource="http://www.wikidata.org/entity/{country["id"].replace("wd:", "")}"/>' for country in genre.get("countries", [])])}

        <!-- Parent categories (P31 - instance of) -->
        {"".join([f'<wdt:P31 rdf:resource="http://www.wikidata.org/entity/{parent["id"].replace("wd:", "")}"/>' for parent in genre.get("parentCategories", [])])}

        <!-- Superclasses (P279 - subclass of) -->
        {"".join([f'<wdt:P279 rdf:resource="http://www.wikidata.org/entity/{superclass["id"].replace("wd:", "")}"/>' for superclass in genre.get("superclasses", [])])}
      </rdf:Description>
    </rdf:RDF>"""
    
    return rdf_template



def execute_query_wikidata(sparql_query):
    sparql_endpoint = "https://query.wikidata.org/sparql"
    headers = {"Accept": "application/json"}
    response = requests.get(sparql_endpoint, params={"query": sparql_query}, headers=headers)
    
    if response.status_code != 200:
        return None
    
    return response.json().get("results", {}).get("bindings", [])
