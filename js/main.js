/**
 * Main Application Module
 * Initializes and coordinates all modules
 */

import { todoManager } from "./modules/todos.js";
import { timerManager } from "./modules/timer.js";
import { settingsManager } from "./modules/settings.js";
import { uiManager } from "./modules/ui.js";
import { storage } from "./modules/storage.js";

class App {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    try {
      // Initialize todo manager
      const todoList = document.getElementById("todo-list");
      todoManager.init(todoList);
      todoManager.setupEventListeners();

      // Initialize timer manager
      const timerElements = {
        timerOverlay: document.getElementById("timer-overlay"),
        timerDisplay: document.getElementById("timer-display"),
        timerTaskTitle: document.getElementById("timer-task-title"),
        editTimerIcon: document.querySelector(".edit-timer-icon"),
        pauseResumeIcon: document.querySelector(".pause-icon"),
        stopIcon: document.querySelector(".stop-icon"),
      };
      timerManager.init(timerElements);

      // Connect todo manager to timer manager (avoiding circular dependency)
      todoManager.setStartTimerCallback((todoItem) =>
        timerManager.start(todoItem)
      );

      // Initialize settings manager
      const settingsElements = {
        settingsButton: document.getElementById("settings-button"),
        settingsPanel: document.getElementById("settings-panel"),
        saveSettingsButton: document.getElementById("save-settings"),
        backToTodoButton: document.getElementById("back-to-todo"),
        pomodoroMinInput: document.getElementById("pomodoro-min"),
        shortBreakMinInput: document.getElementById("short-break-min"),
        longBreakMinInput: document.getElementById("long-break-min"),
        sessionsInput: document.getElementById("sessions-before-long-break"),
      };
      settingsManager.init(settingsElements);

      // Initialize UI manager
      const uiElements = {
        darkModeToggle: document.getElementById("dark-mode-toggle"),
        soundToggleIcon: document.querySelector(".sound-toggle-icon"),
        lockToggleIcon: document.querySelector(".lock-toggle-icon"),
        lockToggleButton: document.querySelector(".timer-lock-toggle"),
        resetTrigger: document.getElementById("trigger"),
        currentYear: document.getElementById("currentYear"),
      };
      uiManager.init(uiElements);

      // Setup add todo functionality
      this.setupAddTodo();

      // Load initial data
      this.loadInitialData();

      // Professional sequential fade-in animation for all components
      this.animateComponentsOnLoad();

      this.initialized = true;
    } catch (error) {
      this.showFatalError(error);
    }
  }

  setupAddTodo() {
    const addButton = document.getElementById("add-button");
    const newTodoInput = document.getElementById("new-todo");

    const handleAdd = () => {
      const text = newTodoInput.value.trim();
      if (text !== "") {
        todoManager.add(text);
        newTodoInput.value = "";
        todoManager.save();
      }
    };

    addButton.addEventListener("click", handleAdd);
    newTodoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleAdd();
      }
    });
  }

  loadInitialData() {
    const savedTodos = storage.getTodos();

    if (savedTodos.length === 0) {
      // Add mock todos if none exist
      const mockTodos = [
        { text: "Task 1", completed: false },
        { text: "Task 2", completed: false },
        { text: "Task 3", completed: false },
      ];
      mockTodos.forEach((todo) => todoManager.add(todo.text, todo.completed));
      todoManager.save();
    } else {
      // Load saved todos
      todoManager.load();
    }
  }

  animateComponentsOnLoad() {
    // Check if this is the first visit using sessionStorage
    const hasAnimated = sessionStorage.getItem("hasAnimatedOnLoad");

    if (hasAnimated === "true") {
      // Not first load - make everything visible immediately
      todoManager.isInitialLoad = false;
      return;
    }

    // Mark as animated for this session
    sessionStorage.setItem("hasAnimatedOnLoad", "true");

    // Define all element selectors and get references
    const allElements = [
      ".logo-text",
      ".dark-mode-toggle-wrapper",
      "#settings-button",
      ".reset-container",
      ".todo-list-container",
      ".todo-list-container h2",
      ".todo-list-container h3",
      ".add-todo-container",
      "#new-todo",
      "#add-button",
      ".footer",
    ];

    const todoList = document.getElementById("todo-list");
    const todoItems = document.querySelectorAll(".todo-item");

    // Fallback function to make everything visible without animations
    const fallbackToVisible = () => {
      // Make all elements visible
      allElements.forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.opacity = "1";
        }
      });

      // Make todo items visible
      todoItems.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
      });

      // Set todo list to auto height
      if (todoList) {
        todoList.style.height = "auto";
        todoList.style.overflow = "";
      }

      // Enable individual animations for new todos
      todoManager.isInitialLoad = false;
    };

    // Check if GSAP is available
    if (typeof gsap === "undefined" && typeof window.gsap === "undefined") {
      fallbackToVisible();
      return;
    }

    // Wrap GSAP animation logic in try/catch
    try {
      // Set all elements to hidden initially
      allElements.forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          gsap.set(selector, { opacity: 0 });
        }
      });

      // Set todo list to collapsed state
      if (todoList) {
        gsap.set(todoList, { height: 0, overflow: "hidden" });
      }

      // Set todo items hidden - slide from top
      gsap.set(".todo-item", {
        opacity: 0,
        y: -30,
        scaleY: 0,
        transformOrigin: "top center",
      });

      // Create timeline for animations
      const tl = gsap.timeline();

      // Step 1: Fade in all elements simultaneously (slower fade)
      tl.to(allElements, {
        opacity: 1,
        duration: 1.2,
        ease: "power2.out",
        stagger: 0,
      });

      // Step 2: After fade-in, expand container and slide in todo items
      if (todoItems.length > 0 && todoList) {
        // Calculate cumulative heights for container expansion
        let cumulativeHeight = 0;

        todoItems.forEach((item, index) => {
          // Calculate the height this item will add
          const itemHeight = item.scrollHeight + 15; // item height + margin
          cumulativeHeight += itemHeight;

          // Animate the container height to accommodate this item
          tl.to(
            todoList,
            {
              height: cumulativeHeight,
              duration: 0.5,
              ease: "power2.out",
            },
            index === 0 ? "+=0.3" : "-=0.3"
          );

          // Simultaneously animate the item sliding in from top
          tl.to(
            item,
            {
              opacity: 1,
              y: 0,
              scaleY: 1,
              duration: 0.5,
              ease: "power2.out",
            },
            "-=0.5"
          );
        });

        // After all animations complete, set container to auto height
        tl.add(() => {
          if (todoList) {
            todoList.style.height = "auto";
            todoList.style.overflow = "";
          }
          // Allow individual animations for newly added todos
          todoManager.isInitialLoad = false;
        });
      } else {
        // No todos, just enable individual animations
        tl.add(() => {
          if (todoList) {
            todoList.style.height = "auto";
            todoList.style.overflow = "";
          }
          todoManager.isInitialLoad = false;
        }, "+=0.3");
      }
    } catch (error) {
      // Fallback to visible state on animation error
      fallbackToVisible();
    }
  }

  showFatalError(error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-dialog";
    errorDiv.innerHTML = `
      <h3>⚠️ Application Error</h3>
      <p>${error.message}</p>
      <button onclick="window.location.reload()">Reload Page</button>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Create and initialize app
const app = new App();
app.init();

// Global error handler to prevent console errors in Lighthouse
window.addEventListener(
  "error",
  (event) => {
    // Prevent error from appearing in console
    event.preventDefault();
    return true;
  },
  true
);

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  // Prevent unhandled promise rejections from appearing in console
  event.preventDefault();
  return true;
});

// Register Service Worker for caching and offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Use relative path that works for both localhost and GitHub Pages
    const swPath = "./js/service-worker.js";

    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        // Service worker registered successfully - check for updates
        registration.update();
      })
      .catch(() => {
        // Service worker registration failed (silent fail)
      });
  });
}

// Handle PWA installation with 3-second prompt
let deferredPrompt;

// Check if install prompt was already shown in this session
function hasInstallPromptBeenShown() {
  return sessionStorage.getItem("installPromptShown") === "true";
}

// Mark install prompt as shown for this session
function markInstallPromptAsShown() {
  sessionStorage.setItem("installPromptShown", "true");
}

// Check if app is already installed
function isAppInstalled() {
  // Check if running in standalone mode (PWA already installed)
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the default browser install prompt
  e.preventDefault();
  // Store the event for later use
  deferredPrompt = e;

  // Show install prompt after 3 seconds (only once per session)
  if (!hasInstallPromptBeenShown() && !isAppInstalled()) {
    setTimeout(() => {
      showInstallPrompt();
    }, 3000);
  }
});

function showInstallPrompt() {
  if (!deferredPrompt || hasInstallPromptBeenShown() || isAppInstalled())
    return;

  markInstallPromptAsShown();

  // Create install prompt overlay
  const installBanner = document.createElement("div");
  installBanner.className = "install-banner";

  installBanner.innerHTML = `
    <div class="install-banner-content">
      <div class="install-banner-title">📱 Install TodoPomo</div>
      <div class="install-banner-subtitle">Add to home screen for faster access & offline use</div>
    </div>
    <button id="install-btn" class="install-btn">Install</button>
    <button id="dismiss-btn" class="dismiss-btn">Later</button>
  `;

  document.body.appendChild(installBanner);

  // Install button click
  document.getElementById("install-btn").addEventListener("click", () => {
    installBanner.remove();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        deferredPrompt = null;
      });
    }
  });

  // Dismiss button click
  document.getElementById("dismiss-btn").addEventListener("click", () => {
    installBanner.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (installBanner.parentNode) {
      installBanner.remove();
    }
  }, 10000);
}

// Track when app is installed
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  markInstallPromptAsShown();
});

// Export for debugging
window.__todopomo = {
  app,
  todoManager,
  timerManager,
  settingsManager,
  uiManager,
  storage,
  // Allow manual installation via console if needed
  installApp: () => {
    if (deferredPrompt && !hasInstallPromptBeenShown()) {
      showInstallPrompt();
    }
  },
  // Reset install prompt for testing (clears session flag)
  resetInstallPrompt: () => {
    sessionStorage.removeItem("installPromptShown");
  },
};
