QuickNotes System Design

QuickNotes is a note-taking app that is moving from a browser-only app to an online service for 1 million users. This project has two parts. The first is a small web page that talks to a practice API (JSONPlaceholder) to load, create and delete notes. The second is a set of design documents describing the real API, database and architecture that the backend team would build.

Features
Load 10 notes from the API with a GET request
Create a note with a POST request, with validation (a title is required, maximum 100 characters)
Delete a note with a DELETE request
Loading, success, error and empty messages shown on the page
Buttons are disabled while a request is running
How to run the API client
Download or clone this repository.
Open the folder in VS Code.
Open index.html in a browser (or right-click it and choose "Open with Live Server").
Click Load notes to fetch the notes, use the form to add a note, and click Delete to remove one.

No install is needed, but you need an internet connection because the page calls the JSONPlaceholder API.

Note: JSONPlaceholder does not really save the notes you create or delete. It only pretends to, so the page updates its own list after the server replies.

Design documents
API design: the REST endpoints, JSON examples and error codes
Data model: the tables, relationships, SQL, an index and the SQL vs NoSQL choice
Architecture: requirements, load estimates, the diagram, request flows and trade-offs
What I learned
How to use fetch with async and await, and why response.ok must be checked because a failed request does not always throw an error by itself.
How to use try, catch and finally so the page shows friendly error messages and the buttons always get enabled again.
How a REST API is designed, with methods, paths and status codes such as 201 for created and 404 for not found.
How a many-to-many relationship (notes and tags) needs a join table to work in a database.
How a cache, a read replica, a load balancer and a queue help a system handle a lot of users, and that each one has a trade-off.
