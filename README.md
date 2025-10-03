# TodoPomo - Pomodoro Timer with Todo List

A modern, neumorphic-styled productivity app combining todo list management with a Pomodoro timer. Built with a clean modular architecture for easy maintenance and extensibility.

🌐 **[Live Demo](https://tusharbasak97.github.io/todopomo/)** - Try it now!

## ✨ Features

### 🎯 Core Functionality

- **Todo Management**: Add, edit, delete, and mark todos as complete
- **Pomodoro Timer**: Customizable work/break intervals with fullscreen mode
- **Live Timer Editing**: Click timer to edit time directly (supports MM:SS or HH:MM:SS)
- **Settings Panel**: Configure durations, breaks, and sessions
- **Data Persistence**: All data saved to localStorage

### 🎨 User Experience

- **Neumorphic Design**: Modern, soft UI with subtle shadows
- **Dark/Light Mode**: Seamless theme switching with persistence
- **Background Music**: Optional focus music during work sessions
- **Lock Mode**: Prevent accidental timer stops
- **Professional Validation**: Input limits and error messages

### 🔒 Focus Features

- **Fullscreen Timer**: Immersive fullscreen mode
- **Distraction Blocking**: Blocks 25+ keyboard shortcuts (F5, F11, F12, Ctrl+T, etc.)
- **Cursor Auto-Hide**: Hides cursor after 3 seconds of inactivity
- **Notification Blocking**: Prevents external notifications during work sessions
- **Context Menu Blocking**: Disables right-click during timer

### ⌨️ Keyboard Shortcuts

- **Space**: Pause/resume timer (when unlocked)
- **M**: Mute/unmute background music
- **Escape**: Stop timer (when unlocked)
- **Enter**: Save when editing todo or timer

## 🏗️ Architecture

This app uses a **modular architecture** with ES6 modules for better maintainability and scalability.

### Project Structure

```
todopomo/
├── index.html             # Main HTML file
├── favicon.ico            # Root favicon
├── css/
│   └── style.css          # Styling
├── js/
│   ├── main.js            # Application entry point & PWA setup
│   ├── service-worker.js  # PWA service worker for offline support
│   └── modules/           # Modular JavaScript architecture
│       ├── config.js      # Configuration & constants (72 lines)
│       ├── storage.js     # LocalStorage management (93 lines)
│       ├── audio.js       # Background music control (83 lines)
│       ├── timer.js       # Pomodoro timer logic (572 lines)
│       ├── blocking.js    # Keyboard/mouse blocking (314 lines)
│       ├── focus.js       # Cursor hiding & notifications (95 lines)
│       ├── todos.js       # Todo list management (212 lines)
│       ├── settings.js    # Settings panel (196 lines)
│       └── ui.js          # UI utilities & dark mode (198 lines)
└── assets/
    ├── audio/
    │   └── focus.mp3      # Background focus music
    ├── images/            # Favicons & PWA icons (8 files)
    ├── svg/               # UI icons (12 files)
    ├── site.webmanifest   # PWA manifest
    └── browserconfig.xml  # Windows tile config
```

### Module Dependencies

```
main.js
  ├─→ modules/todos.js ──┐
  ├─→ modules/timer.js ←─┤ (callback pattern)
  ├─→ modules/settings.js
  ├─→ modules/ui.js
  └─→ modules/storage.js
         ↑
         └── config.js

timer.js
  ├─→ config.js
  ├─→ storage.js
  ├─→ audio.js
  ├─→ blocking.js
  └─→ focus.js
```

### Key Modules

- **main.js** (265 lines) - Initializes all modules, PWA registration, 3-second install prompt
- **timer.js** (572 lines) - Core Pomodoro functionality with GSAP animations
- **blocking.js** (314 lines) - Prevents distractions (25+ blocked shortcuts, fullscreen lock)
- **focus.js** (95 lines) - Cursor hiding and notification blocking
- **storage.js** (93 lines) - Centralized data persistence (todos, settings, preferences)
- **audio.js** (83 lines) - Background music with autoplay handling
- **todos.js** (212 lines) - Todo CRUD operations
- **settings.js** (196 lines) - Settings panel logic
- **ui.js** (198 lines) - Dark mode, keyboard shortcuts, UI utilities
- **config.js** (72 lines) - Constants and configuration

### Architecture Benefits

- ✅ **Maintainable**: Small, focused files (72-572 lines each)
- ✅ **Testable**: Modules can be tested independently
- ✅ **Scalable**: Easy to add features without touching existing code
- ✅ **No Circular Dependencies**: Clean dependency tree with callback pattern
- ✅ **Tree-Shakeable**: ES6 modules enable dead code elimination
- ✅ **Production Ready**: No console logs, silent error handling

### PWA Features

- 📱 **Installable**: Shows install prompt 3 seconds after page load
- 🔌 **Offline Support**: Full functionality without internet
- 💾 **Smart Caching**: 44 assets cached (CSS, JS, images, audio, GSAP)
- ⚡ **Performance**: Audio never re-downloads (0 KB on reload)
- 🚀 **Fast Load**: Cache-first strategy for instant loading

## 🚀 Installation

### Basic Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/tusharbasak97/todopomo.git
   cd todopomo
   ```

2. Serve with any HTTP server:

   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx http-server

   # PHP
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your browser

**Note:** Must be served via HTTP server (not `file://`) for ES6 modules to work.

## 📖 Usage

### Todo Management

1. Enter task in input field and click "Add"
2. Click checkbox to mark complete
3. Click edit icon to modify text
4. Click play icon to start timer
5. Click delete icon to remove

### Pomodoro Timer

1. Click play icon on any todo to start
2. Timer enters fullscreen automatically
3. **Controls**:
   - Play/Pause: Toggle timer
   - Edit: Click timer display to edit time
   - Stop: End current session
   - Lock: Prevent accidental changes
   - Sound: Toggle background music

### Timer Editing

- Click the timer display when running
- Enter time in these formats:
  - `30` = 00:30:00 (30 minutes)
  - `1:30` = 00:01:30 (1 min 30 sec)
  - `1:30:45` = 01:30:45 (1 hr 30 min 45 sec)
- Press Enter or click save icon

### Settings

1. Click settings gear icon
2. **Configure**:
   - Pomodoro Duration: 1-180 minutes (default: 180)
   - Short Break: 1-15 minutes (default: 15)
   - Long Break: 1-30 minutes (default: 30)
   - Sessions Before Long Break: Any number (default: 4)
3. Click "Back to Todo" to save

### Dark Mode

- Toggle switch in top-right corner
- Preference persists across sessions

### Lock Mode

- Click lock icon during timer
- Prevents pause, stop, and edit
- Useful for committed work sessions

### Reset

- Click reset button in bottom-right
- Clears all data (todos, settings, preferences)
- Requires 2-second animation confirmation

## 🛠️ Development

### Project Structure

```
todopomo/
├── index.html           # Main HTML file
├── css/
│   └── style.css       # Neumorphic styles
├── js/
│   ├── main.js         # Entry point
│   └── modules/        # Modular JavaScript
├── assets/
│   ├── audio/          # Background music
│   ├── images/         # Favicons
│   └── svg/            # UI icons
└── README.md
```

### Adding Features

**Example: Adding a new module**

```javascript
// js/modules/myFeature.js
class MyFeatureManager {
  init(elements) {
    // Initialize
  }
}

export const myFeatureManager = new MyFeatureManager();
```

```javascript
// In main.js
import { myFeatureManager } from "./modules/myFeature.js";
myFeatureManager.init({
  /* elements */
});
```

### Debugging

Access modules in browser console:

```javascript
// Check timer state
window.__todopomo.timerManager.isTimerActive();

// Get all todos
window.__todopomo.storage.getTodos();

// Toggle music
window.__todopomo.audioManager.toggle();
```

## 🌐 Browser Support

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (macOS 11+)
- **Opera**: ✅ Full support
- **IE**: ❌ Not supported (requires ES6 modules)

**Requirements**: ES6 modules, CSS variables, requestAnimationFrame

## 🎨 Technologies

- **HTML5**: Semantic markup
- **CSS3**: Neumorphic design, CSS variables, animations
- **JavaScript (ES6+)**: Modules, classes, async/await
- **GSAP**: Timer digit animations
- **LocalStorage**: Data persistence
- **Fullscreen API**: Immersive timer mode
- **Web Audio API**: Background music
- **Notification API**: Blocking external notifications

## 📝 Configuration

### Timer Defaults

```javascript
// js/modules/config.js
CONFIG.TIMER = {
  DEFAULT_POMODORO: 180 * 60, // 180 minutes
  DEFAULT_SHORT_BREAK: 15 * 60, // 15 minutes
  DEFAULT_LONG_BREAK: 30 * 60, // 30 minutes
  DEFAULT_SESSIONS: 4, // Sessions before long break
};
```

### Blocked Shortcuts

The app blocks 25+ distraction shortcuts including:

- F5, F11, F12 (browser functions)
- Ctrl+T, Ctrl+N, Ctrl+W (tabs/windows)
- Ctrl+R, Ctrl+P (refresh, print)
- Alt+F4, Alt+Tab (system shortcuts)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Follow the modular architecture pattern
4. Test thoroughly (all features, keyboard shortcuts, persistence)
5. Commit changes: `git commit -m 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit pull request

### Code Style

- Use ES6 modules (import/export)
- Keep modules focused (single responsibility)
- Add JSDoc comments
- Handle errors gracefully
- Avoid circular dependencies

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Tushar Basak**

- GitHub: [@tusharbasak97](https://github.com/tusharbasak97)

---

⭐ Star this repo if you find it helpful!

Built with ❤️ for productivity enthusiasts</content>
