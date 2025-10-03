/**
 * Storage Module
 * Handles all localStorage operations
 */

import { STORAGE_KEYS } from "./config.js";

export const storage = {
  // Generic methods
  get(key) {
    return localStorage.getItem(key);
  },

  set(key, value) {
    localStorage.setItem(key, value);
  },

  getJSON(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },

  setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  clear() {
    // Preserve music state before clearing
    const musicEnabled = this.get(STORAGE_KEYS.MUSIC_ENABLED);

    // Clear all storage
    localStorage.clear();

    // Restore music state
    if (musicEnabled !== null) {
      this.set(STORAGE_KEYS.MUSIC_ENABLED, musicEnabled);
    }
  },

  // Todos
  getTodos() {
    return this.getJSON(STORAGE_KEYS.TODOS) || [];
  },

  saveTodos(todos) {
    this.setJSON(STORAGE_KEYS.TODOS, todos);
  },

  // Timer settings
  getPomodoroSettings() {
    return {
      pomodoroDuration:
        parseInt(this.get(STORAGE_KEYS.POMODORO_DURATION)) || null,
      shortBreakDuration:
        parseInt(this.get(STORAGE_KEYS.SHORT_BREAK_DURATION)) || null,
      longBreakDuration:
        parseInt(this.get(STORAGE_KEYS.LONG_BREAK_DURATION)) || null,
      sessionsBeforeLongBreak:
        parseInt(this.get(STORAGE_KEYS.SESSIONS_BEFORE_LONG_BREAK)) || null,
    };
  },

  savePomodoroSettings(settings) {
    this.set(STORAGE_KEYS.POMODORO_DURATION, settings.pomodoroDuration);
    this.set(STORAGE_KEYS.SHORT_BREAK_DURATION, settings.shortBreakDuration);
    this.set(STORAGE_KEYS.LONG_BREAK_DURATION, settings.longBreakDuration);
    this.set(
      STORAGE_KEYS.SESSIONS_BEFORE_LONG_BREAK,
      settings.sessionsBeforeLongBreak
    );
  },

  // Music preference
  getMusicEnabled() {
    const value = this.get(STORAGE_KEYS.MUSIC_ENABLED);
    return value !== null ? value === "true" : true;
  },

  saveMusicEnabled(enabled) {
    this.set(STORAGE_KEYS.MUSIC_ENABLED, enabled);
  },

  // Lock preference
  getLockState() {
    const value = this.get(STORAGE_KEYS.IS_LOCKED);
    return value !== null ? value === "true" : false;
  },

  saveLockState(locked) {
    this.set(STORAGE_KEYS.IS_LOCKED, locked);
  },

  // Dark mode
  getDarkMode() {
    return this.get(STORAGE_KEYS.DARK_MODE) === "true";
  },

  saveDarkMode(enabled) {
    this.set(STORAGE_KEYS.DARK_MODE, enabled);
  },
};
