/**
 * UI Module
 * Handles UI utilities, dark mode, and keyboard shortcuts
 */

import { storage } from "./storage.js";
import { audioManager } from "./audio.js";
import { timerManager } from "./timer.js";

class UIManager {
  constructor() {
    this.darkModeToggle = null;
    this.soundToggleIcon = null;
    this.lockToggleIcon = null;
    this.lockToggleButton = null;
    this.resetTrigger = null;
    this.currentYear = null;
  }

  init(elements) {
    this.darkModeToggle = elements.darkModeToggle;
    this.soundToggleIcon = elements.soundToggleIcon;
    this.lockToggleIcon = elements.lockToggleIcon;
    this.lockToggleButton = elements.lockToggleButton;
    this.resetTrigger = elements.resetTrigger;
    this.currentYear = elements.currentYear;

    this.setupDarkMode();
    this.setupSoundToggle();
    this.setupLockToggle();
    this.setupReset();
    this.setupKeyboardShortcuts();
    this.setCurrentYear();
  }

  setupDarkMode() {
    // Load dark mode state
    if (storage.getDarkMode()) {
      document.documentElement.classList.add("dark");
      this.darkModeToggle.checked = true;
    }

    // Setup toggle listener
    this.darkModeToggle.addEventListener("change", () => {
      document.documentElement.classList.toggle("dark");
      storage.saveDarkMode(document.documentElement.classList.contains("dark"));
    });
  }

  setupSoundToggle() {
    // Load sound preference
    const isMusicEnabled = audioManager.isEnabled();
    const img = this.soundToggleIcon.querySelector("img");
    if (isMusicEnabled) {
      img.src = "assets/svg/sound.svg";
      img.alt = "Mute";
    } else {
      img.src = "assets/svg/mute.svg";
      img.alt = "Unmute";
    }

    // Setup toggle listener
    this.soundToggleIcon.addEventListener("click", () => this.toggleSound());
  }

  toggleSound() {
    const enabled = audioManager.toggle();
    const img = this.soundToggleIcon.querySelector("img");

    if (enabled) {
      img.src = "assets/svg/sound.svg";
      img.alt = "Mute";
      if (!timerManager.isPaused && timerManager.isTimerActive()) {
        audioManager.play();
      }
    } else {
      img.src = "assets/svg/mute.svg";
      img.alt = "Unmute";
      audioManager.pause();
    }
  }

  setupLockToggle() {
    // Load lock preference
    const isLocked = storage.getLockState();
    timerManager.setLockState(isLocked);

    const img = this.lockToggleIcon.querySelector("img");
    if (isLocked) {
      img.src = "assets/svg/lock.svg";
      img.alt = "Locked";
      this.lockToggleButton.setAttribute("aria-pressed", "true");
      this.lockToggleButton.classList.add("is-locked");
    } else {
      img.src = "assets/svg/unlock.svg";
      img.alt = "Unlocked";
      this.lockToggleButton.setAttribute("aria-pressed", "false");
      this.lockToggleButton.classList.remove("is-locked");
    }

    // Setup toggle listeners
    this.lockToggleButton.addEventListener("click", () => this.toggleLock());
    this.lockToggleButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggleLock();
      }
    });
  }

  toggleLock() {
    const isLocked = !timerManager.isLocked;
    timerManager.setLockState(isLocked);

    const img = this.lockToggleIcon.querySelector("img");

    // Add switching class for animation
    this.lockToggleIcon.classList.add("switching");

    setTimeout(() => {
      if (isLocked) {
        img.src = "assets/svg/lock.svg";
        img.alt = "Locked";
        this.lockToggleButton.setAttribute("aria-pressed", "true");
        this.lockToggleButton.classList.add("is-locked");
      } else {
        img.src = "assets/svg/unlock.svg";
        img.alt = "Unlocked";
        this.lockToggleButton.setAttribute("aria-pressed", "false");
        this.lockToggleButton.classList.remove("is-locked");
      }

      this.lockToggleIcon.classList.remove("switching");
    }, 150);

    storage.saveLockState(isLocked);
  }

  setupReset() {
    this.resetTrigger.addEventListener("change", () => {
      if (this.resetTrigger.checked) {
        setTimeout(() => {
          storage.clear();
          window.location.reload();
        }, 2000);
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      const isEditingTodo = document.querySelector(".todo-item.editing");
      const timerDisplay = document.getElementById("timer-display");
      const isEditingTimer =
        timerDisplay && timerDisplay.contentEditable === "true";
      const isTimerActive = timerManager.isTimerActive();

      // Don't handle shortcuts if editing or focus is on an input
      if (
        isEditingTodo ||
        isEditingTimer ||
        (e.target.tagName === "INPUT" && e.target.type !== "checkbox")
      ) {
        return;
      }

      // Space bar: Pause/Resume timer (when unlocked and timer is active)
      if (e.key === " " && isTimerActive && !timerManager.isLocked) {
        e.preventDefault();
        timerManager.togglePauseResume();
        return;
      }

      // M key: Toggle mute/unmute (when timer is active)
      if ((e.key === "m" || e.key === "M") && isTimerActive) {
        e.preventDefault();
        this.toggleSound();
        return;
      }

      // Escape key: Stop timer (when unlocked and timer is active)
      if (e.key === "Escape" && isTimerActive && !timerManager.isLocked) {
        e.preventDefault();
        timerManager.stop();
        return;
      }
    });
  }

  setCurrentYear() {
    if (this.currentYear) {
      this.currentYear.textContent = new Date().getFullYear();
    }
  }
}

export const uiManager = new UIManager();
