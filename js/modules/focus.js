/**
 * Focus Module
 * Handles cursor hiding and notification blocking
 */

import { CONFIG } from "./config.js";

class FocusManager {
  constructor() {
    this.cursorTimeout = null;
    this.cursorShowHandler = null;
    this.timerOverlay = null;
  }

  setTimerOverlay(overlay) {
    this.timerOverlay = overlay;
  }

  activateCursorHiding() {
    const hideCursor = () => {
      if (
        this.timerOverlay &&
        this.timerOverlay.classList.contains("visible")
      ) {
        this.timerOverlay.style.cursor = "none";
      }
    };

    this.cursorShowHandler = () => {
      if (
        this.timerOverlay &&
        this.timerOverlay.classList.contains("visible")
      ) {
        this.timerOverlay.style.cursor = "auto";
      }
      clearTimeout(this.cursorTimeout);
      this.cursorTimeout = setTimeout(
        hideCursor,
        CONFIG.FOCUS.CURSOR_HIDE_DELAY
      );
    };

    if (this.timerOverlay) {
      this.timerOverlay.addEventListener("mousemove", this.cursorShowHandler);
    }
    this.cursorTimeout = setTimeout(hideCursor, CONFIG.FOCUS.CURSOR_HIDE_DELAY);
  }

  deactivateCursorHiding() {
    if (this.timerOverlay) {
      this.timerOverlay.style.cursor = "auto";
    }
    clearTimeout(this.cursorTimeout);
    if (this.cursorShowHandler && this.timerOverlay) {
      this.timerOverlay.removeEventListener(
        "mousemove",
        this.cursorShowHandler
      );
      this.cursorShowHandler = null;
    }
  }

  activateNotificationBlocking() {
    if ("Notification" in window && !window.originalNotification) {
      window.originalNotification = window.Notification;
      window.Notification = function (...args) {
        // Silently block notifications during timer session
        return { close: () => {}, addEventListener: () => {} };
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
  }

  deactivateNotificationBlocking() {
    if (window.originalNotification) {
      window.Notification = window.originalNotification;
      delete window.originalNotification;
    }
  }

  activate() {
    this.activateCursorHiding();
    this.activateNotificationBlocking();
  }

  deactivate() {
    this.deactivateCursorHiding();
    this.deactivateNotificationBlocking();
  }
}

export const focusManager = new FocusManager();
