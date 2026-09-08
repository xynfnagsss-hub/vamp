import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    // Load the built client from the app's dist folder
    const indexPath = path.join(app.getAppPath(), '..', 'dist', 'client', 'index.html');
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load file:', indexPath, err);
      // fallback to localhost for dev if available
      win.loadURL('http://localhost:3000').catch(() => {});
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
