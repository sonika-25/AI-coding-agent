// script.js – Colorful Todo App implementation
// -------------------------------------------------
// This script provides the full application logic for the Colorful Todo app.
// It defines the Todo data model, state management, persistence, CRUD
// operations, rendering, filtering, accent‑color handling, and exports a
// debugging interface.

// -------------------------------------------------
// Data Model
// -------------------------------------------------
/**
 * Represents a single todo item.
 * @class
 */
class Todo {
  /**
   * @param {Object} param0
   * @param {string} param0.id - UUID string.
   * @param {string} param0.title
   * @param {string} [param0.description]
   * @param {boolean} [param0.completed]
   * @param {number} [param0.createdAt] - Timestamp (ms since epoch).
   */
  constructor({ id, title, description = '', completed = false, createdAt = Date.now() }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.createdAt = createdAt;
  }

  /**
   * Create a Todo instance from a plain object (e.g., parsed JSON).
   * @param {Object} obj
   * @returns {Todo}
   */
  static fromObject(obj) {
    // Ensure all required properties exist; provide defaults for missing ones.
    return new Todo({
      id: obj.id,
      title: obj.title,
      description: obj.description ?? '',
      completed: obj.completed ?? false,
      createdAt: obj.createdAt ?? Date.now()
    });
  }
}

// -------------------------------------------------
// State Management
// -------------------------------------------------
/** @type {Todo[]} */
let todos = [];
/** @type {'all'|'active'|'completed'} */
let currentFilter = 'all';

// -------------------------------------------------
// DOM References (must match IDs from index.html)
// -------------------------------------------------
const form = document.getElementById('todo-form');
const titleInput = document.getElementById('todo-title');
const descInput = document.getElementById('todo-description');
const listEl = document.getElementById('todo-list');
const template = document.getElementById('todo-item-template');
const filterButtons = {
  all: document.getElementById('filter-all'),
  active: document.getElementById('filter-active'),
  completed: document.getElementById('filter-completed')
};
const accentPicker = document.getElementById('accent-color-picker');

// -------------------------------------------------
// Persistence Helpers
// -------------------------------------------------
function saveTodos() {
  try {
    localStorage.setItem('colorfulTodo', JSON.stringify(todos));
  } catch (e) {
    console.error('Failed to save todos to localStorage', e);
  }
}

function loadTodos() {
  // Load accent color first (so UI reflects it immediately)
  const savedAccent = localStorage.getItem('todoAccentColor');
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent-color', savedAccent);
    if (accentPicker) accentPicker.value = savedAccent;
  }

  const raw = localStorage.getItem('colorfulTodo');
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      todos = arr.map(obj => Todo.fromObject(obj));
    } catch (e) {
      console.error('Failed to parse todos from localStorage', e);
      todos = [];
    }
  }
  renderTodos();
}

// -------------------------------------------------
// CRUD Operations
// -------------------------------------------------
function generateUUID() {
  // Simple UUID v4 generator (not cryptographically strong but sufficient for demo)
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function addTodo(title, description = '') {
  const newTodo = new Todo({
    id: generateUUID(),
    title: title.trim(),
    description: description.trim()
  });
  todos.push(newTodo);
  saveTodos();
  // Render only the new item for efficiency
  const el = createTodoElement(newTodo);
  listEl.appendChild(el);
}

function updateTodo(id, updates) {
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) return;
  const todo = todos[index];
  // Merge updates (only allow known fields)
  if (typeof updates.title === 'string') todo.title = updates.title.trim();
  if (typeof updates.description === 'string') todo.description = updates.description.trim();
  if (typeof updates.completed === 'boolean') todo.completed = updates.completed;
  // Persist and re‑render the list (simple approach)
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  const li = listEl.querySelector(`li[data-id="${id}"]`);
  if (!li) {
    // Still remove from state even if element missing
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    return;
  }
  // Add removal animation class
  li.classList.add('removing');
  li.addEventListener('animationend', () => {
    li.remove();
  }, { once: true });
  // Update state after animation (or immediately)
  todos = todos.filter(t => t.id !== id);
  saveTodos();
}

function toggleComplete(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  saveTodos();
  renderTodos();
}

// -------------------------------------------------
// Rendering Helpers
// -------------------------------------------------
function createTodoElement(todo) {
  // Clone template content
  const fragment = template.content.cloneNode(true);
  const li = fragment.querySelector('li');
  if (!li) return document.createElement('li'); // safety fallback

  li.dataset.id = todo.id;
  // Set classes based on state
  if (todo.completed) li.classList.add('completed');
  // Add entry animation class
  li.classList.add('enter');

  // Populate content
  const titleSpan = li.querySelector('.todo-title');
  const descP = li.querySelector('.todo-description');
  if (titleSpan) titleSpan.textContent = todo.title;
  if (descP) {
    descP.textContent = todo.description;
    // Hide description element if empty to keep UI clean
    if (!todo.description) descP.style.display = 'none';
    else descP.style.display = '';
  }

  // Checkbox handling
  const checkbox = li.querySelector('.todo-checkbox');
  if (checkbox) {
    checkbox.checked = !!todo.completed;
    checkbox.addEventListener('change', () => toggleComplete(todo.id));
    // Ensure accessible label is present (already via aria-label in template)
  }

  // Delete button
  const deleteBtn = li.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
  }

  // Edit button – inline edit mode
  const editBtn = li.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => enterEditMode(li, todo));
  }

  return li;
}

function renderTodos() {
  // Clear list
  listEl.innerHTML = '';

  // Determine which todos to show based on current filter
  const filtered = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true; // 'all'
  });

  filtered.forEach(todo => {
    const el = createTodoElement(todo);
    listEl.appendChild(el);
  });

  // Update filter button visual state
  Object.entries(filterButtons).forEach(([key, btn]) => {
    if (!btn) return;
    if (key === currentFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// -------------------------------------------------
// Edit Mode Helpers
// -------------------------------------------------
function enterEditMode(li, todo) {
  if (li.classList.contains('editing')) return; // already editing
  li.classList.add('editing');

  // Replace title span with input
  const titleSpan = li.querySelector('.todo-title');
  const descP = li.querySelector('.todo-description');

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = todo.title;
  titleInput.className = 'edit-title-input';
  titleInput.setAttribute('aria-label', 'Edit title');

  const descTextarea = document.createElement('textarea');
  descTextarea.value = todo.description;
  descTextarea.className = 'edit-desc-input';
  descTextarea.setAttribute('aria-label', 'Edit description');

  // Buttons for save / cancel
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = 'Save';
  saveBtn.className = 'save-edit-btn';
  saveBtn.setAttribute('aria-label', 'Save changes');

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'cancel-edit-btn';
  cancelBtn.setAttribute('aria-label', 'Cancel editing');

  // Container for edit controls
  const editContainer = document.createElement('div');
  editContainer.className = 'edit-controls';
  editContainer.appendChild(saveBtn);
  editContainer.appendChild(cancelBtn);

  // Replace elements in DOM
  if (titleSpan) titleSpan.replaceWith(titleInput);
  if (descP) descP.replaceWith(descTextarea);
  // Append edit controls after description
  li.appendChild(editContainer);

  // Save handler
  const commit = () => {
    const newTitle = titleInput.value.trim();
    const newDesc = descTextarea.value.trim();
    if (newTitle) {
      updateTodo(todo.id, { title: newTitle, description: newDesc });
    } else {
      // If title emptied, treat as delete
      deleteTodo(todo.id);
    }
    exitEditMode(li);
  };

  // Cancel handler
  const cancel = () => {
    exitEditMode(li);
  };

  saveBtn.addEventListener('click', commit);
  cancelBtn.addEventListener('click', cancel);

  // Keyboard handling – Enter to save (but allow Shift+Enter for newline in textarea)
  titleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  });
  descTextarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  });
}

function exitEditMode(li) {
  // Remove editing class and rebuild the element via renderTodos for simplicity
  li.classList.remove('editing');
  renderTodos();
}

// -------------------------------------------------
// Filter Button Handlers
// -------------------------------------------------
function attachFilterHandlers() {
  Object.entries(filterButtons).forEach(([key, btn]) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      currentFilter = /** @type {'all'|'active'|'completed'} */ (key);
      renderTodos();
    });
  });
}

// -------------------------------------------------
// Accent Color Picker
// -------------------------------------------------
function initAccentPicker() {
  if (!accentPicker) return;
  accentPicker.addEventListener('input', e => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--accent-color', color);
    try {
      localStorage.setItem('todoAccentColor', color);
    } catch (err) {
      console.error('Failed to persist accent color', err);
    }
  });
}

// -------------------------------------------------
// Form Submission Handler
// -------------------------------------------------
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    if (!title) return; // Do not add empty titles
    addTodo(title, desc);
    // Reset form fields
    titleInput.value = '';
    descInput.value = '';
  });
}

// -------------------------------------------------
// Initialization
// -------------------------------------------------
attachFilterHandlers();
initAccentPicker();
loadTodos();

// -------------------------------------------------
// Export for debugging (optional)
// -------------------------------------------------
window.ColorfulTodo = {
  addTodo,
  deleteTodo,
  toggleComplete,
  updateTodo,
  loadTodos,
  saveTodos,
  todos: () => todos // getter for external inspection
};
