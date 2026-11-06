// Task Manager – talks to the Supabase REST API (PostgREST) with fetch().
// Settings are read from config.json so the key is not hardcoded here.

let apiBase = "";
let apiHeaders = {};
let editingId = null; // null = form creates a new task, number = form edits that task

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descriptionInput = document.getElementById("task-description");
const submitButton = document.getElementById("task-submit");
const cancelButton = document.getElementById("task-cancel");
const taskList = document.getElementById("task-list");
const statusMessage = document.getElementById("status-message");

// ---------- helpers ----------

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

async function loadConfig() {
  const response = await fetch("config.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      "Could not load config.json (HTTP " + response.status + ").",
    );
  }
  const config = await response.json();
  const baseUrl = config.supabaseUrl.replace(/\/+$/, "");
  apiBase = baseUrl + "/rest/v1/" + config.tableName;
  apiHeaders = {
    apikey: config.supabasePublishableKey,
    "Content-Type": "application/json",
  };
}

// Sends one request to the REST API and returns the parsed JSON (or null).
async function api(method, query = "", body) {
  const options = {
    method,
    headers: { ...apiHeaders, Prefer: "return=representation" },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(apiBase + query, options);
  const text = await response.text();

  if (!response.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.message || text;
    } catch (_) {
      // response was not JSON, keep the raw text
    }
    throw new Error(
      method + " failed (HTTP " + response.status + "): " + detail,
    );
  }

  return text ? JSON.parse(text) : null;
}

// ---------- REST operations ----------

// GET /tasks?select=*
function getAllTasks() {
  return api("GET", "?select=*&order=id.asc");
}

// GET /tasks?id=eq.1&select=*
async function getTaskById(id) {
  const rows = await api("GET", "?id=eq." + id + "&select=*");
  if (!rows || rows.length === 0) {
    throw new Error("Task " + id + " was not found. It may have been deleted.");
  }
  return rows[0];
}

// POST /tasks
function createTask(title, description) {
  return api("POST", "", { title, description, completed: false });
}

// PUT /tasks?id=eq.1 – sends the complete record
function saveTask(task) {
  return api("PUT", "?id=eq." + task.id, {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
  });
}

// DELETE /tasks?id=eq.1
function deleteTask(id) {
  return api("DELETE", "?id=eq." + id);
}

// ---------- rendering ----------

function renderTasks(tasks) {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent =
      "No tasks yet. Add your first task with the form above.";
    taskList.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement("article");
    item.className = "task-item" + (task.completed ? " is-done" : "");
    item.dataset.id = task.id;

    const title = document.createElement("h2");
    title.className = "task-title";
    title.textContent = task.title;

    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description || "";

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = task.completed ? "Completed" : "Not completed";

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "toggle-task";
    toggleButton.textContent = task.completed
      ? "Mark as incomplete"
      : "Mark as completed";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-task";
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-task danger";
    deleteButton.textContent = "Delete";

    actions.append(toggleButton, editButton, deleteButton);
    item.append(title, description, status, actions);
    taskList.appendChild(item);
  }
}

async function refreshTasks() {
  const tasks = await getAllTasks();
  renderTasks(tasks);
  return tasks;
}

function resetForm() {
  editingId = null;
  form.reset();
  submitButton.textContent = "Add task";
  cancelButton.hidden = true;
}

// ---------- event handlers ----------

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim() || null;

  if (!title) {
    setStatus("Enter a title before saving the task.", true);
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  try {
    if (editingId === null) {
      await createTask(title, description);
      setStatus("Task added.");
    } else {
      const current = await getTaskById(editingId);
      await saveTask({ ...current, title, description });
      setStatus("Task updated.");
    }
    resetForm();
    await refreshTasks();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

cancelButton.addEventListener("click", () => {
  resetForm();
  setStatus("Editing cancelled.");
});

taskList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const item = button.closest(".task-item");
  const id = Number(item.dataset.id);

  try {
    if (button.classList.contains("edit-task")) {
      const task = await getTaskById(id);
      editingId = task.id;
      titleInput.value = task.title;
      descriptionInput.value = task.description || "";
      submitButton.textContent = "Save changes";
      cancelButton.hidden = false;
      titleInput.focus();
      setStatus("Editing task " + task.id + ".");
    } else if (button.classList.contains("toggle-task")) {
      const task = await getTaskById(id);
      await saveTask({ ...task, completed: !task.completed });
      setStatus(
        task.completed
          ? "Task marked as incomplete."
          : "Task marked as completed.",
      );
      await refreshTasks();
    } else if (button.classList.contains("delete-task")) {
      if (!confirm("Delete this task?")) return;
      await deleteTask(id);
      if (editingId === id) resetForm();
      setStatus("Task deleted.");
      await refreshTasks();
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

// ---------- start ----------

(async function init() {
  setStatus("Loading tasks…");
  try {
    await loadConfig();
    const tasks = await refreshTasks();
    setStatus(tasks.length + " task(s) loaded.");
  } catch (error) {
    setStatus(error.message, true);
  }
})();
