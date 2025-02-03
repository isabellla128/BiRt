import datetime
import requests
import json

NEPTUNE_ENDPOINT = "neptune-db-cluster.cluster-c5suku4e6g43.eu-north-1.neptune.amazonaws.com"
PORT = 8182
HEADERS = {"Content-Type": "application/x-www-form-urlencoded"}

def lambda_handler(event, context):
    now = datetime.datetime.utcnow()
    threshold = now - datetime.timedelta(hours=24)
    threshold_iso = threshold.isoformat() + "Z"

    # Acest query va șterge toate triplele (subiect-predicat-obiect)
    # pentru orice subiect care are un schema:dateModified mai vechi decât threshold_iso
    sparql_query = f"""
    PREFIX schema: <http://schema.org/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    DELETE {{
      ?s ?p ?o .
    }}
    WHERE {{
      ?s schema:dateModified ?dateModified .
      FILTER(xsd:dateTime(?dateModified) < xsd:dateTime("{threshold_iso}"))
      ?s ?p ?o .
    }}
    """

    url = f"https://{NEPTUNE_ENDPOINT}:{PORT}/sparql"
    
    response = requests.post(url, data={"update": sparql_query}, headers=HEADERS)

    print("SPARQL Query:")
    print(sparql_query)
    print("Response Status Code:", response.status_code)
    print("Response Text:", response.text)

    if response.status_code == 200:
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Expired data deleted successfully."})
        }
    else:
        return {
            "statusCode": response.status_code,
            "body": json.dumps({"message": "Error deleting expired data", "details": response.text})
        }
