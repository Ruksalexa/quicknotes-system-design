# QuickNotes API Design

This is the design of the real QuickNotes API that the backend team should build. It is a REST API that sends and receives JSON. All paths start with `/api/v1`, and every request except login needs a token in the header: `Authorization: Bearer <token>`.

## Endpoints

| Method | Path                      | Description                                    | Success status |
| ------ | ------------------------- | ---------------------------------------------- | -------------- |
| POST   | `/api/v1/auth/login`      | Log in with email and password and get a token | 200 OK         |
| GET    | `/api/v1/notes`           | List the logged-in user's notes                | 200 OK         |
| GET    | `/api/v1/notes?tag=study` | List only the notes that have a given tag      | 200 OK         |
| GET    | `/api/v1/notes/{id}`      | Get one note by its id                         | 200 OK         |
| POST   | `/api/v1/notes`           | Create a new note                              | 201 Created    |
| PUT    | `/api/v1/notes/{id}`      | Update an existing note                        | 200 OK         |
| DELETE | `/api/v1/notes/{id}`      | Delete a note                                  | 204 No Content |

## Examples

### Create a note

**Request:** `POST /api/v1/notes`

```json
{
  "title": "Revise databases",
  "body": "Practise JOIN and GROUP BY queries.",
  "tags": ["study", "sql"]
}
```

**Response:** `201 Created`

```json
{
  "id": 42,
  "title": "Revise databases",
  "body": "Practise JOIN and GROUP BY queries.",
  "tags": ["study", "sql"],
  "user_id": 7,
  "created_at": "2026-11-02T10:30:00Z"
}
```

### List notes

**Request:** `GET /api/v1/notes`

**Response:** `200 OK`

```json
{
  "notes": [
    {
      "id": 42,
      "title": "Revise databases",
      "body": "Practise JOIN and GROUP BY queries.",
      "tags": ["study", "sql"],
      "created_at": "2026-11-02T10:30:00Z"
    },
    {
      "id": 41,
      "title": "Buy groceries",
      "body": "Milk, bread, eggs and rice.",
      "tags": ["personal"],
      "created_at": "2026-11-01T18:05:00Z"
    }
  ],
  "total": 2
}
```

## Error codes

Every error returns a JSON body in this shape:

```json
{
  "error": {
    "code": 400,
    "message": "Title is required."
  }
}
```

| Status                    | Meaning                               | Example of when it happens                                               |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| 400 Bad Request           | The request data is missing or wrong  | `POST /notes` with an empty title, or a title longer than 100 characters |
| 401 Unauthorized          | The user is not logged in             | Any request with no token, or with an expired token                      |
| 403 Forbidden             | The user is logged in but not allowed | User 7 tries to `DELETE /notes/50` when note 50 belongs to user 8        |
| 404 Not Found             | The thing asked for does not exist    | `GET /notes/9999` when there is no note with id 9999                     |
| 500 Internal Server Error | Something broke on the server         | The database is down while a note is being saved                         |

### Example error bodies

**404 Not Found**

```json
{
  "error": {
    "code": 404,
    "message": "Note with id 9999 was not found."
  }
}
```

**401 Unauthorized**

```json
{
  "error": {
    "code": 401,
    "message": "Please log in to continue."
  }
}
```
