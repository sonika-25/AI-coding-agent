// RedTodo Application Logic
// -------------------------------------------------
// This script implements the core functionality for the RedTodo app.
// It manages the todo list, persists data to localStorage, and updates the UI.
// -------------------------------------------------

// -------------------------------
// DOM References
// -------------------------------
const todoForm = document.getElementById('todo-form');
const newTodoInput = document.getElementById('new-todo');
const todoList = document.getElementById('todo-list');
const clearBtn = document.getElementById('clear-completed');

// -------------------------------
// Data Model
// -------------------------------
/**
 * Array of todo objects.
 * Each todo: { id: string, text: string, completed: boolean }
 */
let todos = [];

// -------------------------------
// Persistence Functions
// -------------------------------
/**
 * Load todos from localStorage. If none exist, initialise with an empty array.
 */
function loadTodos() {
    const stored = localStorage.getItem('redtodo');
    try {
        todos = stored ? JSON.parse(stored) : [];
        // Guard against malformed data
        if (!Array.isArray(todos)) todos = [];
    } catch (e) {
        console.error('Failed to parse stored todos:', e);
        todos = [];
    }
}

/**
 * Save the current todos array to localStorage.
 */
function saveTodos() {
    try {
        localStorage.setItem('redtodo', JSON.stringify(todos));
    } catch (e) {
        console.error('Failed to save todos:', e);
    }
}

// -------------------------------
// Rendering Function
// -------------------------------
/**
 * Render the todo list based on the current `todos` array.
 */
function renderTodos() {
    // Clear existing list
    todoList.innerHTML = '';

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) li.classList.add('completed');
        li.dataset.id = todo.id; // store id for potential future use

        // Checkbox for completion toggle
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'toggle';
        checkbox.dataset.id = todo.id;
        checkbox.checked = todo.completed;

        // Text span
        const span = document.createElement('span');
        span.className = 'text';
        span.textContent = todo.text;

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit';
        editBtn.dataset.id = todo.id;
        editBtn.textContent = 'Edit';

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete';
        deleteBtn.dataset.id = todo.id;
        deleteBtn.textContent = 'Delete';

        // Assemble the list item
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        todoList.appendChild(li);
    });
}

// -------------------------------
// CRUD Operations
// -------------------------------
/**
 * Add a new todo with the provided text.
 * @param {string} text
 */
function addTodo(text) {
    const id = crypto.randomUUID();
    const newTodo = { id, text, completed: false };
    todos.push(newTodo);
    saveTodos();
    renderTodos();
}

/**
 * Edit the text of an existing todo.
 * @param {string} id
 * @param {string} newText
 */
function editTodo(id, newText) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    todo.text = newText;
    saveTodos();
    renderTodos();
}

/**
 * Delete a todo by its id.
 * @param {string} id
 */
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

/**
 * Toggle the completed state of a todo.
 * @param {string} id
 */
function toggleComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
}

/**
 * Remove all todos that are marked as completed.
 */
function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
}

// -------------------------------
// Event Handling
// -------------------------------
function attachEventListeners() {
    // Handle form submission to add a new todo
    todoForm.addEventListener('submit', e => {
        e.preventDefault();
        const text = newTodoInput.value.trim();
        if (text) {
            addTodo(text);
            newTodoInput.value = '';
        }
    });

    // Delegated listener for toggle, edit, and delete actions within the todo list
    todoList.addEventListener('click', e => {
        const target = e.target;
        const id = target.dataset.id;
        if (!id) return; // Not an actionable element

        if (target.matches('.toggle')) {
            toggleComplete(id);
        } else if (target.matches('.edit')) {
            const current = todos.find(t => t.id === id);
            if (!current) return;
            const newText = prompt('Edit todo:', current.text);
            if (newText !== null) {
                const trimmed = newText.trim();
                if (trimmed) editTodo(id, trimmed);
            }
        } else if (target.matches('.delete')) {
            // Simple confirmation could be added here if desired
            deleteTodo(id);
        }
    });

    // Clear completed todos button
    clearBtn.addEventListener('click', () => {
        clearCompleted();
    });
}

// -------------------------------
// Initialization
// -------------------------------
loadTodos();
renderTodos();
attachEventListeners();

// End of app.js
