import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Import database modules
import { initializeDB, closeDB } from './database/db-manager'
import registerInventoryHandlers from './ipc/inventory-handlers'
import registerCollectionHandlers from './ipc/collection-handlers'
import registerCategoryHandlers from './ipc/category-handlers'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Remove always on top for production use
  if (is.dev) {
    mainWindow.setAlwaysOnTop(true, "screen");
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.malistock')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize the database and register IPC handlers
  initializeDB()
    .then(() => {
      // Register IPC handlers
      registerInventoryHandlers()
      registerCollectionHandlers()
      registerCategoryHandlers()

      console.log('Database and IPC handlers initialized successfully')
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error)
      // Continue with the application even if database initialization fails
      // This allows the user to see the UI and potentially fix the issue

      // Register IPC handlers anyway to avoid undefined errors
      registerInventoryHandlers()
      registerCollectionHandlers()
      registerCategoryHandlers()
    })

  // Create the main window
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Close database connection when app is about to quit
app.on('will-quit', (e) => {
  // Prevent the app from quitting immediately
  e.preventDefault()

  // Close the database connection
  closeDB()
    .then(() => {
      console.log('Database connection closed successfully')
      // Now we can quit the app
      app.exit(0)
    })
    .catch((error) => {
      console.error('Error closing database connection:', error)
      // Quit the app anyway
      app.exit(1)
    })
})

