const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false  // Allow loading local images
    }
  });
  
  // Maximize window on start
  mainWindow.maximize();

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // Development mode - load from Vite dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.handle('get-app-path', (event, name) => {
  if (name === 'embeddings') {
    // Return path to public/embeddings folder
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'embeddings');
    } else {
      return path.join(__dirname, '../public/embeddings');
    }
  }
  return app.getPath(name);
});

ipcMain.handle('get-public-path', () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'public');
  } else {
    return path.join(__dirname, '../public');
  }
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

