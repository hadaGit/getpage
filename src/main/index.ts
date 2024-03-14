import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  utilityProcess,
  Tray,
  Menu,
  nativeImage
} from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import server from './server';

import whistleserver from './whistleserver?modulePath';
import './ipcMainHandle';
import { loadAllPlugs } from './plugsLoad';
import { setMainWin } from './globleWin';
import { getPort } from './server/portUtils';
import { enableProxy, stopProxy } from './proxy';

let mainWindow: BrowserWindow;
let tray: Tray;

const getTheLock = app.requestSingleInstanceLock();

if (!getTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('兔子抓取');

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    // IPC test
    ipcMain.on('ping', () => console.log('pong'));

    createWindow();
    startServer();
    loadAllPlugs();

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });
  setMainWin(mainWindow);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // const stopServer = whistleserver();

  // mainWindow.on('close',()=>{
  //   stopServer();
  // })
  const iconTray = nativeImage.createFromPath(icon);
  tray = new Tray(iconTray);
  const win = mainWindow;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: function () {
        win.destroy();
        app.quit();
      }
    }
  ]);
  tray.setToolTip('通用页面提取器');
  tray.setContextMenu(contextMenu);
  // 点击托盘图标，显示主窗口
  tray.on('click', () => {
    win.show();
    if (win.isMinimized()) {
      win.restore();
    }
  });
  //双击打开应用
  tray.on('double-click', () => {
    win.show();
    if (win.isMinimized()) {
      win.restore();
    }
  });
  //实现点击关闭按钮 让应用保存在托盘里面，双击托盘打开应用
  win.on('close', (e) => {
    console.log('close--------');
    e.preventDefault();
    win.hide();
  });
}

async function startServer() {
  const serverPort = await server();

  const w2Port = await getPort();
  const child = utilityProcess.fork(whistleserver, [String(serverPort), String(w2Port)], {
    stdio: 'inherit'
  });
  app.on('before-quit', () => {
    // child.postMessage({ message: 'close' });
    stopProxy();
  });
  child.postMessage({ message: 'ca' });
  setTimeout(()=>{
    enableProxy({ port: w2Port });
  },1000);
  // ipcMain.handle('installCA', () => {
  //   child.postMessage({ message: 'ca' })
  // })
  // ipcMain.handle('setProxy', () => {
  //   child.postMessage({ message: 'proxy' })
  // })
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
