import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Inventory operations
  inventory: {
    getAll: (filters) => ipcRenderer.invoke('inventory:getAll', filters),
    getById: (id) => ipcRenderer.invoke('inventory:getById', id),
    add: (item) => ipcRenderer.invoke('inventory:add', item),
    update: (id, updates) => ipcRenderer.invoke('inventory:update', { id, updates }),
    markAsEmpty: (id) => ipcRenderer.invoke('inventory:markAsEmpty', id),
    delete: (id) => ipcRenderer.invoke('inventory:delete', id)
  },

  // Collection operations
  collections: {
    getAll: () => ipcRenderer.invoke('collections:getAll'),
    getById: (id) => ipcRenderer.invoke('collections:getById', id),
    getItems: (collectionId) => ipcRenderer.invoke('collections:getItems', collectionId),
    add: (collection) => ipcRenderer.invoke('collections:add', collection),
    addItem: (item) => ipcRenderer.invoke('collections:addItem', item),
    update: (id, updates) => ipcRenderer.invoke('collections:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('collections:delete', id),
    getItemPriceHistory: (itemId) => ipcRenderer.invoke('collections:getItemPriceHistory', itemId)
  },

  // Category operations
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    getById: (id) => ipcRenderer.invoke('categories:getById', id),
    add: (name) => ipcRenderer.invoke('categories:add', name),
    update: (id, name) => ipcRenderer.invoke('categories:update', { id, name }),
    delete: (id) => ipcRenderer.invoke('categories:delete', id)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
