const todoList = document.getElementById("todo-list");
const addButton = document.getElementById("add-button");
const newTodoInput = document.getElementById("new-todo");

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

  li.innerHTML = `
    <div class="checkbox-wrapper-24">
      <input type="checkbox" id="${todoId}" name="check" value="" ${
    completed ? "checked" : ""
  }/>
      <label for="${todoId}">
        <span></span>
        ${text}
      </label>
    </div>
    <div class="todo-actions">
        <div class="icon play-icon">
            <img src="play.svg" alt="Play" />
        </div>
        <div class="icon edit-icon">
            <img src="edit.svg" alt="Edit" />
        </div>
        <div class="icon delete-icon">
            <img src="delete.svg" alt="Delete" />
        </div>
    </div>
  `;

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

    // Recreate the label content
    const forId = item.querySelector('input[type="checkbox"]').id;
    label.setAttribute("for", forId);
    label.innerHTML = `<span></span>${text}`;

    input.remove();
    item.classList.remove("editing");
    icon.querySelector("img").src = "edit.svg";
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
    icon.querySelector("img").src = "save.svg";
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
let timerInterval;
let currentTimerLi;
let remainingTime;
let isPaused = false;

const timerOverlay = document.getElementById("timer-overlay");
const timerDisplay = document.getElementById("timer-display");
const timerTaskTitle = document.getElementById("timer-task-title");
const editTimerIcon = document.querySelector(".edit-timer-icon");
const pauseResumeIcon = document.querySelector(".pause-icon");
const stopIcon = document.querySelector(".stop-icon");

let isBreak = false;
let completedTasks = 0;

function startTimer(li) {
  let taskText = li.querySelector("label").textContent.trim();
  timerTaskTitle.textContent = taskText;

  currentTimerLi = li;
  remainingTime = pomodoroDuration; // in seconds
  isBreak = false;

  timerOverlay.classList.add("visible");
  pauseResumeIcon.querySelector("img").src = "pause.svg";

  timerInterval = setInterval(() => {
    remainingTime--;

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    timerDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      if (!isBreak) {
        // Task completed, mark as done and start break
        const checkbox = currentTimerLi.querySelector('input[type="checkbox"]');
        checkbox.checked = true;
        toggleTodoCompleted(checkbox);
        completedTasks++;
        startBreak();
      } else {
        // Break completed, start next task
        startNextTask();
      }
    }
  }, 1000);
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

  timerInterval = setInterval(() => {
    remainingTime--;

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    timerDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      startNextTask();
    }
  }, 1000);
}

function startLongBreak() {
  timerTaskTitle.textContent = "Long Break";
  remainingTime = 30 * 60; // 30 minutes in seconds
  isBreak = true;
  completedTasks = 0; // Reset completed tasks counter

  timerInterval = setInterval(() => {
    remainingTime--;

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    timerDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

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
  const img = pauseResumeIcon.querySelector("img");
  img.style.opacity = 0;

  setTimeout(() => {
    if (isPaused) {
      // Resume
      img.src = "pause.svg";
      isPaused = false;
      startTimerCountdown();
    } else {
      // Pause
      img.src = "play.svg";
      isPaused = true;
      clearInterval(timerInterval);
    }
    img.style.opacity = 1;
  }, 100);
}

function startTimerCountdown() {
  timerInterval = setInterval(() => {
    remainingTime--;

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    timerDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      if (!isBreak) {
        // Task completed, mark as done and start break
        const checkbox = currentTimerLi.querySelector('input[type="checkbox"]');
        checkbox.checked = true;
        toggleTodoCompleted(checkbox);
        completedTasks++;
        startBreak();
      } else {
        // Break completed, start next task
        startNextTask();
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  hideTimer();
}

function hideTimer() {
  timerOverlay.classList.remove("visible");
  timerTaskTitle.textContent = "";
}

// Timer editing functionality
function toggleTimerEdit() {
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
      // Show professional error message
      const originalText = timerDisplay.textContent;
      const originalColor = timerDisplay.style.color;
      const originalFontSize = timerDisplay.style.fontSize;

      timerDisplay.textContent = errorMessage;
      timerDisplay.style.color = "#ff4757";
      timerDisplay.style.fontSize = "1.2rem";
      timerDisplay.style.fontWeight = "500";
      timerDisplay.style.textShadow = "0 2px 4px rgba(255, 71, 87, 0.3)";

      // Add subtle shake animation
      timerDisplay.style.animation = "errorShake 0.5s ease-in-out";

      setTimeout(() => {
        timerDisplay.textContent = originalText;
        timerDisplay.style.color = originalColor;
        timerDisplay.style.fontSize = originalFontSize;
        timerDisplay.style.fontWeight = "";
        timerDisplay.style.textShadow = "";
        timerDisplay.style.animation = "";
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

    // Update display with proper formatting
    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    timerDisplay.textContent = formattedTime;

    // Re-enable controls
    pauseResumeIcon.style.pointerEvents = "";
    pauseResumeIcon.style.opacity = "";
    stopIcon.style.pointerEvents = "";
    stopIcon.style.opacity = "";

    timerDisplay.contentEditable = "false";
    editTimerIcon.querySelector("img").src = "edit.svg";

    // Auto-start the timer
    if (remainingTime > 0) {
      isPaused = false;
      pauseResumeIcon.querySelector("img").src = "pause.svg";
      startTimerCountdown();
    }
  } else {
    // Auto-pause timer if it's running
    if (!isPaused && timerInterval) {
      clearInterval(timerInterval);
      isPaused = true;
      pauseResumeIcon.querySelector("img").src = "play.svg";
    }

    // Disable other controls during editing
    pauseResumeIcon.style.pointerEvents = "none";
    pauseResumeIcon.style.opacity = "0.3";
    stopIcon.style.pointerEvents = "none";
    stopIcon.style.opacity = "0.3";

    // Enable editing - show current time for editing
    timerDisplay.contentEditable = "true";
    timerDisplay.focus();

    // Select all text for easy editing
    const range = document.createRange();
    range.selectNodeContents(timerDisplay);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    editTimerIcon.querySelector("img").src = "save.svg";
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

// Event listeners for timer controls
editTimerIcon.addEventListener("click", toggleTimerEdit);
pauseResumeIcon.addEventListener("click", togglePauseResume);
stopIcon.addEventListener("click", stopTimer);

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
      background: rgba(255, 71, 87, 0.95);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      text-align: center;
      box-shadow: 0 8px 32px rgba(255, 71, 87, 0.3);
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
  { text: "InlighnX", completed: false },
  { text: "TuteDude", completed: false },
  { text: "Udemy", completed: false },
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
