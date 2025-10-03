/**
 * Blocking Module
 * Handles keyboard/mouse blocking and fullscreen management
 */

import { BLOCKED_SHORTCUTS, CRITICAL_KEYS, CONFIG } from "./config.js";

class BlockingManager {
  constructor() {
    this.keyboardBlockingActive = false;
    this.mouseBlockingActive = false;
    this.blockedFullscreenExit = false;
    this.fullscreenMonitorInterval = null;
    this.timerOverlay = null;
    this.timerDisplay = null;
    this.isLocked = false;
  }

  setElements(timerOverlay, timerDisplay) {
    this.timerOverlay = timerOverlay;
    this.timerDisplay = timerDisplay;
  }

  setLockState(locked) {
    this.isLocked = locked;
  }

  // Keyboard blocking
  activateKeyboardBlocking() {
    if (this.keyboardBlockingActive) return;

    this.keyboardBlockingActive = true;
    document.addEventListener("keydown", this.keyboardHandler, true);
    document.addEventListener("keyup", this.keyUpHandler, true);
    this.startFullscreenMonitoring();
  }

  deactivateKeyboardBlocking() {
    if (!this.keyboardBlockingActive) return;

    this.keyboardBlockingActive = false;
    document.removeEventListener("keydown", this.keyboardHandler, true);
    document.removeEventListener("keyup", this.keyUpHandler, true);
    this.stopFullscreenMonitoring();
  }

  keyboardHandler = (e) => {
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

    if (isTimerControl && (e.key === "Enter" || e.key === " ")) {
      return;
    }

    if ((e.key === " " && !this.isLocked) || e.key === "m" || e.key === "M") {
      return;
    }

    const isBlocked = BLOCKED_SHORTCUTS.some((shortcut) => {
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

      if (e.key === "F11") {
        this.blockedFullscreenExit = true;
        setTimeout(() => {
          const isFullscreen = !!(
            document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement
          );

          if (
            !isFullscreen &&
            this.timerOverlay &&
            this.timerOverlay.classList.contains("visible")
          ) {
            this.enterFullscreen();
          }
          setTimeout(() => {
            this.blockedFullscreenExit = false;
          }, 100);
        }, 10);
      }

      return false;
    }
  };

  keyUpHandler = (e) => {
    if (CRITICAL_KEYS.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  };

  // Mouse blocking
  activateMouseBlocking() {
    if (this.mouseBlockingActive) return;

    this.mouseBlockingActive = true;
    document.addEventListener("contextmenu", this.preventContextMenu, true);
    document.addEventListener("dragstart", this.preventDrag, true);
    document.addEventListener("selectstart", this.preventSelection, true);
  }

  deactivateMouseBlocking() {
    if (!this.mouseBlockingActive) return;

    this.mouseBlockingActive = false;
    document.removeEventListener("contextmenu", this.preventContextMenu, true);
    document.removeEventListener("dragstart", this.preventDrag, true);
    document.removeEventListener("selectstart", this.preventSelection, true);
  }

  preventContextMenu = (e) => {
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
      return false;
    }
  };

  preventDrag = (e) => {
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
      return false;
    }
  };

  preventSelection = (e) => {
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
  };

  // Fullscreen management
  startFullscreenMonitoring() {
    if (this.fullscreenMonitorInterval) return;

    this.fullscreenMonitorInterval = setInterval(() => {
      const isTimerActive =
        this.timerOverlay && this.timerOverlay.classList.contains("visible");
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      const isEditingTimer =
        this.timerDisplay && this.timerDisplay.contentEditable === "true";
      if (isTimerActive && !isFullscreen && !this.isLocked && !isEditingTimer) {
        this.enterFullscreen();
      }
    }, CONFIG.FULLSCREEN.MONITOR_INTERVAL);
  }

  stopFullscreenMonitoring() {
    if (this.fullscreenMonitorInterval) {
      clearInterval(this.fullscreenMonitorInterval);
      this.fullscreenMonitorInterval = null;
    }
  }

  enterFullscreen() {
    const element = document.documentElement;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }

    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {
        // Silent fail - orientation lock not supported
      });
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  }

  handleFullscreenChange = () => {
    const isTimerActive =
      this.timerOverlay && this.timerOverlay.classList.contains("visible");
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

    if (isTimerActive && !isFullscreen) {
      if (this.blockedFullscreenExit) {
        setTimeout(() => {
          this.enterFullscreen();
        }, 50);
      } else {
        // This will be handled by timer module
        if (this.onFullscreenExit) {
          this.onFullscreenExit();
        }
      }
    }
  };

  setupFullscreenListeners(onFullscreenExit) {
    this.onFullscreenExit = onFullscreenExit;
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.addEventListener(
      "mozfullscreenchange",
      this.handleFullscreenChange
    );
    document.addEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange
    );
    document.addEventListener(
      "MSFullscreenChange",
      this.handleFullscreenChange
    );
  }

  activate() {
    this.activateKeyboardBlocking();
    this.activateMouseBlocking();
  }

  deactivate() {
    this.deactivateKeyboardBlocking();
    this.deactivateMouseBlocking();
  }
}

export const blockingManager = new BlockingManager();
