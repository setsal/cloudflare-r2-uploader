import { app, shell, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc-handlers'
import { getConfig, getWindowBounds, setWindowBounds } from './config-store'

/** Resolve the app icon path (works in both dev and production) */
function getIconPath(): string {
  if (is.dev) {
    return join(__dirname, '../../build/icons/256x256.png')
  }
  return join(process.resourcesPath, 'icon.png')
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  const config = getConfig()
  const isDark = config.theme !== 'light'
  const savedBounds = getWindowBounds()

  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 600,
    minHeight: 500,
    show: false,
    icon: getIconPath(),
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

  // Save window bounds on resize/move (debounced)
  let boundsTimer: NodeJS.Timeout | null = null
  const saveBounds = () => {
    if (boundsTimer) clearTimeout(boundsTimer)
    boundsTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isMinimized() && !mainWindow.isMaximized()) {
        const bounds = mainWindow.getBounds()
        setWindowBounds(bounds)
      }
    }, 500)
  }
  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    const config = getConfig()
    if (config.minimizeToTray && mainWindow && !isQuitting) {
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
  const trayIcon = nativeImage.createFromPath(getIconPath()).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Cloudflare R2 Image Uploader',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Cloudflare R2 Image Uploader')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// Flag for quitting
let isQuitting = false

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
  isQuitting = true
})
