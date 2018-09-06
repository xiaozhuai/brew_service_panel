import * as path from 'path';
import {app, BrowserWindow, Tray, ipcMain} from 'electron';
import persistence from '../libs/Persistence';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\');
}

let trayIcon;
let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`;

const windowConfig = persistence.get('window', {
    width: 600,
    height: 300,
    horizontal_margin: 6
});

function createWindow() {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        width: windowConfig.width,
        height: windowConfig.height,
        useContentSize: true,
        resizable: false,
        frame: false,
        transparent: true,
        show: false,
        movable: false,
        alwaysOnTop: true,
        fullscreenable: false,
    });

    mainWindow.loadURL(winURL);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.on('blur', () => {
        if (process.env.NODE_ENV !== 'development') {
            mainWindow.hide();
        }
    });
}

function initTrayIcon() {
    trayIcon = new Tray(path.resolve(__static, 'images', 'tray_icon_Template.png'));

    trayIcon.on('click', (event, bounds) => {
        console.log("tray icon on click");
        // console.log(bounds);
        let x = bounds.x - windowConfig.width / 2 + bounds.width / 2;
        let y = bounds.height + windowConfig.horizontal_margin;
        mainWindow.setPosition(x, y);
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.webContents.send('refresh-list');
        }
    });

    trayIcon.on('right-click', (event, bounds) => {
        console.log("tray icon on right click");
        // console.log(bounds);
    });
}

if (process.platform === 'darwin') {
    app.dock.hide();
}

app.on('ready', () => {
    createWindow();
    initTrayIcon();
});

ipcMain.on('quit-app', () => {
    console.log('ipcMain receive quit-app');
    mainWindow.close();
    app.quit();
});
