const { app, BrowserWindow } = require('electron');
const path = require('path');

// ============================================
// Start the Express Backend Server
// ============================================
// This will run the backend on localhost:3001 in the background
require('./backend/server.js');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Electronica Simulator",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the built frontend React application
  mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  
  // Optional: Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
