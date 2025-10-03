const todoList = document.getElementById("todo-list");
const addButton = document.getElementById("add-button");
const newTodoInput = document.getElementById("new-todo");

// Background music variables
const backgroundMusic = document.getElementById("background-music");
let isMusicEnabled = true;
let isLocked = false;

// Removed focus mode variables - focus mode has been disabled

// Background music control functions
function playBackgroundMusic(reset = false) {
  if (isMusicEnabled && backgroundMusic) {
    try {
      if (reset) {
        backgroundMusic.currentTime = 0; // Start from beginning
      }
      const playPromise = backgroundMusic.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Background music started");
          })
          .catch((error) => {
            console.log(
              "Could not start background music (user interaction required):",
              error
            );
          });
      }
    } catch (error) {
      console.log("Could not start background music:", error);
    }
  }
}

function pauseBackgroundMusic() {
  if (backgroundMusic) {
    try {
      backgroundMusic.pause();
      console.log("Background music paused");
    } catch (error) {
      console.log("Could not pause background music:", error);
    }
  }
}

function stopBackgroundMusic() {
  if (backgroundMusic) {
    try {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      console.log("Background music stopped");
    } catch (error) {
      console.log("Could not stop background music:", error);
    }
  }
}

// Set volume to a reasonable level (30%)
if (backgroundMusic) {
  backgroundMusic.volume = 0.3;
}

// Focus Mode has been completely removed - it was not effective at preventing distractions
// Timer-specific keyboard and mouse blocking remains active during timer sessions
// Cursor hiding and notification blocking are kept for better focus experience

// Cursor hiding functionality
let cursorTimeout;
let cursorShowHandler = null;

function activateCursorHiding() {
  // Only hide cursor on timer overlay
  const hideCursor = () => {
    if (timerOverlay && timerOverlay.classList.contains("visible")) {
      timerOverlay.style.cursor = "none";
    }
  };

  cursorShowHandler = () => {
    if (timerOverlay && timerOverlay.classList.contains("visible")) {
      timerOverlay.style.cursor = "auto";
    }
    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(hideCursor, 3000); // Hide after 3 seconds of inactivity
  };

  // Listen for mouse movement on the timer overlay
  if (timerOverlay) {
    timerOverlay.addEventListener("mousemove", cursorShowHandler);
  }
  cursorTimeout = setTimeout(hideCursor, 3000);

  console.log("🖱️ Cursor auto-hide activated");
}

function deactivateCursorHiding() {
  if (timerOverlay) {
    timerOverlay.style.cursor = "auto";
  }
  clearTimeout(cursorTimeout);
  if (cursorShowHandler && timerOverlay) {
    timerOverlay.removeEventListener("mousemove", cursorShowHandler);
    cursorShowHandler = null;
  }
  console.log("🖱️ Cursor auto-hide deactivated");
}

// Notification blocking functionality
function activateNotificationBlocking() {
  // Block system notifications by overriding the Notification constructor
  if ("Notification" in window && !window.originalNotification) {
    window.originalNotification = window.Notification;
    window.Notification = function (...args) {
      console.log("🔕 Blocked external notification during timer session");
      return { close: () => {}, addEventListener: () => {} }; // Return dummy notification object
    };
    // Copy static methods
    if (window.originalNotification.requestPermission) {
      window.Notification.requestPermission =
        window.originalNotification.requestPermission.bind(
          window.originalNotification
        );
    }
    if (window.originalNotification.permission) {
      window.Notification.permission = window.originalNotification.permission;
    }
  }
  console.log("🔕 Notifications blocked during timer");
}

function deactivateNotificationBlocking() {
  if (window.originalNotification) {
    window.Notification = window.originalNotification;
    delete window.originalNotification;
    console.log("🔕 Notifications unblocked");
  }
}

// Timer-specific distraction blocking (independent of focus mode)
let timerKeyboardBlockingActive = false;
let timerMouseBlockingActive = false;
let blockedFullscreenExit = false; // Flag to track if we blocked a fullscreen exit
let fullscreenMonitorInterval = null; // Interval to monitor fullscreen state

function activateTimerKeyboardBlocking() {
  if (timerKeyboardBlockingActive) return;

  timerKeyboardBlockingActive = true;
  document.addEventListener("keydown", timerKeyboardHandler, true);
  document.addEventListener("keyup", timerKeyUpHandler, true);

  // Start monitoring fullscreen state
  startFullscreenMonitoring();

  console.log("⌨️ Timer keyboard blocking activated");
}

function deactivateTimerKeyboardBlocking() {
  if (!timerKeyboardBlockingActive) return;

  timerKeyboardBlockingActive = false;
  document.removeEventListener("keydown", timerKeyboardHandler, true);
  document.removeEventListener("keyup", timerKeyUpHandler, true);

  // Stop monitoring fullscreen state
  stopFullscreenMonitoring();

  console.log("⌨️ Timer keyboard blocking deactivated");
}

function startFullscreenMonitoring() {
  // Monitor fullscreen state every 100ms and re-enter if needed
  if (fullscreenMonitorInterval) return;

  fullscreenMonitorInterval = setInterval(() => {
    const isTimerActive =
      timerOverlay && timerOverlay.classList.contains("visible");
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

    // If timer is active but not in fullscreen, re-enter (unless locked or paused during edit)
    const isEditingTimer =
      timerDisplay && timerDisplay.contentEditable === "true";
    if (isTimerActive && !isFullscreen && !isLocked && !isEditingTimer) {
      console.log("🔄 Fullscreen exited unexpectedly, re-entering...");
      enterFullscreen();
    }
  }, 100);
}

function stopFullscreenMonitoring() {
  if (fullscreenMonitorInterval) {
    clearInterval(fullscreenMonitorInterval);
    fullscreenMonitorInterval = null;
  }
}

function timerKeyboardHandler(e) {
  // Allow keyboard interaction on timer controls
  const target = e.target;
  const isTimerControl =
    target.closest(".timer-controls") ||
    target.closest(".edit-timer-icon") ||
    target.closest(".pause-icon") ||
    target.closest(".stop-icon") ||
    target.closest(".timer-lock-toggle") ||
    target.closest(".lock-toggle-icon") ||
    target.closest(".timer-sound-toggle") ||
    target.closest(".sound-toggle-icon") ||
    target.id === "timer-display";

  // Don't block keyboard shortcuts on timer controls (like Enter/Space on lock button)
  if (isTimerControl && (e.key === "Enter" || e.key === " ")) {
    return; // Allow these keys on timer controls
  }

  // Allow Space (pause/resume) and M (mute) when timer is active and not locked
  if ((e.key === " " && !isLocked) || e.key === "m" || e.key === "M") {
    return; // Allow these functional keys
  }

  // Comprehensive list of distraction shortcuts to block during timer
  const blockedShortcuts = [
    // Browser shortcuts
    { key: "F5" }, // Refresh
    { key: "F11" }, // Fullscreen toggle
    { key: "F12" }, // Developer tools
    { ctrl: true, key: "t" }, // New tab
    { ctrl: true, key: "n" }, // New window
    { ctrl: true, shift: true, key: "n" }, // New incognito window
    { ctrl: true, shift: true, key: "i" }, // Developer tools
    { ctrl: true, key: "u" }, // View page source
    { ctrl: true, key: "s" }, // Save page
    { ctrl: true, key: "p" }, // Print
    { ctrl: true, key: "r" }, // Refresh (alternative)
    { ctrl: true, key: "w" }, // Close tab
    { ctrl: true, shift: true, key: "t" }, // Reopen closed tab
    { ctrl: true, key: "f" }, // Find
    { ctrl: true, shift: true, key: "delete" }, // Clear browsing data
    { alt: true, key: "F4" }, // Close window
    { alt: true, key: "F5" }, // Refresh window
    { alt: true, key: "Tab" }, // Task switching
    { alt: true, key: "Escape" }, // Application menu

    // System shortcuts
    { key: "PrintScreen" }, // Screenshot
    { alt: true, key: "PrintScreen" }, // Window screenshot

    // Media keys that might interfere
    { key: "MediaPlayPause" },
    { key: "MediaStop" },
    { key: "MediaTrackNext" },
    { key: "MediaTrackPrevious" },
  ];

  const isBlocked = blockedShortcuts.some((shortcut) => {
    const ctrlMatch = !shortcut.ctrl || e.ctrlKey;
    const shiftMatch = !shortcut.shift || e.shiftKey;
    const altMatch = !shortcut.alt || e.altKey;
    const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

    return ctrlMatch && shiftMatch && altMatch && keyMatch;
  });

  if (isBlocked) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // For F11 specifically, set flag and re-enter fullscreen if needed
    if (e.key === "F11") {
      blockedFullscreenExit = true;
      // Re-enter fullscreen after a brief delay to counter any exit attempt
      setTimeout(() => {
        const isFullscreen = !!(
          document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        );

        if (
          !isFullscreen &&
          timerOverlay &&
          timerOverlay.classList.contains("visible")
        ) {
          enterFullscreen();
        }
        // Reset flag after handling
        setTimeout(() => {
          blockedFullscreenExit = false;
        }, 100);
      }, 10);
    }

    console.log("⌨️ Blocked timer distraction shortcut:", e.key);
    return false;
  }
}

function timerKeyUpHandler(e) {
  // Also block on keyup to prevent any delayed actions
  const criticalKeys = ["F5", "F11", "F12"];
  if (criticalKeys.includes(e.key)) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }
}

function activateTimerMouseBlocking() {
  if (timerMouseBlockingActive) return;

  timerMouseBlockingActive = true;
  document.addEventListener("contextmenu", preventContextMenu, true);
  document.addEventListener("dragstart", preventDrag, true);
  document.addEventListener("selectstart", preventSelection, true);
  console.log("🖱️ Timer mouse blocking activated");
}

function deactivateTimerMouseBlocking() {
  if (!timerMouseBlockingActive) return;

  timerMouseBlockingActive = false;
  document.removeEventListener("contextmenu", preventContextMenu, true);
  document.removeEventListener("dragstart", preventDrag, true);
  document.removeEventListener("selectstart", preventSelection, true);
  console.log("🖱️ Timer mouse blocking deactivated");
}

function preventContextMenu(e) {
  // Allow context menu only on timer controls
  const target = e.target;
  const isTimerControl =
    target.closest(".timer-controls") ||
    target.closest(".edit-timer-icon") ||
    target.closest(".pause-icon") ||
    target.closest(".stop-icon") ||
    target.closest(".timer-lock-toggle") ||
    target.closest(".lock-toggle-icon") ||
    target.closest(".timer-sound-toggle") ||
    target.closest(".sound-toggle-icon");

  if (!isTimerControl) {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log("🖱️ Blocked context menu");
    return false;
  }
}

function preventDrag(e) {
  // Allow dragging only on timer controls
  const target = e.target;
  const isTimerControl =
    target.closest(".timer-controls") ||
    target.closest(".edit-timer-icon") ||
    target.closest(".pause-icon") ||
    target.closest(".stop-icon") ||
    target.closest(".timer-lock-toggle") ||
    target.closest(".lock-toggle-icon") ||
    target.closest(".timer-sound-toggle") ||
    target.closest(".sound-toggle-icon");

  if (!isTimerControl) {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log("🖱️ Blocked drag operation");
    return false;
  }
}

function preventSelection(e) {
  // Allow text selection only on timer display when editing, and allow clicks on timer controls
  const target = e.target;
  const isEditableTimer =
    target.id === "timer-display" && target.contentEditable === "true";
  const isTimerControl =
    target.closest(".timer-controls") ||
    target.closest(".edit-timer-icon") ||
    target.closest(".pause-icon") ||
    target.closest(".stop-icon") ||
    target.closest(".timer-lock-toggle") ||
    target.closest(".lock-toggle-icon") ||
    target.closest(".timer-sound-toggle") ||
    target.closest(".sound-toggle-icon");

  if (!isEditableTimer && !isTimerControl) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }
}

// Fullscreen functionality
function enterFullscreen() {
  const element = document.documentElement;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    // Firefox
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    // Chrome, Safari, Opera
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    // IE/Edge
    element.msRequestFullscreen();
  }

  // Request landscape orientation on mobile
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch((err) => {
      console.log("Orientation lock failed:", err);
    });
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    // Firefox
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    // Chrome, Safari, Opera
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    // IE/Edge
    document.msExitFullscreen();
  }

  // Unlock orientation
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}

// Listen for fullscreen changes
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);

function handleFullscreenChange() {
  // If timer overlay is visible but we're not in fullscreen, stop the timer
  // UNLESS we blocked the fullscreen exit (e.g., user pressed F11)
  const isTimerActive = timerOverlay.classList.contains("visible");
  const isFullscreen = !!(
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );

  if (isTimerActive && !isFullscreen) {
    // Check if this was a blocked fullscreen exit attempt
    if (blockedFullscreenExit) {
      // Don't stop the timer, re-enter fullscreen instead
      setTimeout(() => {
        enterFullscreen();
      }, 50);
    } else {
      // Legitimate fullscreen exit (e.g., user stopped the timer)
      stopTimer();
    }
  }
}

// Pomodoro settings
let pomodoroDuration =
  parseInt(localStorage.getItem("pomodoroDuration")) || 180 * 60; // 180 minutes in seconds
let shortBreakDuration =
  parseInt(localStorage.getItem("shortBreakDuration")) || 15 * 60; // 15 minutes in seconds
let longBreakDuration =
  parseInt(localStorage.getItem("longBreakDuration")) || 30 * 60; // 30 minutes in seconds
let sessionsBeforeLongBreak =
  parseInt(localStorage.getItem("sessionsBeforeLongBreak")) || 4;

// Todo persistence functions
function saveTodos() {
  const todos = [];
  const todoItems = document.querySelectorAll("#todo-list .todo-item");
  todoItems.forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const label = item.querySelector("label");
    // Get the text content, removing any checkmark symbols
    const text = label.textContent.trim().replace(/✓/g, "").trim();
    todos.push({
      text: text,
      completed: checkbox.checked,
    });
  });
  localStorage.setItem("todos", JSON.stringify(todos));
}

function loadTodos() {
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  todos.forEach((todo) => addTodo(todo.text, todo.completed));
}

function addTodo(text, completed = false) {
  const li = document.createElement("li");
  li.className = "todo-item";
  if (completed) {
    li.classList.add("completed");
  }

  const todoId = `todo-${Date.now()}-${Math.random()}`;

  // Create checkbox wrapper div
  const checkboxWrapper = document.createElement("div");
  checkboxWrapper.className = "checkbox-wrapper-24";

  // Create checkbox input
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = todoId;
  checkbox.name = "check";
  checkbox.value = "";
  if (completed) {
    checkbox.checked = true;
  }

  // Create label
  const label = document.createElement("label");
  label.setAttribute("for", todoId);

  // Create span inside label
  const span = document.createElement("span");

  // Create text node for the todo text (safe from XSS)
  const textNode = document.createTextNode(text);

  // Append span and text to label
  label.appendChild(span);
  label.appendChild(textNode);

  // Append checkbox and label to wrapper
  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);

  // Create todo actions div
  const todoActions = document.createElement("div");
  todoActions.className = "todo-actions";

  // Create play icon
  const playIcon = document.createElement("div");
  playIcon.className = "icon play-icon";
  const playImg = document.createElement("img");
  playImg.src = "assets/svg/play.svg";
  playImg.alt = "Play";
  playIcon.appendChild(playImg);

  // Create edit icon
  const editIcon = document.createElement("div");
  editIcon.className = "icon edit-icon";
  const editImg = document.createElement("img");
  editImg.src = "assets/svg/edit.svg";
  editImg.alt = "Edit";
  editIcon.appendChild(editImg);

  // Create delete icon
  const deleteIcon = document.createElement("div");
  deleteIcon.className = "icon delete-icon";
  const deleteImg = document.createElement("img");
  deleteImg.src = "assets/svg/delete.svg";
  deleteImg.alt = "Delete";
  deleteIcon.appendChild(deleteImg);

  // Append icons to actions
  todoActions.appendChild(playIcon);
  todoActions.appendChild(editIcon);
  todoActions.appendChild(deleteIcon);

  // Append wrapper and actions to li
  li.appendChild(checkboxWrapper);
  li.appendChild(todoActions);

  todoList.appendChild(li);
}

function handleAddButtonClick() {
  const text = newTodoInput.value.trim();
  if (text !== "") {
    addTodo(text);
    newTodoInput.value = "";
    saveTodos();
  }
}

function toggleTodoCompleted(checkbox) {
  const item = checkbox.closest(".todo-item");
  item.classList.toggle("completed", checkbox.checked);
  saveTodos();
}

function deleteTodoItem(target) {
  const item = target.closest(".todo-item");
  item.remove();
  saveTodos();
}

function handleTodoListClick(e) {
  const target = e.target;
  const icon = target.closest(".icon");

  if (!icon) return;

  if (icon.classList.contains("delete-icon")) {
    deleteTodoItem(target);
  } else if (
    icon.classList.contains("edit-icon") ||
    icon.classList.contains("save-icon")
  ) {
    toggleEditSave(icon);
  } else if (icon.classList.contains("play-icon")) {
    startTimer(icon.closest(".todo-item"));
  }
}

function toggleEditSave(icon) {
  const item = icon.closest(".todo-item");
  const label = item.querySelector("label");
  const isEditing = item.classList.contains("editing");

  if (isEditing) {
    // Save mode
    const input = item.querySelector(".edit-input");
    const text = input.value.trim();

    // Recreate the label content safely
    const forId = item.querySelector('input[type="checkbox"]').id;
    label.setAttribute("for", forId);

    // Clear existing content and rebuild safely
    label.innerHTML = "";

    // Create span element
    const span = document.createElement("span");
    label.appendChild(span);

    // Create text node for the todo text (safe from XSS)
    const textNode = document.createTextNode(text);
    label.appendChild(textNode);

    input.remove();
    item.classList.remove("editing");
    icon.querySelector("img").src = "assets/svg/edit.svg";
    icon.classList.remove("save-icon");
    icon.classList.add("edit-icon");
    saveTodos();
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

    // Clear label and append the span and the new input
    const span = label.querySelector("span").cloneNode(true);
    label.innerHTML = "";
    label.appendChild(span);
    label.appendChild(input);

    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        toggleEditSave(icon);
      }
    });

    item.classList.add("editing");
    icon.querySelector("img").src = "assets/svg/save.svg";
    icon.classList.remove("edit-icon");
    icon.classList.add("save-icon");
  }
}

function handleTodoListChange(e) {
  const target = e.target;
  if (target.matches('input[type="checkbox"]')) {
    toggleTodoCompleted(target);
  }
}

// Timer variables
let timerRequest;
let currentTimerLi;
let remainingTime;
let isPaused = false;
let lastFrameTime = null;

const timerOverlay = document.getElementById("timer-overlay");
const timerDisplay = document.getElementById("timer-display");
const timerTaskTitle = document.getElementById("timer-task-title");
const editTimerIcon = document.querySelector(".edit-timer-icon");
const pauseResumeIcon = document.querySelector(".pause-icon");
const stopIcon = document.querySelector(".stop-icon");

let isBreak = false;
let completedTasks = 0;

// GSAP animation function for timer display - individual digit animations
function animateTimeChange(newTimeText) {
  // Get all digit spans
  const digitSpans = timerDisplay.querySelectorAll(".timer-digit");

  // Parse new time into digits array (ignoring colons)
  const newDigits = newTimeText.replace(/:/g, "").split("");

  // Get current digits from spans
  const currentDigits = Array.from(digitSpans).map((span) => span.textContent);

  // Animate only digits that changed
  digitSpans.forEach((span, index) => {
    if (currentDigits[index] !== newDigits[index]) {
      const currentDigit = parseInt(currentDigits[index]);
      const newDigit = parseInt(newDigits[index]);

      // Determine animation direction based on digit change
      // Rollover from 0 to 9 gets opposite (downward) animation
      const isRollover = currentDigit === 0 && newDigit === 9;

      if (isRollover) {
        // Downward animation for rollover (0→9)
        gsap.to(span, {
          duration: 0.3,
          y: 30,
          opacity: 0,
          ease: "power2.in",
          onComplete: () => {
            span.textContent = newDigits[index];
            gsap.fromTo(
              span,
              { y: -30, opacity: 0 },
              {
                duration: 0.3,
                y: 0,
                opacity: 1,
                ease: "power2.out",
              }
            );
          },
        });
      } else {
        // Upward animation for normal changes
        gsap.to(span, {
          duration: 0.3,
          y: -30,
          opacity: 0,
          ease: "power2.in",
          onComplete: () => {
            span.textContent = newDigits[index];
            gsap.fromTo(
              span,
              { y: 30, opacity: 0 },
              {
                duration: 0.3,
                y: 0,
                opacity: 1,
                ease: "power2.out",
              }
            );
          },
        });
      }
    }
  });
}

// Helper function to set timer digits without animation (for initial setup)
function setTimerDigits(timeText) {
  const digitSpans = timerDisplay.querySelectorAll(".timer-digit");
  const digits = timeText.replace(/:/g, "").split("");
  digitSpans.forEach((span, index) => {
    span.textContent = digits[index] || "0";
  });
}

function startTimer(li) {
  let taskText = li.querySelector("label").textContent.trim();
  timerTaskTitle.textContent = taskText;

  currentTimerLi = li;
  remainingTime = pomodoroDuration; // in seconds
  isBreak = false;

  timerOverlay.classList.add("visible");
  enterFullscreen(); // Enter fullscreen when timer starts
  pauseResumeIcon.querySelector("img").src = "assets/svg/pause.svg";

  // 🔒 ACTIVATE TIMER-SPECIFIC BLOCKING
  activateTimerKeyboardBlocking();
  activateTimerMouseBlocking();
  activateCursorHiding();
  activateNotificationBlocking();

  // Display initial time without animation
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  const initialTimeText = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  setTimerDigits(initialTimeText);

  // Start background music when timer starts
  playBackgroundMusic(true);

  lastFrameTime = performance.now();
  timerRequest = requestAnimationFrame(updateTimer);
}

function startBreak() {
  if (completedTasks % sessionsBeforeLongBreak === 0 && completedTasks > 0) {
    timerTaskTitle.textContent = "Long Break";
    remainingTime = longBreakDuration; // in seconds
  } else {
    timerTaskTitle.textContent = "Break";
    remainingTime = shortBreakDuration; // in seconds
  }
  isBreak = true;

  // Display initial break time without animation
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  const initialTimeText = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  setTimerDigits(initialTimeText);

  // Continue background music during breaks
  playBackgroundMusic(true);

  lastFrameTime = performance.now();
  timerRequest = requestAnimationFrame(updateTimer);
}

function startLongBreak() {
  timerTaskTitle.textContent = "Long Break";
  remainingTime = 30 * 60; // 30 minutes in seconds
  isBreak = true;
  completedTasks = 0; // Reset completed tasks counter

  // Display initial long break time without animation
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  const initialTimeText = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  setTimerDigits(initialTimeText);

  timerInterval = setInterval(() => {
    remainingTime--;

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    const newTimeText = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    // Animate time change with GSAP
    animateTimeChange(newTimeText);

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      startNextTask();
    }
  }, 1000);
}

function startNextTask() {
  const tasks = document.querySelectorAll(".todo-item:not(.completed)");
  if (tasks.length > 0) {
    startTimer(tasks[0]);
  } else {
    hideTimer();
  }
}

function togglePauseResume() {
  if (isLocked) return; // Prevent pause/resume when locked

  const img = pauseResumeIcon.querySelector("img");
  img.style.opacity = 0;

  setTimeout(() => {
    if (isPaused) {
      // Resume
      img.src = "assets/svg/pause.svg";
      isPaused = false;
      startTimerCountdown();
      playBackgroundMusic(); // Resume music
    } else {
      // Pause
      img.src = "assets/svg/play.svg";
      isPaused = true;
      cancelAnimationFrame(timerRequest);
      pauseBackgroundMusic(); // Pause music
    }
    img.style.opacity = 1;
  }, 100);
}

function startTimerCountdown() {
  // Ensure music is playing when countdown starts
  playBackgroundMusic();

  lastFrameTime = performance.now();
  timerRequest = requestAnimationFrame(updateTimer);
}

function stopTimer() {
  if (isLocked) return; // Prevent stopping when locked

  cancelAnimationFrame(timerRequest);
  stopBackgroundMusic(); // Stop music when timer is stopped

  // 🔒 DEACTIVATE TIMER-SPECIFIC BLOCKING
  deactivateTimerKeyboardBlocking();
  deactivateTimerMouseBlocking();
  deactivateCursorHiding();
  deactivateNotificationBlocking();

  hideTimer();
}

function hideTimer() {
  timerOverlay.classList.remove("visible");
  exitFullscreen(); // Exit fullscreen when timer is hidden
  timerTaskTitle.textContent = "";
  stopBackgroundMusic(); // Stop music when timer is hidden

  // 🔒 DEACTIVATE TIMER-SPECIFIC BLOCKING IF STILL ACTIVE
  if (timerKeyboardBlockingActive) {
    deactivateTimerKeyboardBlocking();
  }
  if (timerMouseBlockingActive) {
    deactivateTimerMouseBlocking();
  }
  deactivateCursorHiding();
  deactivateNotificationBlocking();
}

// Timer editing functionality
function toggleTimerEdit() {
  if (isLocked) return; // Prevent editing when locked

  const isEditable = timerDisplay.contentEditable === "true";

  if (isEditable) {
    // Save the edited time - smart parsing with validation
    const timeText = timerDisplay.textContent.trim();
    let hours = 0,
      minutes = 0,
      seconds = 0;

    // Remove all non-digits and split by colons
    const parts = timeText.replace(/[^0-9:]/g, "").split(":");

    if (parts.length === 1) {
      // Single number - interpret as minutes
      minutes = parseInt(parts[0]) || 0;
    } else if (parts.length === 2) {
      // MM:SS format
      minutes = parseInt(parts[0]) || 0;
      seconds = parseInt(parts[1]) || 0;
    } else if (parts.length === 3) {
      // HH:MM:SS format
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
      seconds = parseInt(parts[2]) || 0;
    }

    // Validation
    let isValid = true;
    let errorMessage = "";

    if (seconds >= 60) {
      isValid = false;
      errorMessage = "⚠ Invalid seconds (0-59 only)";
    } else if (minutes >= 60) {
      isValid = false;
      errorMessage = "⚠ Invalid minutes (0-59 only)";
    } else if (hours > 3) {
      isValid = false;
      errorMessage = "⚠ Maximum 3 hours allowed";
    } else if (hours === 0 && minutes === 0 && seconds === 0) {
      isValid = false;
      errorMessage = "⚠ Please set a valid duration";
    }

    if (!isValid) {
      // Show professional error message - temporarily hide digits
      const digitSpans = timerDisplay.querySelectorAll(
        ".timer-digit, .timer-separator"
      );
      const originalDisplay = Array.from(digitSpans).map((span) => ({
        element: span,
        display: span.style.display,
      }));

      // Hide all digit spans
      digitSpans.forEach((span) => (span.style.display = "none"));

      // Show error message
      timerDisplay.textContent = errorMessage;
      timerDisplay.style.color = "hsl(348, 100%, 61%)";
      timerDisplay.style.fontSize = "1.2rem";
      timerDisplay.style.fontWeight = "500";
      timerDisplay.style.textShadow = "0 2px 4px hsla(348, 100%, 61%, 0.3)";

      // Add subtle shake animation
      timerDisplay.style.animation = "errorShake 0.5s ease-in-out";

      setTimeout(() => {
        // Restore the original timer display HTML structure
        timerDisplay.innerHTML = `
          <span class="timer-digit" data-position="0">0</span>
          <span class="timer-digit" data-position="1">0</span>
          <span class="timer-separator">:</span>
          <span class="timer-digit" data-position="2">0</span>
          <span class="timer-digit" data-position="3">0</span>
          <span class="timer-separator">:</span>
          <span class="timer-digit" data-position="4">0</span>
          <span class="timer-digit" data-position="5">0</span>
        `;

        // Get current time and display it
        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;
        const currentTimeText = `${String(hours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        setTimerDigits(currentTimeText);

        timerDisplay.style.color = "";
        timerDisplay.style.fontSize = "";
        timerDisplay.style.fontWeight = "";
        timerDisplay.style.textShadow = "";
        timerDisplay.style.animation = "";

        // Hide digit spans and show editable text again for continued editing
        const newDigitSpans = timerDisplay.querySelectorAll(
          ".timer-digit, .timer-separator"
        );
        newDigitSpans.forEach((span) => (span.style.display = "none"));

        timerDisplay.textContent = currentTimeText;
        timerDisplay.focus();

        // Re-select text for continued editing
        const range = document.createRange();
        range.selectNodeContents(timerDisplay);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }, 2500);
      return; // Don't save invalid time
    }

    // Convert to total seconds
    remainingTime = hours * 3600 + minutes * 60 + seconds;

    // Restore the original timer display HTML structure
    timerDisplay.contentEditable = "false";
    timerDisplay.innerHTML = `
      <span class="timer-digit" data-position="0">0</span>
      <span class="timer-digit" data-position="1">0</span>
      <span class="timer-separator">:</span>
      <span class="timer-digit" data-position="2">0</span>
      <span class="timer-digit" data-position="3">0</span>
      <span class="timer-separator">:</span>
      <span class="timer-digit" data-position="4">0</span>
      <span class="timer-digit" data-position="5">0</span>
    `;

    // Update display with proper formatting using setTimerDigits for immediate display
    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    setTimerDigits(formattedTime);

    // Re-enable controls
    pauseResumeIcon.style.pointerEvents = "";
    pauseResumeIcon.style.opacity = "";
    stopIcon.style.pointerEvents = "";
    stopIcon.style.opacity = "";

    editTimerIcon.querySelector("img").src = "assets/svg/edit.svg";

    // Auto-start the timer
    if (remainingTime > 0) {
      isPaused = false;
      pauseResumeIcon.querySelector("img").src = "assets/svg/pause.svg";
      startTimerCountdown();
    }
  } else {
    // Auto-pause timer if it's running
    if (!isPaused && timerRequest) {
      cancelAnimationFrame(timerRequest);
      isPaused = true;
      pauseResumeIcon.querySelector("img").src = "assets/svg/play.svg";
      pauseBackgroundMusic(); // Pause music during editing
    }

    // Disable other controls during editing
    pauseResumeIcon.style.pointerEvents = "none";
    pauseResumeIcon.style.opacity = "0.3";
    stopIcon.style.pointerEvents = "none";
    stopIcon.style.opacity = "0.3";

    // Enable editing - hide digits and show editable text
    const digitSpans = timerDisplay.querySelectorAll(
      ".timer-digit, .timer-separator"
    );
    const currentDigits = Array.from(
      timerDisplay.querySelectorAll(".timer-digit")
    ).map((span) => span.textContent);
    const currentTime =
      currentDigits.slice(0, 2).join("") +
      ":" +
      currentDigits.slice(2, 4).join("") +
      ":" +
      currentDigits.slice(4, 6).join("");

    // Hide digit spans
    digitSpans.forEach((span) => (span.style.display = "none"));

    // Show editable text
    timerDisplay.textContent = currentTime;
    timerDisplay.contentEditable = "true";
    timerDisplay.focus();

    // Select all text for easy editing
    const range = document.createRange();
    range.selectNodeContents(timerDisplay);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    editTimerIcon.querySelector("img").src = "assets/svg/save.svg";
  }
}

// Handle Enter key to save when editing timer
timerDisplay.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    toggleTimerEdit();
  }
});

// Smart timer input formatting
timerDisplay.addEventListener("input", (e) => {
  if (timerDisplay.contentEditable === "true") {
    let value = timerDisplay.textContent.replace(/[^0-9]/g, ""); // Keep only digits

    // Auto-insert colons after every 2 digits, but limit appropriately
    if (value.length >= 2) {
      if (value.length <= 4) {
        // MM:SS format
        value =
          value.slice(0, 2) + (value.length > 2 ? ":" + value.slice(2) : "");
      } else {
        // HH:MM:SS format
        value =
          value.slice(0, 2) +
          ":" +
          value.slice(2, 4) +
          (value.length > 4 ? ":" + value.slice(4, 6) : "");
      }
    }

    // Limit total length
    if (value.replace(/:/g, "").length > 6) {
      value = value.slice(0, 8); // Allow HH:MM:SS
    }

    timerDisplay.textContent = value;

    // Move cursor to end
    const range = document.createRange();
    range.selectNodeContents(timerDisplay);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

// Sound toggle functionality
const soundToggleIcon = document.querySelector(".sound-toggle-icon");

function toggleSound() {
  isMusicEnabled = !isMusicEnabled;
  const img = soundToggleIcon.querySelector("img");
  if (isMusicEnabled) {
    img.src = "assets/svg/sound.svg";
    img.alt = "Mute";
    if (!isPaused && timerOverlay.classList.contains("visible")) {
      playBackgroundMusic();
    }
  } else {
    img.src = "assets/svg/mute.svg";
    img.alt = "Unmute";
    pauseBackgroundMusic();
  }
}

// Load sound preference
const savedMusicEnabled = localStorage.getItem("isMusicEnabled");
if (savedMusicEnabled !== null) {
  isMusicEnabled = savedMusicEnabled === "true";
  const img = soundToggleIcon.querySelector("img");
  if (isMusicEnabled) {
    img.src = "assets/svg/sound.svg";
    img.alt = "Mute Sound";
  } else {
    img.src = "assets/svg/mute.svg";
    img.alt = "Unmute Sound";
  }
}

// Lock toggle functionality
const lockToggleIcon = document.querySelector(".lock-toggle-icon");
const lockToggleButton = document.querySelector(".timer-lock-toggle");

function toggleLock() {
  isLocked = !isLocked;
  const img = lockToggleIcon.querySelector("img");

  // Add switching class for animation
  lockToggleIcon.classList.add("switching");

  setTimeout(() => {
    if (isLocked) {
      img.src = "assets/svg/lock.svg";
      img.alt = "Locked";
      lockToggleButton.setAttribute("aria-pressed", "true");
      lockToggleButton.classList.add("is-locked");
    } else {
      img.src = "assets/svg/unlock.svg";
      img.alt = "Unlocked";
      lockToggleButton.setAttribute("aria-pressed", "false");
      lockToggleButton.classList.remove("is-locked");
    }

    // Remove switching class to animate back in
    lockToggleIcon.classList.remove("switching");
  }, 150); // Half of the transition duration

  // Save lock preference
  localStorage.setItem("isLocked", isLocked);
}

// Load lock preference
const savedLocked = localStorage.getItem("isLocked");
if (savedLocked !== null) {
  isLocked = savedLocked === "true";
  const img = lockToggleIcon.querySelector("img");
  if (isLocked) {
    img.src = "assets/svg/lock.svg";
    img.alt = "Locked";
    lockToggleButton.setAttribute("aria-pressed", "true");
    lockToggleButton.classList.add("is-locked");
  } else {
    img.src = "assets/svg/unlock.svg";
    img.alt = "Unlocked";
    lockToggleButton.setAttribute("aria-pressed", "false");
    lockToggleButton.classList.remove("is-locked");
  }
}

// Event listeners for timer controls
editTimerIcon.addEventListener("click", (e) => {
  if (!isLocked) toggleTimerEdit();
});
pauseResumeIcon.addEventListener("click", togglePauseResume);
stopIcon.addEventListener("click", stopTimer);
soundToggleIcon.addEventListener("click", toggleSound);
lockToggleButton.addEventListener("click", toggleLock);
lockToggleButton.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleLock();
  }
});

addButton.addEventListener("click", handleAddButtonClick);
newTodoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleAddButtonClick();
  }
});
todoList.addEventListener("click", handleTodoListClick);
todoList.addEventListener("change", handleTodoListChange);

// Settings functionality
const settingsButton = document.getElementById("settings-button");
const settingsPanel = document.getElementById("settings-panel");
const saveSettingsButton = document.getElementById("save-settings");
const backToTodoButton = document.getElementById("back-to-todo");
const pomodoroMinInput = document.getElementById("pomodoro-min");
const shortBreakMinInput = document.getElementById("short-break-min");
const longBreakMinInput = document.getElementById("long-break-min");
const sessionsInput = document.getElementById("sessions-before-long-break");

const todoContent = document.querySelector(
  ".todo-list-container > :not(#settings-panel)"
);

settingsButton.addEventListener("click", () => {
  // Add rotation animation
  settingsButton.classList.add("rotating");

  // Remove rotation class after animation completes
  setTimeout(() => {
    settingsButton.classList.remove("rotating");
  }, 300);

  // Hide todo content
  document.querySelector(".title").style.display = "none";
  document.querySelector(".add-todo-container").style.display = "none";
  document.querySelector("h3").style.display = "none";
  document.getElementById("todo-list").style.display = "none";
  // Show settings
  settingsPanel.style.display = "block";
  // Populate inputs
  pomodoroMinInput.value = Math.floor(pomodoroDuration / 60);
  shortBreakMinInput.value = Math.floor(shortBreakDuration / 60);
  longBreakMinInput.value = Math.floor(longBreakDuration / 60);
  sessionsInput.value = sessionsBeforeLongBreak;
});

backToTodoButton.addEventListener("click", () => {
  // Add rotation animation to settings button (reverse)
  settingsButton.classList.add("rotating");

  // Remove rotation class after animation completes
  setTimeout(() => {
    settingsButton.classList.remove("rotating");
  }, 300);

  // Show todo content
  document.querySelector(".title").style.display = "block";
  document.querySelector(".add-todo-container").style.display = "flex";
  document.querySelector("h3").style.display = "block";
  document.getElementById("todo-list").style.display = "block";
  // Hide settings
  settingsPanel.style.display = "none";
});

saveSettingsButton.addEventListener("click", () => {
  const pomodoroMins = parseInt(pomodoroMinInput.value) || 0;
  const shortBreakMins = parseInt(shortBreakMinInput.value) || 0;
  const longBreakMins = parseInt(longBreakMinInput.value) || 0;
  const sessions = parseInt(sessionsInput.value) || 4;

  // Validation
  let isValid = true;
  let errorMessage = "";

  if (pomodoroMins > 180) {
    isValid = false;
    errorMessage = "⚠ Pomodoro duration cannot exceed 180 minutes";
  } else if (pomodoroMins <= 0) {
    isValid = false;
    errorMessage = "⚠ Pomodoro duration must be at least 1 minute";
  } else if (shortBreakMins > 15) {
    isValid = false;
    errorMessage = "⚠ Short break cannot exceed 15 minutes";
  } else if (shortBreakMins <= 0) {
    isValid = false;
    errorMessage = "⚠ Short break must be at least 1 minute";
  } else if (longBreakMins > 30) {
    isValid = false;
    errorMessage = "⚠ Long break cannot exceed 30 minutes";
  } else if (longBreakMins <= 0) {
    isValid = false;
    errorMessage = "⚠ Long break must be at least 1 minute";
  } else if (sessions <= 0) {
    isValid = false;
    errorMessage = "⚠ Sessions before long break must be at least 1";
  }

  if (!isValid) {
    // Show professional error message
    const errorDiv = document.createElement("div");
    errorDiv.textContent = errorMessage;
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: hsla(348, 100%, 61%, 0.95);
      color: hsl(0, 0%, 100%);
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      text-align: center;
      box-shadow: 0 8px 32px hsla(348, 100%, 61%, 0.3);
      z-index: 10000;
      animation: errorShake 0.5s ease-in-out;
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 300);
    }, 3000);

    return; // Don't save invalid settings
  }

  pomodoroDuration = pomodoroMins * 60;
  shortBreakDuration = shortBreakMins * 60;
  longBreakDuration = longBreakMins * 60;
  sessionsBeforeLongBreak = sessions;

  // Save to localStorage
  localStorage.setItem("pomodoroDuration", pomodoroDuration);
  localStorage.setItem("shortBreakDuration", shortBreakDuration);
  localStorage.setItem("longBreakDuration", longBreakDuration);
  localStorage.setItem("sessionsBeforeLongBreak", sessionsBeforeLongBreak);

  // Go back
  backToTodoButton.click();
});

const mockTodos = [
  { text: "Task 1", completed: false },
  { text: "Task 2", completed: false },
  { text: "Task 3", completed: false },
];

// Load saved todos or use mock data if none exist
const savedTodos = JSON.parse(localStorage.getItem("todos")) || [];
if (savedTodos.length === 0) {
  mockTodos.forEach((todo) => addTodo(todo.text, todo.completed));
  saveTodos();
} else {
  loadTodos();
}

document.getElementById("currentYear").textContent = new Date().getFullYear();

const darkModeToggle = document.getElementById("dark-mode-toggle");
darkModeToggle.addEventListener("change", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.documentElement.classList.contains("dark")
  );
});

// Load dark mode state
if (localStorage.getItem("darkMode") === "true") {
  document.documentElement.classList.add("dark");
  darkModeToggle.checked = true;
}

// Reset button functionality
const resetTrigger = document.getElementById("trigger");
resetTrigger.addEventListener("change", () => {
  if (resetTrigger.checked) {
    setTimeout(() => {
      // Clear all localStorage data
      localStorage.clear();
      // Reload the page to reset everything
      window.location.reload();
    }, 2000); // Wait for animation to complete
  }
});

// Settings input validation
pomodoroMinInput.addEventListener("input", (e) => {
  const value = parseInt(e.target.value) || 0;
  if (value > 180) e.target.value = 180;
  if (value < 1) e.target.value = 1;
});

shortBreakMinInput.addEventListener("input", (e) => {
  const value = parseInt(e.target.value) || 0;
  if (value > 15) e.target.value = 15;
  if (value < 1) e.target.value = 1;
});

longBreakMinInput.addEventListener("input", (e) => {
  const value = parseInt(e.target.value) || 0;
  if (value > 30) e.target.value = 30;
  if (value < 1) e.target.value = 1;
});

sessionsInput.addEventListener("input", (e) => {
  const value = parseInt(e.target.value) || 0;
  if (value < 1) e.target.value = 1;
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const isEditingTodo = document.querySelector(".todo-item.editing");
  const isEditingTimer =
    timerDisplay && timerDisplay.contentEditable === "true";
  const isTimerActive =
    timerOverlay && timerOverlay.classList.contains("visible");

  // Don't handle shortcuts if editing or if focus is on an input element
  if (
    isEditingTodo ||
    isEditingTimer ||
    (e.target.tagName === "INPUT" && e.target.type !== "checkbox")
  ) {
    return;
  }

  // Space bar: Pause/Resume timer (when unlocked and timer is active)
  if (e.key === " " && isTimerActive && !isLocked) {
    e.preventDefault();
    togglePauseResume();
    return;
  }

  // M key: Toggle mute/unmute (when timer is active)
  if ((e.key === "m" || e.key === "M") && isTimerActive) {
    e.preventDefault();
    toggleSound();
    return;
  }

  // Escape key: Stop timer (when unlocked and timer is active)
  if (e.key === "Escape" && isTimerActive && !isLocked) {
    e.preventDefault();
    stopTimer();
    return;
  }
});

function updateTimer(currentTime) {
  if (isPaused) return;

  if (!lastFrameTime) {
    lastFrameTime = currentTime;
  }

  const deltaTime = currentTime - lastFrameTime;

  if (deltaTime >= 1000) {
    remainingTime--;
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    const newTimeText = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    animateTimeChange(newTimeText);

    lastFrameTime = currentTime - (deltaTime % 1000);

    if (remainingTime <= 0) {
      if (!isBreak) {
        const checkbox = currentTimerLi.querySelector('input[type="checkbox"]');
        checkbox.checked = true;
        toggleTodoCompleted(checkbox);
        completedTasks++;
        startBreak();
      } else {
        startNextTask();
      }
      return; // Stop the loop
    }
  }

  timerRequest = requestAnimationFrame(updateTimer);
}
