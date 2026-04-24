import { app, shell, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc-handlers'
import { getConfig } from './config-store'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  const config = getConfig()
  const isDark = config.theme !== 'light'

  mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    minWidth: 600,
    minHeight: 500,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: isDark ? '#0a0a0f' : '#f5f5f7',
      symbolColor: isDark ? '#a0a0b0' : '#5a5a72',
      height: 36
    },
    backgroundColor: isDark ? '#0a0a0f' : '#f5f5f7',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    const config = getConfig()
    if (config.minimizeToTray && mainWindow && !app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Dev server in development, static files in production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  // Create a simple tray icon (16x16 colored square)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  // Create a 16x16 icon programmatically
  const iconData = nativeImage.createFromBuffer(
    Buffer.alloc(16 * 16 * 4, 0),
    { width: 16, height: 16 }
  )

  // Use a simple colored tray icon
  tray.setImage(iconData)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show R2 Uploader',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('R2 Uploader')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// Extend App type for isQuitting flag
declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}

app.isQuitting = false

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  createTray()

  // Handle theme changes — update title bar overlay dynamically
  ipcMain.handle('theme:update', (_event, theme: 'light' | 'dark') => {
    if (!mainWindow) return
    const isDark = theme !== 'light'
    mainWindow.setTitleBarOverlay({
      color: isDark ? '#0a0a0f' : '#f5f5f7',
      symbolColor: isDark ? '#a0a0b0' : '#5a5a72',
      height: 36
    })
    mainWindow.setBackgroundColor(isDark ? '#0a0a0f' : '#f5f5f7')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
})
