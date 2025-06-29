# Electron App

A beautiful Electron desktop application running at 800x600 pixels.

## Features

- 🎨 Modern, responsive UI with gradient background
- 📱 Fixed window size (800x600 pixels)
- 🔧 System information display
- 🎯 Interactive buttons
- ✨ Smooth animations and floating shapes
- 🖥️ Fullscreen toggle functionality

## Prerequisites

- Node.js (v11.8.0 or higher)
- npm (v6.5.0 or higher)

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

### Development Mode
```bash
npm start
```

### Development Mode with Dev Tools
```bash
npm run dev
```

## Project Structure

```
node1test/
├── main.js          # Main Electron process
├── index.html       # Renderer process (UI)
├── package.json     # Project configuration
└── README.md        # This file
```

## Technologies Used

- **Electron** - Cross-platform desktop app framework
- **HTML5** - Structure
- **CSS3** - Styling with modern features (backdrop-filter, gradients)
- **JavaScript** - Interactivity

## Window Configuration

The app is configured to run at exactly 800x600 pixels as requested. The window includes:
- Fixed dimensions
- Modern styling with glassmorphism effects
- Responsive design within the constraints
- Smooth animations

## Building for Distribution

To build the app for distribution:

```bash
npm run build
```

## License

ISC 