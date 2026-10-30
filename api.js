const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

let notes = [];
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

async function request(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  const data = await response.json();
  return { status: response.status, data: data };
}


function render() {
  notesList.textContent = "";

 
  if (notes.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No notes to show yet.";
    notesList.appendChild(emptyItem);
    return;
  }

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];

    const li = document.createElement("li");

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", function () {
      deleteNote(note, deleteBtn);
    });

    li.appendChild(title);
    li.appendChild(body);
    li.appendChild(deleteBtn);
    notesList.appendChild(li);
  }
}

async function loadNotes() {
  showStatus("Loading notes...", "loading");
  loadBtn.disabled = true;

  try {
    const result = await request(API_URL + "?_limit=10");
    notes = result.data;
    render();
    showStatus("Loaded " + notes.length + " notes from the server.", "success");
  } catch (error) {
    showStatus("Sorry, we could not load the notes. Please try again.", "error");
  } finally {
    loadBtn.disabled = false;
  }
}


async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

 
  if (title === "") {
    showStatus("Please enter a title.", "error");
    return;
  }

  if (title.length > 100) {
    showStatus("Title must be 100 characters or fewer.", "error");
    return;
  }

  showStatus("Creating note...", "loading");
  submitBtn.disabled = true;

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, body: body, userId: 1 })
    });

    // Add the new note to the top of the list
    notes.unshift(result.data);
    render();
    showStatus("Note created (status " + result.status + ", id " + result.data.id + ").", "success");

    // Clear the form
    titleInput.value = "";
    bodyInput.value = "";
  } catch (error) {
    showStatus("Sorry, we could not create the note. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

async function deleteNote(note, button) {
  showStatus("Deleting note...", "loading");
  button.disabled = true;

  try {
    await request(API_URL + "/" + note.id, { method: "DELETE" });

    notes = notes.filter(function (n) {
      return n !== note;
    });
    render();
    showStatus("Note deleted.", "success");
  } catch (error) {
    showStatus("Sorry, we could not delete the note. Please try again.", "error");
  } finally {
    button.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

render();