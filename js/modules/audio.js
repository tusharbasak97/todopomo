/**
 * Audio Module
 * Handles background music playback
 */

import { CONFIG } from "./config.js";
import { storage } from "./storage.js";

class AudioManager {
  constructor() {
    this.backgroundMusic = document.getElementById("background-music");
    this.isMusicEnabled = storage.getMusicEnabled();
    this.init();
  }

  init() {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = CONFIG.AUDIO.DEFAULT_VOLUME;
      // Lazy load audio only when needed
      this.audioLoaded = false;
    }
  }

  // Lazy load audio when first needed
  loadAudio() {
    if (!this.audioLoaded && this.backgroundMusic) {
      this.backgroundMusic.load();
      this.audioLoaded = true;
    }
  }

  play(reset = false) {
    if (this.isMusicEnabled && this.backgroundMusic) {
      try {
        // Load audio only when first played
        this.loadAudio();

        if (reset) {
          this.backgroundMusic.currentTime = 0;
        }
        const playPromise = this.backgroundMusic.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Music started successfully
            })
            .catch(() => {
              // Music playback blocked (user interaction required)
            });
        }
      } catch (error) {
        // Silent fail - music could not start
      }
    }
  }

  pause() {
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.pause();
      } catch (error) {
        // Silent fail - music could not pause
      }
    }
  }

  stop() {
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
      } catch (error) {
        // Silent fail - music could not stop
      }
    }
  }

  toggle() {
    this.isMusicEnabled = !this.isMusicEnabled;
    storage.saveMusicEnabled(this.isMusicEnabled);
    return this.isMusicEnabled;
  }

  setEnabled(enabled) {
    this.isMusicEnabled = enabled;
    storage.saveMusicEnabled(enabled);
  }

  isEnabled() {
    return this.isMusicEnabled;
  }
}

export const audioManager = new AudioManager();
