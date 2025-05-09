import { ipcMain } from 'electron';
import CollectionDAO from '../database/collection-dao';

/**
 * Register IPC handlers for collection operations
 */
const registerCollectionHandlers = () => {
  // Get all collections
  ipcMain.handle('collections:getAll', async () => {
    try {
      return await CollectionDAO.getAllCollections();
    } catch (error) {
      console.error('Error getting collections:', error);
      throw error;
    }
  });

  // Get collection by ID
  ipcMain.handle('collections:getById', async (_, id) => {
    try {
      return await CollectionDAO.getCollectionById(id);
    } catch (error) {
      console.error(`Error getting collection ${id}:`, error);
      throw error;
    }
  });

  // Get collection items
  ipcMain.handle('collections:getItems', async (_, collectionId) => {
    try {
      return await CollectionDAO.getCollectionItems(collectionId);
    } catch (error) {
      console.error(`Error getting items for collection ${collectionId}:`, error);
      throw error;
    }
  });

  // Add new collection
  ipcMain.handle('collections:add', async (_, collection) => {
    try {
      return await CollectionDAO.addCollection(collection);
    } catch (error) {
      console.error('Error adding collection:', error);
      throw error;
    }
  });

  // Add item to collection
  ipcMain.handle('collections:addItem', async (_, item) => {
    try {
      return await CollectionDAO.addCollectionItem(item);
    } catch (error) {
      console.error('Error adding item to collection:', error);
      throw error;
    }
  });

  // Update collection
  ipcMain.handle('collections:update', async (_, { id, updates }) => {
    try {
      return await CollectionDAO.updateCollection(id, updates);
    } catch (error) {
      console.error(`Error updating collection ${id}:`, error);
      throw error;
    }
  });

  // Delete collection
  ipcMain.handle('collections:delete', async (_, id) => {
    try {
      return await CollectionDAO.deleteCollection(id);
    } catch (error) {
      console.error(`Error deleting collection ${id}:`, error);
      throw error;
    }
  });
};

export default registerCollectionHandlers;
