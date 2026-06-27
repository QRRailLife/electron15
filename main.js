const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
const isDev = process.argv.includes('--dev');

app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    console.log('✅ Window ready to show - displaying content');
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load page:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (level, message) => {
    console.log(`[Renderer] ${message}`);
  });

  // iPhone/PWA conversion mode: load the app directly from files.
  // This removes the old localhost:3000 dependency and prevents ECONNREFUSED.
  const indexPath = path.join(__dirname, 'src', 'index.html');
  console.log('📄 Window created, loading local file:', indexPath);
  mainWindow.loadFile(indexPath);

  if (isDev) {
    mainWindow.webContents.openDevTools();
    console.log('🔧 Dev tools opened (dev mode)');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('❌ Window crashed');
  });
}

function registerGlobalShortcuts() {
  console.log('🔑 Attempting to register global shortcuts...');
  try {
    const keyFormats = {
      '3': ['3', 'num3', 'NumPad3'],
      '4': ['4', 'num4', 'NumPad4'],
      '6': ['6', 'num6', 'NumPad6'],
      '7': ['7', 'num7', 'NumPad7']
    };
    for (const [keyChar, formats] of Object.entries(keyFormats)) {
      for (const format of formats) {
        try {
          const result = globalShortcut.register(format, () => {
            console.log(`🎯 [SHORTCUT] Key ${keyChar} pressed - sending to renderer`);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('global-key', keyChar);
            }
          });
          if (result) break;
        } catch (err) {}
      }
    }
  } catch (err) {
    console.error('❌ Error registering global shortcuts:', err);
  }
}

app.whenReady().then(() => {
  createWindow();
  if (mainWindow) setTimeout(registerGlobalShortcuts, 500);
  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });
}).catch(err => {
  console.error('Fatal error during app startup:', err);
  app.quit();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.on('app-info', (event) => {
  event.reply('app-info-reply', {
    version: app.getVersion(),
    platform: process.platform,
    isDev
  });
});
