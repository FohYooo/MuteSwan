// MUTE SWAN desktop shell: serves the game from app://game/, grants the microphone, F11 fullscreen.
const { app, BrowserWindow, protocol, session, net, Menu, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, 'game');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    backgroundColor: '#0b0a0c',
    title: 'MUTE SWAN',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  // --mute (for test runs) starts the game silent
  win.loadURL(`app://game/index.html${process.argv.includes('--mute') ? '?mute=1' : ''}`);
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); }
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    dialog.showErrorBox('MUTE SWAN', `The game stopped unexpectedly (${details.reason}). Please start it again.`);
  });
  return win;
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(ROOT)) return new Response('forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString()).catch(() => new Response('not found', { status: 404 }));
  });
  // the game only ever asks for the microphone
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(permission === 'media'));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === 'media');
  Menu.setApplicationMenu(null);
  const win = createWindow();
  ipcMain.on('quit', () => app.quit());
  ipcMain.on('fullscreen', () => win.setFullScreen(!win.isFullScreen()));
});

app.on('window-all-closed', () => app.quit());
