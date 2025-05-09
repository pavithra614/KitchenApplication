import { ipcMain } from 'electron';
import CategoryDAO from '../database/category-dao';

/**
 * Register IPC handlers for category operations
 */
const registerCategoryHandlers = () => {
  // Get all categories
  ipcMain.handle('categories:getAll', async () => {
    try {
      return await CategoryDAO.getAllCategories();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  });

  // Get category by ID
  ipcMain.handle('categories:getById', async (_, id) => {
    try {
      return await CategoryDAO.getCategoryById(id);
    } catch (error) {
      console.error(`Error getting category ${id}:`, error);
      throw error;
    }
  });

  // Add new category
  ipcMain.handle('categories:add', async (_, name) => {
    try {
      return await CategoryDAO.addCategory(name);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  });

  // Update category
  ipcMain.handle('categories:update', async (_, { id, name }) => {
    try {
      return await CategoryDAO.updateCategory(id, name);
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  });

  // Delete category
  ipcMain.handle('categories:delete', async (_, id) => {
    try {
      return await CategoryDAO.deleteCategory(id);
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  });
};

export default registerCategoryHandlers;
