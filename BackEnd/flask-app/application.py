from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3
import json

application = Flask(__name__)
CORS(application)
lambda_client = boto3.client('lambda', region_name='eu-north-1')

@application.route('/')
def hello():
    return 'Hello, World!'

@application.route('/invoke-lambda')
def invoke_lambda():
    response = {'message': 'Lambda invocata cu succes!'}
    return jsonify(response)

@application.route('/artists')
def get_artists():
    country = request.args.get('country', '')
    genre = request.args.get('genre', '')
    from_to = request.args.get('from-to', '')

    params = {
        "country": country,
        "genre": genre,
        "from-to": from_to
    }

    try:
        response = lambda_client.invoke(
            FunctionName='GetArtists',
            InvocationType='RequestResponse',
            Payload = json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')

        json_response = json.loads(response_payload)

        if json_response.get("statusCode") == 200:
            return json_response.get("body"), 200
        else:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application.route('/artists/<string:id>', methods=['GET'])
def get_artist_by_id(id):
    params = {"id": id}

    accept_header = request.headers.get('Accept')
    if accept_header:
        params["Accept"] = accept_header

    try:
        response = lambda_client.invoke(
            FunctionName='GetArtistById',
            InvocationType='RequestResponse',
            Payload=json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')
        json_response = json.loads(response_payload)

        if json_response.get('statusCode') != 200:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

        return json_response.get('body'), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/artists/<string:id>/recommend', methods=['GET'])
def recommend_artists_by_artist_id(id):
    params = {"id": id}
    try:
        response = lambda_client.invoke(
            FunctionName='RecommendArtistsByArtistId',
            InvocationType='RequestResponse',
            Payload = json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')

        json_response = json.loads(response_payload)

        if json_response.get("statusCode") == 200:
            return json_response.get("body"), 200
        else:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application.route('/genres')
def get_genres():
    country = request.args.get('country', '')

    params = {
        "country": country
    }

    try:
        response = lambda_client.invoke(
            FunctionName='GetGenres',
            InvocationType='RequestResponse',
            Payload = json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')

        json_response = json.loads(response_payload)

        if json_response.get("statusCode") == 200:
            return json_response.get("body"), 200
        else:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/genres/<string:id>', methods=['GET'])
def get_genre_by_id(id):
    params = {"id": id}

    accept_header = request.headers.get('Accept')
    if accept_header:
        params["Accept"] = accept_header

    try:
        response = lambda_client.invoke(
            FunctionName='GetGenreById',
            InvocationType='RequestResponse',
            Payload=json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')
        json_response = json.loads(response_payload)

        if json_response.get('statusCode') != 200:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

        return json_response.get('body'), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/genres/<string:id>/recommendGenres', methods=['GET'])
def recommend_genres_by_genre_id(id):
    params = {"id": id}
    try:
        response = lambda_client.invoke(
            FunctionName='RecommendGenresByGenreId',
            InvocationType='RequestResponse',
            Payload = json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')

        json_response = json.loads(response_payload)

        if json_response.get("statusCode") == 200:
            return json_response.get("body"), 200
        else:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/genres/<string:id>/recommendArtists', methods=['GET'])
def recommend_artists_by_genre_id(id):
    params = {"id": id}
    try:
        response = lambda_client.invoke(
            FunctionName='RecommendArtistsByGenreId',
            InvocationType='RequestResponse',
            Payload = json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')

        json_response = json.loads(response_payload)

        if json_response.get("statusCode") == 200:
            return json_response.get("body"), 200
        else:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/artists/summarize')
def get_artists_summarize():
    country = request.args.get('country', '')
    genre = request.args.get('genre', '')
    from_to = request.args.get('from-to', '')
    limit_countries = request.args.get('limit-countries', '')
    limit_genres = request.args.get('limit-genres', '')

    params = {
        "country": country,
        "genre": genre,
        "from-to": from_to,
        "limit-countries": limit_countries,
        "limit-genres": limit_genres
    }

    try:
        response = lambda_client.invoke(
            FunctionName='SummarizeArtistsInfo',
            InvocationType='RequestResponse',
            Payload = json.dumps(params)
        )

        response_payload = response['Payload'].read().decode('utf-8')

        json_response = json.loads(response_payload)

        if json_response.get("statusCode") == 200:
            return json_response.get("body"), 200
        else:
            error_message = json_response.get("message", "An unknown error occurred.")
            return jsonify({'error': error_message}), json_response.get("statusCode", 500)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    application.run(host='0.0.0.0', port=5000)
