from collections import Counter, defaultdict

import requests
from flask import Flask, Response, jsonify
from flask_caching import Cache
from flask_cors import CORS

from backend.analyzer import analyze_chunk

MAX_CHAR_TO_ANALYZE = 20000
CHUNK_SIZE = 2000


def content_url(book_id):
    return f"https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt"


def metadata_url(book_id):
    return f"https://www.gutenberg.org/ebooks/{book_id}"


app = Flask(__name__)
CORS(app)
cache = Cache(app, config={"CACHE_TYPE": "SimpleCache"})


@app.route("/api/health")
def health_check():
    """A simple endpoint to check if the backend is running."""
    return jsonify({"status": "healthy", "message": "Backend is running!"})


@app.route("/api/book/<int:book_id>")
@cache.cached(timeout=3600)
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
@cache.cached(timeout=86400)
def analyze_book(book_id) -> Response:
    resp = get_book(book_id)
    if resp.status_code != 200:
        return resp

    content = resp.get_json()["content"]
    sample_text = content[:MAX_CHAR_TO_ANALYZE]

    chunk_size = CHUNK_SIZE
    chunks = [
        sample_text[i : i + chunk_size] for i in range(0, len(sample_text), chunk_size)
    ]

    character_counts = Counter()
    link_counts = defaultdict(int)
    pair_sentiment_sum = defaultdict(float)

    # TODO: merging chunks could be handled by the LLM to resolve character aliases
    for chunk in chunks:
        analysis = analyze_chunk(chunk)
        for c in analysis.characters:
            k = c.strip().lower()
            if k:
                character_counts[k] += 1

        for it in analysis.interactions:
            a = it.source.strip().lower()
            b = it.target.strip().lower()
            if not a or not b or a == b:
                continue
            key = tuple(sorted((a, b)))
            link_counts[key] += 1
            pair_sentiment_sum[key] += float(it.sentiment_score or 0.0)

    nodes = [
        {"id": name, "name": name, "value": count}
        for name, count in character_counts.items()
    ]

    links = []
    for (a, b), cnt in link_counts.items():
        if a in character_counts and b in character_counts:
            avg = (pair_sentiment_sum[(a, b)] / cnt) if cnt else None
            links.append(
                {"source": a, "target": b, "count": cnt, "sentiment_score": avg}
            )

    return jsonify({"nodes": nodes, "links": links})


def main():
    app.run(debug=True, port=5001)


if __name__ == "__main__":
    main()
