# QuickNotes Data Model

The database has four tables: `users`, `notes`, `tags` and `note_tags`.

## Entities

### users

Stores the people who use QuickNotes.

| Column        | Type    | Notes                                                                    |
| ------------- | ------- | ------------------------------------------------------------------------ |
| id            | INTEGER | Primary key                                                              |
| name          | TEXT    | Required                                                                 |
| email         | TEXT    | Required and unique                                                      |
| password_hash | TEXT    | Required. The password is stored scrambled (hashed), never as plain text |
| created_at    | TEXT    | Required. Date and time the account was made                             |

### notes

Stores every note.

| Column     | Type    | Notes                                 |
| ---------- | ------- | ------------------------------------- |
| id         | INTEGER | Primary key                           |
| user_id    | INTEGER | Required. Foreign key to `users(id)`  |
| title      | TEXT    | Required, maximum 100 characters      |
| body       | TEXT    | Optional                              |
| created_at | TEXT    | Required                              |
| updated_at | TEXT    | Optional. Set when the note is edited |

### tags

Stores the labels that can be put on notes, such as "study" or "work".

| Column | Type    | Notes               |
| ------ | ------- | ------------------- |
| id     | INTEGER | Primary key         |
| name   | TEXT    | Required and unique |

### note_tags

The join table that links notes and tags.

| Column  | Type    | Notes                      |
| ------- | ------- | -------------------------- |
| note_id | INTEGER | Foreign key to `notes(id)` |
| tag_id  | INTEGER | Foreign key to `tags(id)`  |

Its primary key is the pair (`note_id`, `tag_id`), so the same tag cannot be added to the same note twice.

## Relationships

- **One-to-many (users and notes):** one user can have many notes, but each note belongs to exactly one user. This is why `notes` has a `user_id` foreign key.
- **Many-to-many (notes and tags):** one note can have many tags, and one tag can be used on many notes. A single table cannot store this properly, so the `note_tags` join table holds one row for each note and tag pair.

## CREATE TABLE statements

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

## Example queries

### 1. All notes for one user (newest first)

```sql
SELECT id, title, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

### 2. All notes that have the tag "study" (uses JOIN)

```sql
SELECT notes.id, notes.title
FROM notes
JOIN note_tags ON notes.id = note_tags.note_id
JOIN tags ON note_tags.tag_id = tags.id
WHERE tags.name = 'study';
```

### 3. The number of notes each user has (uses JOIN and GROUP BY)

```sql
SELECT users.name, COUNT(notes.id) AS number_of_notes
FROM users
LEFT JOIN notes ON users.id = notes.user_id
GROUP BY users.id;
```

## Index

I would add an index on `notes(user_id)`:

```sql
CREATE INDEX idx_notes_user_id ON notes(user_id);
```

The reason is that almost every request asks for "the notes of this user", so the database searches the `notes` table by `user_id` all the time. Without an index it would read every row in the table, which gets very slow with millions of notes. With the index it can jump straight to that user's notes.

## SQL or NoSQL?

I would choose SQL for QuickNotes. The data is structured and has clear relationships (users own notes, and notes have tags), and SQL handles these well with foreign keys and joins. Rules like unique emails and "a tag can only be added once to a note" are enforced by the database itself, which keeps the data correct. Queries such as "all notes with a tag" need to combine tables, and this is natural in SQL. At 1 million users the amount of data is small enough for a single SQL database with a read replica, so we do not need the extra scaling features of NoSQL.
