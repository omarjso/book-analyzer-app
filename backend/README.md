# API Endpoints

All routes are prefixed with `/api`.

## `GET /api/health`

Health check endpoint.

**Response 200**

```json
{ "status": "healthy", "message": "Backend is running!" }
```

---

## `GET /api/book/<book_id>`

Fetch raw Gutenberg book text (cached for 1 hour).

- **Params:** `book_id` – Gutenberg book ID (e.g., `1342` for _Pride and Prejudice_).
- **Response 200**

  ```json
  { "content": "full text of book..." }
  ```

- **Response 404** – if fetch failed.

---

## `GET /api/analyze/<book_id>`

Run character + interaction analysis (cached for 24 hours).

- **Params:** `book_id` – Gutenberg book ID.
- **Response 200**

  ```json
  {
    "nodes": [
      { "id": "elizabeth", "name": "elizabeth", "value": 128 },
      { "id": "darcy", "name": "darcy", "value": 97 }
    ],
    "links": [
      {
        "source": "elizabeth",
        "target": "darcy",
        "count": 34,
        "sentiment_score": 0.42
      }
    ]
  }
  ```
