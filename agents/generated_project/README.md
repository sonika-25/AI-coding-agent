# ColorfulTodo 🌈

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
[![GitHub stars](https://img.shields.io/github/stars/yourusername/ColorfulTodo?style=social)](#)

**A vibrant, lightweight Todo web app built with vanilla JavaScript, featuring a colorful UI, smooth animations, and persistent storage via `localStorage`.**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Customization](#customization)
- [Architecture](#architecture)
- [Development Scripts](#development-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

`ColorfulTodo` is a single‑page web application that lets you manage your tasks in a clean, colorful interface. The app stores all data in the browser's **localStorage**, so your todos survive page reloads and even browser restarts without any backend. The UI is driven by CSS variables, allowing you to change the accent color on the fly.

---

## Features

- **Add / Edit / Delete** todos with title and optional description.
- **Mark as completed** – toggle via a checkbox.
- **Filter** view: All, Active, Completed.
- **Responsive design** – works on mobile, tablet and desktop.
- **Smooth animations** for adding, removing, and entering edit mode.
- **Accent‑color customization** via a color picker; persisted across sessions.
- **Persisted state** using `localStorage` (todos + accent color).
- **Keyboard shortcuts** – Enter to add, Enter/Shift+Enter to save edits.
- **Accessible markup** – proper ARIA labels, focus management.

---

## Tech Stack

- **HTML5** – semantic markup, `<template>` for todo items.
- **CSS3** – BEM naming, CSS variables (`--accent-color`), flexbox, media queries, keyframe animations.
- **JavaScript (ES6+)** – classes, modules (single script file), DOM API, `localStorage`, `crypto.getRandomValues` for UUID generation.
- **Browser APIs** – `localStorage` for persistence, `document.documentElement.style.setProperty` for dynamic theming.

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ColorfulTodo.git
   cd ColorfulTodo
   ```
2. **Open the app**
   - Simply double‑click `index.html` or open it in any modern browser.
3. **(Optional) Serve with a local HTTP server** – useful for testing on mobile devices.
   ```bash
   npx serve .
   # then navigate to http://localhost:5000 (or the port shown)
   ```

No additional dependencies or build steps are required.

---

## Usage

1. **Add a todo** – type a title (and optional description) in the form at the top and press **Enter** or click **Add**.
2. **Edit** – click the ✏️ *Edit* button on a todo. Inline inputs appear; press **Save** or hit **Enter** to commit changes.
3. **Complete** – toggle the checkbox to mark a task as completed; completed items are styled differently.
4. **Delete** – click the 🗑️ *Delete* button; a removal animation plays before the item disappears.
5. **Filter** – use the *All / Active / Completed* buttons to change the visible list.
6. **Change accent color** – pick a new color from the color picker in the header; the UI updates instantly and the choice is saved.

All interactions are saved automatically; reload the page to see your data persist.

---

## Customization

- **Accent Color via UI**: Use the color picker (`<input type="color" id="accent-color-picker">`) in the header. The selected value updates the CSS variable `--accent-color` and is stored in `localStorage` under `todoAccentColor`.
- **Manual CSS Override**: Edit `styles.css` and change the default value of `--accent-color` in the `:root` selector:
  ```css
  :root {
    --accent-color: #ff6f61; /* your custom color */
  }
  ```
  After saving, refresh the page.

---

## Architecture

```
src/
├─ index.html      ← static markup, contains the form, list container, filter buttons, and template.
├─ styles.css      ← UI styling, BEM classes, animations, responsive layout, CSS variables.
└─ script.js       ← core application logic
```

### `script.js` Highlights

- **`class Todo`** – data model representing a single task; includes a static `fromObject` helper for deserialization.
- **State variables** – `todos` (array of `Todo` instances) and `currentFilter` (`'all' | 'active' | 'completed'`).
- **Persistence** – `saveTodos()` & `loadTodos()` read/write JSON to `localStorage`; accent color is also persisted.
- **CRUD functions** – `addTodo`, `updateTodo`, `deleteTodo`, `toggleComplete` manipulate `todos` and call `saveTodos()`.
- **Rendering pipeline** – `renderTodos()` clears the list, filters based on `currentFilter`, creates DOM elements via `createTodoElement(todo)`, and injects them into `#todo-list`.
- **Edit mode** – `enterEditMode` swaps static text for input fields and wires *Save*/*Cancel* actions.
- **Filter handling** – `attachFilterHandlers()` wires the three filter buttons to update `currentFilter` and re‑render.
- **Accent color** – `initAccentPicker()` listens to the color picker and updates the CSS variable.
- **Initialization flow** – attach handlers → init accent picker → load persisted data → render.

Data flows **HTML ↔️ JS ↔️ localStorage**:
1. User interacts with DOM elements → event listeners call CRUD functions.
2. CRUD functions update the in‑memory `todos` array.
3. `saveTodos()` writes the updated array to `localStorage`.
4. `renderTodos()` reflects the current state back into the DOM.

---

## Development Scripts

The project is intentionally simple – there is no build step. To develop:
1. **Edit files** (`index.html`, `styles.css`, `script.js`).
2. **Refresh the browser** to see changes (live‑reload via a simple server like `npx serve` works as well).
3. **Add new features** by extending `script.js` (e.g., drag‑and‑drop ordering) and updating the markup/template accordingly.

---

## Contributing

Contributions are welcome! Please follow these guidelines:
- **Fork the repository** and create a feature branch.
- **Code style** – use ES6 syntax, `const`/`let` appropriately, and follow BEM naming for CSS classes.
- **Commit messages** – concise, prefixed with the type (e.g., `feat:`, `fix:`, `docs:`).
- **Pull Requests** – ensure the app still works by opening `index.html` in a browser. Include a brief description of the change.
- **Issues** – report bugs or propose enhancements via GitHub Issues, providing steps to reproduce when possible.

---

## License

This project is licensed under the **MIT License** – see the `LICENSE` file for details.
