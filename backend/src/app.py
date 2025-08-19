from flask import Flask, jsonify
import requests
from flask_cors import CORS


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
def get_book(book_id):
    """Endpoint to visualize the book."""
    try:
        content_response = requests.get(content_url(book_id))
        content_response.raise_for_status()
        return jsonify({"success": True, "content": content_response.text})
    except requests.RequestException as e:
        return jsonify(
            {"success": False, "error": "Falied to fetch book: " + str(e)}
        ), 404


if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Running on a different port than React
