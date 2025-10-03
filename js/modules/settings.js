/**
 * Settings Module
 * Handles settings panel and pomodoro configuration
 */

import { CONFIG } from "./config.js";
import { storage } from "./storage.js";
import { timerManager } from "./timer.js";

class SettingsManager {
  constructor() {
    this.settingsButton = null;
    this.settingsPanel = null;
    this.saveSettingsButton = null;
    this.backToTodoButton = null;
    this.pomodoroMinInput = null;
    this.shortBreakMinInput = null;
    this.longBreakMinInput = null;
    this.sessionsInput = null;

    // UI elements to toggle
    this.title = null;
    this.addTodoContainer = null;
    this.todoListTitle = null;
    this.todoList = null;
  }

  init(elements) {
    this.settingsButton = elements.settingsButton;
    this.settingsPanel = elements.settingsPanel;
    this.saveSettingsButton = elements.saveSettingsButton;
    this.backToTodoButton = elements.backToTodoButton;
    this.pomodoroMinInput = elements.pomodoroMinInput;
    this.shortBreakMinInput = elements.shortBreakMinInput;
    this.longBreakMinInput = elements.longBreakMinInput;
    this.sessionsInput = elements.sessionsInput;

    // UI elements
    this.title = document.querySelector(".title");
    this.addTodoContainer = document.querySelector(".add-todo-container");
    this.todoListTitle = document.querySelector("h3");
    this.todoList = document.getElementById("todo-list");

    this.setupEventListeners();
    this.setupInputValidation();
  }

  setupEventListeners() {
    this.settingsButton.addEventListener("click", () => this.show());
    this.backToTodoButton.addEventListener("click", () => this.hide());
    this.saveSettingsButton.addEventListener("click", () => this.save());
  }

  setupInputValidation() {
    this.pomodoroMinInput.addEventListener("input", (e) => {
      const value = parseInt(e.target.value) || 0;
      if (value > CONFIG.TIMER.MAX_POMODORO_MINUTES)
        e.target.value = CONFIG.TIMER.MAX_POMODORO_MINUTES;
      if (value < 1) e.target.value = 1;
    });

    this.shortBreakMinInput.addEventListener("input", (e) => {
      const value = parseInt(e.target.value) || 0;
      if (value > CONFIG.TIMER.MAX_SHORT_BREAK_MINUTES)
        e.target.value = CONFIG.TIMER.MAX_SHORT_BREAK_MINUTES;
      if (value < 1) e.target.value = 1;
    });

    this.longBreakMinInput.addEventListener("input", (e) => {
      const value = parseInt(e.target.value) || 0;
      if (value > CONFIG.TIMER.MAX_LONG_BREAK_MINUTES)
        e.target.value = CONFIG.TIMER.MAX_LONG_BREAK_MINUTES;
      if (value < 1) e.target.value = 1;
    });

    this.sessionsInput.addEventListener("input", (e) => {
      const value = parseInt(e.target.value) || 0;
      if (value < 1) e.target.value = 1;
    });
  }

  show() {
    // Add rotation animation
    this.settingsButton.classList.add("rotating");
    setTimeout(() => {
      this.settingsButton.classList.remove("rotating");
    }, 300);

    // Hide todo content
    this.title.style.display = "none";
    this.addTodoContainer.style.display = "none";
    this.todoListTitle.style.display = "none";
    this.todoList.style.display = "none";

    // Show settings
    this.settingsPanel.style.display = "block";

    // Populate inputs
    const settings = storage.getPomodoroSettings();
    this.pomodoroMinInput.value = Math.floor(
      (settings.pomodoroDuration || CONFIG.TIMER.DEFAULT_POMODORO) / 60
    );
    this.shortBreakMinInput.value = Math.floor(
      (settings.shortBreakDuration || CONFIG.TIMER.DEFAULT_SHORT_BREAK) / 60
    );
    this.longBreakMinInput.value = Math.floor(
      (settings.longBreakDuration || CONFIG.TIMER.DEFAULT_LONG_BREAK) / 60
    );
    this.sessionsInput.value =
      settings.sessionsBeforeLongBreak || CONFIG.TIMER.DEFAULT_SESSIONS;
  }

  hide() {
    // Add rotation animation
    this.settingsButton.classList.add("rotating");
    setTimeout(() => {
      this.settingsButton.classList.remove("rotating");
    }, 300);

    // Show todo content
    this.title.style.display = "block";
    this.addTodoContainer.style.display = "flex";
    this.todoListTitle.style.display = "block";
    this.todoList.style.display = "block";

    // Hide settings
    this.settingsPanel.style.display = "none";
  }

  save() {
    const pomodoroMins = parseInt(this.pomodoroMinInput.value) || 0;
    const shortBreakMins = parseInt(this.shortBreakMinInput.value) || 0;
    const longBreakMins = parseInt(this.longBreakMinInput.value) || 0;
    const sessions = parseInt(this.sessionsInput.value) || 4;

    const validation = this.validateSettings(
      pomodoroMins,
      shortBreakMins,
      longBreakMins,
      sessions
    );
    if (!validation.isValid) {
      this.showError(validation.message);
      return;
    }

    const settings = {
      pomodoroDuration: pomodoroMins * 60,
      shortBreakDuration: shortBreakMins * 60,
      longBreakDuration: longBreakMins * 60,
      sessionsBeforeLongBreak: sessions,
    };

    storage.savePomodoroSettings(settings);
    timerManager.updateSettings(settings);

    this.hide();
  }

  validateSettings(pomodoroMins, shortBreakMins, longBreakMins, sessions) {
    if (pomodoroMins > CONFIG.TIMER.MAX_POMODORO_MINUTES) {
      return {
        isValid: false,
        message: `⚠ Pomodoro duration cannot exceed ${CONFIG.TIMER.MAX_POMODORO_MINUTES} minutes`,
      };
    }
    if (pomodoroMins <= 0) {
      return {
        isValid: false,
        message: "⚠ Pomodoro duration must be at least 1 minute",
      };
    }
    if (shortBreakMins > CONFIG.TIMER.MAX_SHORT_BREAK_MINUTES) {
      return {
        isValid: false,
        message: `⚠ Short break cannot exceed ${CONFIG.TIMER.MAX_SHORT_BREAK_MINUTES} minutes`,
      };
    }
    if (shortBreakMins <= 0) {
      return {
        isValid: false,
        message: "⚠ Short break must be at least 1 minute",
      };
    }
    if (longBreakMins > CONFIG.TIMER.MAX_LONG_BREAK_MINUTES) {
      return {
        isValid: false,
        message: `⚠ Long break cannot exceed ${CONFIG.TIMER.MAX_LONG_BREAK_MINUTES} minutes`,
      };
    }
    if (longBreakMins <= 0) {
      return {
        isValid: false,
        message: "⚠ Long break must be at least 1 minute",
      };
    }
    if (sessions <= 0) {
      return {
        isValid: false,
        message: "⚠ Sessions before long break must be at least 1",
      };
    }
    return { isValid: true };
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.textContent = message;
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
  }
}

export const settingsManager = new SettingsManager();
