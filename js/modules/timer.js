/**
 * Timer Module
 * Handles Pomodoro timer functionality
 */

import { CONFIG } from "./config.js";
import { storage } from "./storage.js";
import { audioManager } from "./audio.js";
import { blockingManager } from "./blocking.js";
import { focusManager } from "./focus.js";

class TimerManager {
  constructor() {
    this.timerRequest = null;
    this.currentTimerLi = null;
    this.remainingTime = 0;
    this.isPaused = false;
    this.lastFrameTime = null;
    this.isBreak = false;
    this.completedTasks = 0;
    this.isLocked = false;

    // DOM elements
    this.timerOverlay = null;
    this.timerDisplay = null;
    this.timerTaskTitle = null;
    this.editTimerIcon = null;
    this.pauseResumeIcon = null;
    this.stopIcon = null;
    this.timerInputHelper = null;

    // Settings
    const savedSettings = storage.getPomodoroSettings();
    this.pomodoroDuration =
      savedSettings.pomodoroDuration || CONFIG.TIMER.DEFAULT_POMODORO;
    this.shortBreakDuration =
      savedSettings.shortBreakDuration || CONFIG.TIMER.DEFAULT_SHORT_BREAK;
    this.longBreakDuration =
      savedSettings.longBreakDuration || CONFIG.TIMER.DEFAULT_LONG_BREAK;
    this.sessionsBeforeLongBreak =
      savedSettings.sessionsBeforeLongBreak || CONFIG.TIMER.DEFAULT_SESSIONS;
  }

  init(elements) {
    this.timerOverlay = elements.timerOverlay;
    this.timerDisplay = elements.timerDisplay;
    this.timerTaskTitle = elements.timerTaskTitle;
    this.editTimerIcon = elements.editTimerIcon;
    this.pauseResumeIcon = elements.pauseResumeIcon;
    this.stopIcon = elements.stopIcon;
    this.timerInputHelper = document.getElementById("timer-input-helper");

    // Setup blocking manager
    blockingManager.setElements(this.timerOverlay, this.timerDisplay);
    blockingManager.setupFullscreenListeners(() => this.stop());

    // Setup focus manager
    focusManager.setTimerOverlay(this.timerOverlay);

    // Load lock state
    this.isLocked = storage.getLockState();

    this.setupEventListeners();
    this.setupTimerDisplayListeners();
  }

  setupEventListeners() {
    this.editTimerIcon.addEventListener("click", () => {
      if (!this.isLocked) this.toggleEdit();
    });
    this.pauseResumeIcon.addEventListener("click", () =>
      this.togglePauseResume()
    );
    this.stopIcon.addEventListener("click", () => this.stop());
  }

  setupTimerDisplayListeners() {
    // Add inputmode attribute for mobile numeric keyboard
    this.timerDisplay.setAttribute("inputmode", "numeric");
    this.timerDisplay.setAttribute("pattern", "[0-9:]*");

    // Handle Enter key to save when editing timer
    this.timerDisplay.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.toggleEdit();
      }
    });

    // Smart timer input formatting
    this.timerDisplay.addEventListener("input", (e) => {
      if (this.timerDisplay.contentEditable === "true") {
        let value = this.timerDisplay.textContent.replace(/[^0-9]/g, "");

        if (value.length >= 2) {
          if (value.length <= 4) {
            value =
              value.slice(0, 2) +
              (value.length > 2 ? ":" + value.slice(2) : "");
          } else {
            value =
              value.slice(0, 2) +
              ":" +
              value.slice(2, 4) +
              (value.length > 4 ? ":" + value.slice(4, 6) : "");
          }
        }

        if (value.replace(/:/g, "").length > 6) {
          value = value.slice(0, 8);
        }

        this.timerDisplay.textContent = value;

        const range = document.createRange();
        range.selectNodeContents(this.timerDisplay);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }

  start(todoLi) {
    const taskText = todoLi.querySelector("label").textContent.trim();
    this.timerTaskTitle.textContent = taskText;

    this.currentTimerLi = todoLi;
    this.remainingTime = this.pomodoroDuration;
    this.isBreak = false;

    this.timerOverlay.classList.add("visible");

    // GSAP animation for timer overlay show
    gsap.fromTo(
      this.timerOverlay,
      {
        scale: 0.8,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      }
    );

    blockingManager.enterFullscreen();
    this.pauseResumeIcon.querySelector("img").src = "assets/svg/pause.svg";
    this.pauseResumeIcon.querySelector("img").alt = "Pause";

    // Activate blocking and focus features
    blockingManager.activate();
    blockingManager.setLockState(this.isLocked);
    focusManager.activate();

    // Display initial time
    const hours = Math.floor(this.remainingTime / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = this.remainingTime % 60;
    const initialTimeText = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    this.setTimerDigits(initialTimeText);

    // Start music
    audioManager.play(true);

    this.lastFrameTime = performance.now();
    this.timerRequest = requestAnimationFrame((time) => this.updateTimer(time));
  }

  startBreak() {
    if (
      this.completedTasks % this.sessionsBeforeLongBreak === 0 &&
      this.completedTasks > 0
    ) {
      this.timerTaskTitle.textContent = "Long Break";
      this.remainingTime = this.longBreakDuration;
    } else {
      this.timerTaskTitle.textContent = "Break";
      this.remainingTime = this.shortBreakDuration;
    }
    this.isBreak = true;

    const hours = Math.floor(this.remainingTime / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = this.remainingTime % 60;
    const initialTimeText = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    this.setTimerDigits(initialTimeText);

    audioManager.play(true);

    this.lastFrameTime = performance.now();
    this.timerRequest = requestAnimationFrame((time) => this.updateTimer(time));
  }

  togglePauseResume() {
    if (this.isLocked) return;

    const img = this.pauseResumeIcon.querySelector("img");

    // GSAP animation for icon change
    gsap.to(img, {
      scale: 0,
      rotation: 180,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        if (this.isPaused) {
          img.src = "assets/svg/pause.svg";
          img.alt = "Pause";
          this.isPaused = false;
          this.startCountdown();
          audioManager.play();
        } else {
          img.src = "assets/svg/play.svg";
          img.alt = "Resume";
          this.isPaused = true;
          cancelAnimationFrame(this.timerRequest);
          audioManager.pause();
        }

        // Animate back in
        gsap.to(img, {
          scale: 1,
          rotation: 360,
          duration: 0.2,
          ease: "back.out(1.7)",
        });
      },
    });
  }

  startCountdown() {
    audioManager.play();
    this.lastFrameTime = performance.now();
    this.timerRequest = requestAnimationFrame((time) => this.updateTimer(time));
  }

  stop() {
    if (this.isLocked) return;

    cancelAnimationFrame(this.timerRequest);
    audioManager.stop();

    blockingManager.deactivate();
    focusManager.deactivate();

    this.hide();
  }

  hide() {
    // GSAP animation for timer overlay hide
    gsap.to(this.timerOverlay, {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        this.timerOverlay.classList.remove("visible");
      },
    });

    blockingManager.exitFullscreen();
    this.timerTaskTitle.textContent = "";
    audioManager.stop();

    if (blockingManager.keyboardBlockingActive) {
      blockingManager.deactivate();
    }
    focusManager.deactivate();
  }

  updateTimer = (currentTime) => {
    if (this.isPaused) return;

    if (!this.lastFrameTime) {
      this.lastFrameTime = currentTime;
    }

    const deltaTime = currentTime - this.lastFrameTime;

    if (deltaTime >= 1000) {
      this.remainingTime--;
      const hours = Math.floor(this.remainingTime / 3600);
      const minutes = Math.floor((this.remainingTime % 3600) / 60);
      const seconds = this.remainingTime % 60;

      const newTimeText = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      this.animateTimeChange(newTimeText);

      this.lastFrameTime = currentTime - (deltaTime % 1000);

      if (this.remainingTime <= 0) {
        if (!this.isBreak) {
          const checkbox = this.currentTimerLi.querySelector(
            'input[type="checkbox"]'
          );
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          this.completedTasks++;
          this.startBreak();
        } else {
          this.startNextTask();
        }
        return;
      }
    }

    this.timerRequest = requestAnimationFrame((time) => this.updateTimer(time));
  };

  startNextTask() {
    const tasks = document.querySelectorAll(".todo-item:not(.completed)");
    if (tasks.length > 0) {
      this.start(tasks[0]);
    } else {
      this.hide();
    }
  }

  animateTimeChange(newTimeText) {
    const digitSpans = this.timerDisplay.querySelectorAll(".timer-digit");
    const newDigits = newTimeText.replace(/:/g, "").split("");
    const currentDigits = Array.from(digitSpans).map(
      (span) => span.textContent
    );

    digitSpans.forEach((span, index) => {
      if (currentDigits[index] !== newDigits[index]) {
        const currentDigit = parseInt(currentDigits[index]);
        const newDigit = parseInt(newDigits[index]);
        const isRollover = currentDigit === 0 && newDigit === 9;

        if (isRollover) {
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
                { duration: 0.3, y: 0, opacity: 1, ease: "power2.out" }
              );
            },
          });
        } else {
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
                { duration: 0.3, y: 0, opacity: 1, ease: "power2.out" }
              );
            },
          });
        }
      }
    });
  }

  setTimerDigits(timeText) {
    const digitSpans = this.timerDisplay.querySelectorAll(".timer-digit");
    const digits = timeText.replace(/:/g, "").split("");
    digitSpans.forEach((span, index) => {
      span.textContent = digits[index] || "0";
    });
  }

  toggleEdit() {
    if (this.isLocked) return;

    const isEditable = this.timerDisplay.contentEditable === "true";

    if (isEditable) {
      this.saveEditedTime();
    } else {
      this.enableEditing();
    }
  }

  saveEditedTime() {
    const timeText = this.timerDisplay.textContent.trim();
    let hours = 0,
      minutes = 0,
      seconds = 0;

    const parts = timeText.replace(/[^0-9:]/g, "").split(":");

    if (parts.length === 1) {
      minutes = parseInt(parts[0]) || 0;
    } else if (parts.length === 2) {
      minutes = parseInt(parts[0]) || 0;
      seconds = parseInt(parts[1]) || 0;
    } else if (parts.length === 3) {
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
      seconds = parseInt(parts[2]) || 0;
    }

    const validation = this.validateTime(hours, minutes, seconds);
    if (!validation.isValid) {
      this.showTimerError(validation.message);
      return;
    }

    this.remainingTime = hours * 3600 + minutes * 60 + seconds;

    this.timerDisplay.contentEditable = "false";
    this.timerDisplay.innerHTML = `
      <span class="timer-digit" data-position="0">0</span>
      <span class="timer-digit" data-position="1">0</span>
      <span class="timer-separator">:</span>
      <span class="timer-digit" data-position="2">0</span>
      <span class="timer-digit" data-position="3">0</span>
      <span class="timer-separator">:</span>
      <span class="timer-digit" data-position="4">0</span>
      <span class="timer-digit" data-position="5">0</span>
    `;

    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    this.setTimerDigits(formattedTime);

    // Show timer task title again when done editing
    this.timerTaskTitle.style.display = "";

    this.pauseResumeIcon.style.pointerEvents = "";
    this.pauseResumeIcon.style.opacity = "";
    this.stopIcon.style.pointerEvents = "";
    this.stopIcon.style.opacity = "";

    this.editTimerIcon.querySelector("img").src = "assets/svg/edit.svg";
    this.editTimerIcon.querySelector("img").alt = "Edit Timer";

    if (this.remainingTime > 0) {
      this.isPaused = false;
      this.pauseResumeIcon.querySelector("img").src = "assets/svg/pause.svg";
      this.pauseResumeIcon.querySelector("img").alt = "Pause";
      this.startCountdown();
    }
  }

  validateTime(hours, minutes, seconds) {
    if (seconds >= 60) {
      return { isValid: false, message: "⚠ Seconds: 0-59" };
    }
    if (minutes >= 60) {
      return { isValid: false, message: "⚠ Minutes: 0-59" };
    }
    if (hours > 3) {
      return { isValid: false, message: "⚠ Max 3 hours" };
    }
    if (hours === 3 && (minutes > 0 || seconds > 0)) {
      return { isValid: false, message: "⚠ Max 03:00:00" };
    }
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return { isValid: false, message: "⚠ Set valid time" };
    }
    return { isValid: true };
  }

  showTimerError(message) {
    const digitSpans = this.timerDisplay.querySelectorAll(
      ".timer-digit, .timer-separator"
    );
    digitSpans.forEach((span) => (span.style.display = "none"));

    this.timerDisplay.textContent = message;
    this.timerDisplay.style.color = "hsl(348, 100%, 61%)";
    this.timerDisplay.style.fontSize = "clamp(1rem, 4vw, 2rem)";
    this.timerDisplay.style.fontWeight = "500";
    this.timerDisplay.style.textShadow = "0 2px 4px hsla(348, 100%, 61%, 0.3)";
    this.timerDisplay.style.whiteSpace = "normal";
    this.timerDisplay.style.wordWrap = "break-word";
    this.timerDisplay.style.maxWidth = "90vw";
    this.timerDisplay.style.textAlign = "center";
    this.timerDisplay.style.lineHeight = "1.4";
    this.timerDisplay.style.minHeight = "auto";
    this.timerDisplay.style.maxHeight = "none";

    // GSAP shake animation
    gsap.fromTo(
      this.timerDisplay,
      { x: -10 },
      {
        x: 10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.set(this.timerDisplay, { x: 0 });
        },
      }
    );

    setTimeout(() => {
      this.timerDisplay.innerHTML = `
        <span class="timer-digit" data-position="0">0</span>
        <span class="timer-digit" data-position="1">0</span>
        <span class="timer-separator">:</span>
        <span class="timer-digit" data-position="2">0</span>
        <span class="timer-digit" data-position="3">0</span>
        <span class="timer-separator">:</span>
        <span class="timer-digit" data-position="4">0</span>
        <span class="timer-digit" data-position="5">0</span>
      `;

      const hours = Math.floor(this.remainingTime / 3600);
      const minutes = Math.floor((this.remainingTime % 3600) / 60);
      const seconds = this.remainingTime % 60;
      const currentTimeText = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      this.setTimerDigits(currentTimeText);

      this.timerDisplay.style.color = "";
      this.timerDisplay.style.fontSize = "";
      this.timerDisplay.style.fontWeight = "";
      this.timerDisplay.style.textShadow = "";
      this.timerDisplay.style.animation = "";
      this.timerDisplay.style.whiteSpace = "";
      this.timerDisplay.style.wordWrap = "";
      this.timerDisplay.style.maxWidth = "";
      this.timerDisplay.style.textAlign = "";
      this.timerDisplay.style.lineHeight = "";
      this.timerDisplay.style.minHeight = "";
      this.timerDisplay.style.maxHeight = "";

      const newDigitSpans = this.timerDisplay.querySelectorAll(
        ".timer-digit, .timer-separator"
      );
      newDigitSpans.forEach((span) => (span.style.display = "none"));

      this.timerDisplay.textContent = currentTimeText;
      this.timerDisplay.focus();

      const range = document.createRange();
      range.selectNodeContents(this.timerDisplay);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }, 2500);
  }

  enableEditing() {
    if (!this.isPaused && this.timerRequest) {
      cancelAnimationFrame(this.timerRequest);
      this.isPaused = true;
      this.pauseResumeIcon.querySelector("img").src = "assets/svg/play.svg";
      this.pauseResumeIcon.querySelector("img").alt = "Resume";
      audioManager.pause();
    }

    // Hide timer task title when editing
    this.timerTaskTitle.style.display = "none";

    this.pauseResumeIcon.style.pointerEvents = "none";
    this.pauseResumeIcon.style.opacity = "0.3";
    this.stopIcon.style.pointerEvents = "none";
    this.stopIcon.style.opacity = "0.3";

    const digitSpans = this.timerDisplay.querySelectorAll(
      ".timer-digit, .timer-separator"
    );
    const currentDigits = Array.from(
      this.timerDisplay.querySelectorAll(".timer-digit")
    ).map((span) => span.textContent);
    const currentTime =
      currentDigits.slice(0, 2).join("") +
      ":" +
      currentDigits.slice(2, 4).join("") +
      ":" +
      currentDigits.slice(4, 6).join("");

    digitSpans.forEach((span) => (span.style.display = "none"));

    this.timerDisplay.textContent = currentTime;
    this.timerDisplay.contentEditable = "true";
    this.timerDisplay.focus();

    const range = document.createRange();
    range.selectNodeContents(this.timerDisplay);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    this.editTimerIcon.querySelector("img").src = "assets/svg/save.svg";
    this.editTimerIcon.querySelector("img").alt = "Save Timer";
  }

  updateSettings(settings) {
    this.pomodoroDuration = settings.pomodoroDuration;
    this.shortBreakDuration = settings.shortBreakDuration;
    this.longBreakDuration = settings.longBreakDuration;
    this.sessionsBeforeLongBreak = settings.sessionsBeforeLongBreak;
  }

  setLockState(locked) {
    this.isLocked = locked;
    blockingManager.setLockState(locked);
  }

  isTimerActive() {
    return this.timerOverlay && this.timerOverlay.classList.contains("visible");
  }
}

export const timerManager = new TimerManager();
