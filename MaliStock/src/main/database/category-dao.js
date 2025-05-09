import { getDB } from './db-manager';

/**
 * Data Access Object for category operations
 */
const CategoryDAO = {
  /**
   * Get all categories
   * @returns {Promise<Array>} - Promise resolving to list of categories
   */
  getAllCategories: async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = `
          SELECT c.*, COUNT(i.id) as item_count
          FROM categories c
          LEFT JOIN inventory_items i ON c.id = i.category_id
          GROUP BY c.id
          ORDER BY c.name ASC
        `;

        db.all(query, [], (err, rows) => {
          if (err) {
            console.error('Error getting categories:', err);
            reject(err);
            return;
          }
          resolve(rows);
        });
      } catch (error) {
        console.error('Error in getAllCategories:', error);
        reject(error);
      }
    });
  },

  /**
   * Get a category by ID
   * @param {Number} id - Category ID
   * @returns {Promise<Object>} - Promise resolving to category data
   */
  getCategoryById: async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = `
          SELECT c.*, COUNT(i.id) as item_count
          FROM categories c
          LEFT JOIN inventory_items i ON c.id = i.category_id
          WHERE c.id = ?
          GROUP BY c.id
        `;

        db.get(query, [id], (err, row) => {
          if (err) {
            console.error(`Error getting category ${id}:`, err);
            reject(err);
            return;
          }
          resolve(row);
        });
      } catch (error) {
        console.error('Error in getCategoryById:', error);
        reject(error);
      }
    });
  },

  /**
   * Add a new category
   * @param {String} name - Category name
   * @returns {Promise<Number>} - Promise resolving to ID of the new category
   */
  addCategory: async (name) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = 'INSERT INTO categories (name) VALUES (?)';

        db.run(query, [name], function(err) {
          if (err) {
            console.error('Error adding category:', err);
            reject(err);
            return;
          }
          resolve(this.lastID);
        });
      } catch (error) {
        console.error('Error in addCategory:', error);
        reject(error);
      }
    });
  },

  /**
   * Update a category
   * @param {Number} id - Category ID
   * @param {String} name - New category name
   * @returns {Promise<Boolean>} - Promise resolving to success status
   */
  updateCategory: async (id, name) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = 'UPDATE categories SET name = ? WHERE id = ?';

        db.run(query, [name, id], function(err) {
          if (err) {
            console.error(`Error updating category ${id}:`, err);
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        });
      } catch (error) {
        console.error('Error in updateCategory:', error);
        reject(error);
      }
    });
  },

  /**
   * Delete a category
   * @param {Number} id - Category ID
   * @returns {Promise<Boolean>} - Promise resolving to success status
   */
  deleteCategory: async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();

        // Check if category is in use
        const checkQuery = 'SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?';

        db.get(checkQuery, [id], (err, row) => {
          if (err) {
            console.error(`Error checking if category ${id} is in use:`, err);
            reject(err);
            return;
          }

          if (row.count > 0) {
            // Category is in use, cannot delete
            resolve(false);
            return;
          }

          // Category is not in use, proceed with deletion
          const deleteQuery = 'DELETE FROM categories WHERE id = ?';

          db.run(deleteQuery, [id], function(err) {
            if (err) {
              console.error(`Error deleting category ${id}:`, err);
              reject(err);
              return;
            }
            resolve(this.changes > 0);
          });
        });
      } catch (error) {
        console.error('Error in deleteCategory:', error);
        reject(error);
      }
    });
  }
};

export default CategoryDAO;
