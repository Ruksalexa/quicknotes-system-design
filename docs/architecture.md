# QuickNotes Architecture

QuickNotes is moving from a browser-only app to an online service for 1 million users. This document describes the requirements, the expected load, and the architecture that can handle it.

## 1. Requirements

### Functional requirements

- Users can register and log in.
- Users can create, view, edit and delete their own notes.
- Users can add tags to notes and list notes by tag.
- Users can only see and change their own notes.

### Non-functional requirements

- **Availability:** the service should stay up at least 99.9% of the time.
- **Speed:** loading the notes list should take under 300 milliseconds for most requests.
- **Scalability:** it should handle growth from 1 million users and sudden busy periods.
- **Durability:** a saved note must never be lost, so the data is backed up.
- **Security:** all traffic uses HTTPS, passwords are hashed, and users cannot reach each other's notes.

## 2. Load estimate for 1 million users

### Assumptions

- 1,000,000 registered users.
- 20% are active each day, which is 200,000 daily active users.
- Each active user loads their notes 20 times a day and creates 5 notes a day.
- An average note takes about 1 KB of storage.
- There are 86,400 seconds in a day, and peak traffic is 5 times the average.

### Reads per second

- Reads per day: 200,000 x 20 = 4,000,000
- Average: 4,000,000 / 86,400 = about **46 reads per second**
- Peak (5x): about **230 reads per second**

### Writes per second

- Writes per day: 200,000 x 5 = 1,000,000
- Average: 1,000,000 / 86,400 = about **12 writes per second**
- Peak (5x): about **58 writes per second**

### Storage per year

- Per day: 1,000,000 notes x 1 KB = 1 GB
- Per year: 1 GB x 365 = about **365 GB**

Reads outnumber writes about 4 to 1, so QuickNotes is **read-heavy**. This is why the design uses a cache and a read replica.

## 3. Architecture diagram

```
              +----------------------+
              |  Client (browser or  |
              |      phone app)      |
              +----------------------+
                  |              |
                  v              |
              +-------+          |
              |  DNS  |          |
              +-------+          |
                  |              |
        +---------+---------+    |
        |                   |    |
        v                   v    v
   +---------+        +-----------------+
   |   CDN   |        |  Load Balancer  |
   | (static |        +-----------------+
   |  files) |           |            |
   +---------+           v            v
                   +-----------+ +-----------+
                   | App Server| | App Server|  (two or more)
                   |     1     | |     2     |
                   +-----------+ +-----------+
                      |    |         |    |
          +-----------+    |         |    +-----------+
          |                |         |                |
          v                v         v                v
      +-------+     +------------------+         +---------+
      | Cache |     | Primary Database |         |  Queue  |
      +-------+     +------------------+         +---------+
                           |                          |
                           | copies data              v
                           v                      +--------+
                    +--------------+              | Worker |
                    | Read Replica |              +--------+
                    +--------------+
```

The worker handles background jobs, such as sending email reminders and updating the search index. The app servers write to the primary database and read from the cache or the read replica.

## 4. What each component does

- **Client:** the browser or phone app where the user reads and writes notes.
- **DNS:** turns the website name (like quicknotes.com) into the address of our servers so users can find us.
- **CDN:** delivers the static files (HTML, CSS and JavaScript) from servers near the user, so pages load faster and our servers do less work.
- **Load balancer:** shares incoming requests across the app servers so none is overwhelmed and traffic keeps flowing if one fails.
- **App servers:** run the API code (login, create note, list notes) and can be added in numbers as traffic grows.
- **Cache:** keeps popular data, like a user's recent notes, in fast memory so the database does not repeat the same work.
- **Primary database:** stores all the data reliably and handles every write.
- **Read replica:** a live copy of the primary database that answers read queries, which takes the heavy read load off the primary.
- **Queue:** holds background jobs so the user does not have to wait for slow tasks.
- **Worker:** takes jobs from the queue and does them in the background, such as sending an email.

## 5. Request flows

### GET /notes (list notes)

1. The client asks DNS for the address of QuickNotes and sends the request.
2. The load balancer receives it and passes it to one of the app servers.
3. The app server checks the token to see who the user is.
4. The app server looks for this user's notes in the cache.
5. If they are in the cache, it returns them straight away.
6. If not, the app server reads the notes from the read replica.
7. The app server saves the result in the cache for next time.
8. The app server sends the notes back to the client as JSON with status 200.

### POST /notes (create a note)

1. The client sends the new note to the load balancer.
2. The load balancer passes it to an app server.
3. The app server checks the token and validates the data (the title is required and at most 100 characters).
4. The app server saves the note in the primary database.
5. The app server removes the user's old notes list from the cache, so the next read is fresh.
6. The app server puts a job on the queue, such as "update the search index for this note".
7. The app server replies to the client with status 201 and the new note.
8. A worker takes the job from the queue and does it in the background.
9. The primary database copies the new note to the read replica.
