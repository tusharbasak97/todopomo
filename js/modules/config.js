/**
 * Configuration Module
 * Centralized configuration and constants
 */

export const CONFIG = {
  TIMER: {
    DEFAULT_POMODORO: 180 * 60, // 180 minutes in seconds
    DEFAULT_SHORT_BREAK: 15 * 60, // 15 minutes in seconds
    DEFAULT_LONG_BREAK: 30 * 60, // 30 minutes in seconds
    DEFAULT_SESSIONS: 4,
    MAX_POMODORO_MINUTES: 180,
    MAX_SHORT_BREAK_MINUTES: 15,
    MAX_LONG_BREAK_MINUTES: 30,
  },
  AUDIO: {
    DEFAULT_VOLUME: 0.3,
  },
  FOCUS: {
    CURSOR_HIDE_DELAY: 3000, // 3 seconds
  },
  FULLSCREEN: {
    MONITOR_INTERVAL: 100, // Check every 100ms
  },
};

export const STORAGE_KEYS = {
  TODOS: "todos",
  POMODORO_DURATION: "pomodoroDuration",
  SHORT_BREAK_DURATION: "shortBreakDuration",
  LONG_BREAK_DURATION: "longBreakDuration",
  SESSIONS_BEFORE_LONG_BREAK: "sessionsBeforeLongBreak",
  MUSIC_ENABLED: "isMusicEnabled",
  IS_LOCKED: "isLocked",
  DARK_MODE: "darkMode",
};

export const BLOCKED_SHORTCUTS = [
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

export const CRITICAL_KEYS = ["F5", "F11", "F12"];
