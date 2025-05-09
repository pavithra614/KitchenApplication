import { ipcMain } from 'electron';
import InventoryDAO from '../database/inventory-dao';

/**
 * Register IPC handlers for inventory operations
 */
const registerInventoryHandlers = () => {
  // Get all inventory items
  ipcMain.handle('inventory:getAll', async (_, filters) => {
    try {
      return await InventoryDAO.getAllItems(filters);
    } catch (error) {
      console.error('Error getting inventory items:', error);
      throw error;
    }
  });

  // Get inventory item by ID
  ipcMain.handle('inventory:getById', async (_, id) => {
    try {
      return await InventoryDAO.getItemById(id);
    } catch (error) {
      console.error(`Error getting inventory item ${id}:`, error);
      throw error;
    }
  });

  // Add new inventory item
  ipcMain.handle('inventory:add', async (_, item) => {
    try {
      return await InventoryDAO.addItem(item);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  });

  // Update inventory item
  ipcMain.handle('inventory:update', async (_, { id, updates }) => {
    try {
      return await InventoryDAO.updateItem(id, updates);
    } catch (error) {
      console.error(`Error updating inventory item ${id}:`, error);
      throw error;
    }
  });

  // Mark inventory item as empty
  ipcMain.handle('inventory:markAsEmpty', async (_, id) => {
    try {
      return await InventoryDAO.markAsEmpty(id);
    } catch (error) {
      console.error(`Error marking inventory item ${id} as empty:`, error);
      throw error;
    }
  });

  // Delete inventory item
  ipcMain.handle('inventory:delete', async (_, id) => {
    try {
      return await InventoryDAO.deleteItem(id);
    } catch (error) {
      console.error(`Error deleting inventory item ${id}:`, error);
      throw error;
    }
  });
};

export default registerInventoryHandlers;
