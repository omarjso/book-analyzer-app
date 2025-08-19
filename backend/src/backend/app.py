import json
from collections import Counter

import requests
from flask import Flask, jsonify, Response
from flask_cors import CORS

from backend.analyzer import analyze_chunk


def content_url(book_id):
    return f"https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt"


def metadata_url(book_id):
    return f"https://www.gutenberg.org/ebooks/{book_id}"


app = Flask(__name__)
CORS(app)


@app.route("/api/health")
def health_check():
    """A simple endpoint to check if the backend is running."""
    return jsonify({"status": "healthy", "message": "Backend is running!"})


@app.route("/api/book/<int:book_id>")
def get_book(book_id) -> Response:
    try:
        r = requests.get(content_url(book_id))
        r.raise_for_status()
        resp = jsonify({"content": r.text})
        resp.status_code = 200
        return resp
    except requests.RequestException as e:
        resp = jsonify({"error": f"Failed to fetch book: {e}"})
        resp.status_code = 404
        return resp


@app.route("/api/analyze/<int:book_id>")
def analyze_book(book_id) -> Response:
    resp = get_book(book_id)
    if resp.status_code != 200:
        return resp

    data = resp.get_json()
    content = data["content"]
    sample_text = content[:20000]

    chunk_size = 2000
    chunks = [
        sample_text[i : i + chunk_size] for i in range(0, len(sample_text), chunk_size)
    ]

    all_interactions = []
    character_counts = Counter()

    for chunk in chunks:
        try:
            analysis_str = analyze_chunk(chunk)
            # Sanity check to ensure the analysis_str is valid JSON
            start = analysis_str.find("{")
            end = analysis_str.rfind("}") + 1
            if start != -1 and end != -1:
                analysis_json = json.loads(analysis_str[start:end])
                for char in analysis_json.get("characters", []):
                    character_counts[char] += 1
                all_interactions.extend(analysis_json.get("interactions", []))
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Skipping a chunk due to parsing error: {e}")
            continue

    nodes = [{"id": name, "value": count} for name, count in character_counts.items()]

    links = [
        {"source": i[0], "target": i[1]}
        for i in all_interactions
        if len(i) == 2 and i[0] in character_counts and i[1] in character_counts
    ]

    return jsonify({"nodes": nodes, "links": links})


def main():
    app.run(debug=True, port=5001)


if __name__ == "__main__":
    main()
