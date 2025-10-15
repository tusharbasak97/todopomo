/**
 * Todos Module
 * Handles todo list management
 */

import { storage } from "./storage.js";

class TodoManager {
  constructor() {
    this.todoList = null;
    this.onStartTimer = null; // Callback for starting timer
    this.isInitialLoad = true; // Flag to track initial load
  }

  init(todoListElement) {
    this.todoList = todoListElement;
  }

  setStartTimerCallback(callback) {
    this.onStartTimer = callback;
  }

  load() {
    const todos = storage.getTodos();
    todos.forEach((todo) => this.add(todo.text, todo.completed));
  }

  save() {
    const todos = [];
    const todoItems = this.todoList.querySelectorAll(".todo-item");
    todoItems.forEach((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const label = item.querySelector("label");
      const text = label.textContent.trim().replace(/✓/g, "").trim();
      todos.push({
        text: text,
        completed: checkbox.checked,
      });
    });
    storage.saveTodos(todos);
  }

  add(text, completed = false) {
    const li = document.createElement("li");
    li.className = "todo-item";
    if (completed) {
      li.classList.add("completed");
    }

    const todoId = `todo-${Date.now()}-${Math.random()}`;

    // Create checkbox wrapper
    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.className = "checkbox-wrapper";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = todoId;
    checkbox.name = "check";
    checkbox.value = "";
    if (completed) {
      checkbox.checked = true;
    }

    const label = document.createElement("label");
    label.setAttribute("for", todoId);

    const span = document.createElement("span");
    const textNode = document.createTextNode(text);

    label.appendChild(span);
    label.appendChild(textNode);

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);

    // Create todo actions
    const todoActions = document.createElement("div");
    todoActions.className = "todo-actions";

    // Play icon
    const playIcon = document.createElement("div");
    playIcon.className = "icon play-icon";
    const playImg = document.createElement("img");
    playImg.src = "assets/svg/play.svg";
    playImg.alt = "Play";
    playIcon.appendChild(playImg);

    // Edit icon
    const editIcon = document.createElement("div");
    editIcon.className = "icon edit-icon";
    const editImg = document.createElement("img");
    editImg.src = "assets/svg/edit.svg";
    editImg.alt = "Edit";
    editIcon.appendChild(editImg);

    // Delete icon
    const deleteIcon = document.createElement("div");
    deleteIcon.className = "icon delete-icon";
    const deleteImg = document.createElement("img");
    deleteImg.src = "assets/svg/delete.svg";
    deleteImg.alt = "Delete";
    deleteIcon.appendChild(deleteImg);

    todoActions.appendChild(playIcon);
    todoActions.appendChild(editIcon);
    todoActions.appendChild(deleteIcon);

    li.appendChild(checkboxWrapper);
    li.appendChild(todoActions);

    this.todoList.appendChild(li);

    // GSAP animation for new todo item (skip during initial load)
    if (!this.isInitialLoad) {
      // Set initial state - slide from top
      gsap.set(li, {
        opacity: 0,
        y: -30,
        scaleY: 0,
        transformOrigin: "top center",
      });

      // Animate in with slide from top and vertical growth
      gsap.to(li, {
        opacity: 1,
        y: 0,
        scaleY: 1,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }

  toggleCompleted(checkbox) {
    const item = checkbox.closest(".todo-item");
    const label = item.querySelector("label");
    item.classList.toggle("completed", checkbox.checked);

    // GSAP animation for strikethrough (both directions)
    if (checkbox.checked) {
      // Adding strikethrough
      gsap.to(label, {
        textDecoration: "line-through",
        color: "var(--text-light)",
        duration: 0.5,
        ease: "power2.out",
      });
    } else {
      // Removing strikethrough
      gsap.to(label, {
        textDecoration: "none",
        color: "var(--text-color)",
        duration: 0.5,
        ease: "power2.out",
      });
    }

    this.save();
  }

  delete(target) {
    const item = target.closest(".todo-item");

    // GSAP animation for delete (opposite of add animation - slide up)
    gsap.to(item, {
      opacity: 0,
      y: -30,
      scaleY: 0,
      duration: 0.5,
      ease: "power2.in",
      transformOrigin: "top center",
      onComplete: () => {
        item.remove();
        this.save();
      },
    });
  }

  toggleEdit(icon) {
    const item = icon.closest(".todo-item");
    const label = item.querySelector("label");
    const isEditing = item.classList.contains("editing");

    if (isEditing) {
      // Save mode
      const input = item.querySelector(".edit-input");
      const text = input.value.trim();

      const forId = item.querySelector('input[type="checkbox"]').id;
      label.setAttribute("for", forId);
      label.innerHTML = "";

      const span = document.createElement("span");
      label.appendChild(span);

      const textNode = document.createTextNode(text);
      label.appendChild(textNode);

      input.remove();
      item.classList.remove("editing");
      icon.querySelector("img").src = "assets/svg/edit.svg";
      icon.querySelector("img").alt = "Edit";
      icon.classList.remove("save-icon");
      icon.classList.add("edit-icon");
      this.save();
    } else {
      // Edit mode
      const textNode = Array.from(label.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE
      );
      const currentText = textNode ? textNode.textContent.trim() : "";

      const input = document.createElement("input");
      input.type = "text";
      input.value = currentText;
      input.className = "edit-input";

      const span = label.querySelector("span").cloneNode(true);
      label.innerHTML = "";
      label.appendChild(span);
      label.appendChild(input);

      input.focus();
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.toggleEdit(icon);
        }
      });

      item.classList.add("editing");
      icon.querySelector("img").src = "assets/svg/save.svg";
      icon.querySelector("img").alt = "Save";
      icon.classList.remove("edit-icon");
      icon.classList.add("save-icon");
    }
  }

  handleClick(e) {
    const target = e.target;
    const icon = target.closest(".icon");

    if (!icon) return;

    if (icon.classList.contains("delete-icon")) {
      this.delete(target);
    } else if (
      icon.classList.contains("edit-icon") ||
      icon.classList.contains("save-icon")
    ) {
      this.toggleEdit(icon);
    } else if (icon.classList.contains("play-icon")) {
      if (this.onStartTimer) {
        this.onStartTimer(icon.closest(".todo-item"));
      }
    }
  }

  handleChange(e) {
    const target = e.target;
    if (target.matches('input[type="checkbox"]')) {
      this.toggleCompleted(target);
    }
  }

  setupEventListeners() {
    this.todoList.addEventListener("click", (e) => this.handleClick(e));
    this.todoList.addEventListener("change", (e) => this.handleChange(e));
  }
}

export const todoManager = new TodoManager();
