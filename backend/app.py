from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/api/health")
def health_check():
    """A simple endpoint to check if the backend is running."""
    return jsonify({"status": "healthy", "message": "Backend is running!"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Running on a different port than React
