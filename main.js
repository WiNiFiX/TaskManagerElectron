const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// Function to close existing Electron processes
function closeExistingElectronProcesses() {
    if (process.platform === 'darwin') {
        // macOS
        exec('pkill -f "Electron"', (error) => {
            if (error) {
                console.log('No existing Electron processes found or error:', error.message);
            } else {
                console.log('Closed existing Electron processes');
            }
        });
    } else if (process.platform === 'win32') {
        // Windows
        exec('taskkill /f /im electron.exe', (error) => {
            if (error) {
                console.log('No existing Electron processes found or error:', error.message);
            } else {
                console.log('Closed existing Electron processes');
            }
        });
    } else {
        // Linux
        exec('pkill -f "electron"', (error) => {
            if (error) {
                console.log('No existing Electron processes found or error:', error.message);
            } else {
                console.log('Closed existing Electron processes');
            }
        });
    }
}

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window with 800x600 dimensions
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Optional: add an icon
    show: false // Don't show until ready
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Add keyboard shortcut for Developer Tools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Close existing Electron processes first
  closeExistingElectronProcesses();
  
  // Wait a moment for processes to close, then create window
  setTimeout(() => {
    createWindow();
  }, 500);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 