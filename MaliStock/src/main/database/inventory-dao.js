import { getDB } from './db-manager';

/**
 * Data Access Object for inventory operations
 */
const InventoryDAO = {
  /**
   * Get all inventory items
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Promise resolving to list of inventory items
   */
  getAllItems: async (filters = {}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();

        let query = `
          SELECT i.*, c.name as category_name
          FROM inventory_items i
          LEFT JOIN categories c ON i.category_id = c.id
        `;

        const whereConditions = [];
        const params = [];

        // Apply filters if provided
        if (filters.category_id) {
          whereConditions.push('i.category_id = ?');
          params.push(filters.category_id);
        }

        if (filters.is_empty !== undefined) {
          whereConditions.push('i.is_empty = ?');
          params.push(filters.is_empty ? 1 : 0);
        }

        if (filters.name) {
          whereConditions.push('i.name LIKE ?');
          params.push(`%${filters.name}%`);
        }

        if (whereConditions.length > 0) {
          query += ' WHERE ' + whereConditions.join(' AND ');
        }

        // Add ordering
        query += ' ORDER BY i.name ASC';

        db.all(query, params, (err, rows) => {
          if (err) {
            console.error('Error getting inventory items:', err);
            reject(err);
            return;
          }
          resolve(rows);
        });
      } catch (error) {
        console.error('Error in getAllItems:', error);
        reject(error);
      }
    });
  },

  /**
   * Get an inventory item by ID
   * @param {Number} id - Item ID
   * @returns {Promise<Object>} - Promise resolving to inventory item
   */
  getItemById: async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = `
          SELECT i.*, c.name as category_name
          FROM inventory_items i
          LEFT JOIN categories c ON i.category_id = c.id
          WHERE i.id = ?
        `;

        db.get(query, [id], (err, row) => {
          if (err) {
            console.error(`Error getting inventory item ${id}:`, err);
            reject(err);
            return;
          }
          resolve(row);
        });
      } catch (error) {
        console.error('Error in getItemById:', error);
        reject(error);
      }
    });
  },

  /**
   * Add a new inventory item
   * @param {Object} item - Item data
   * @returns {Promise<Number>} - Promise resolving to ID of the new item
   */
  addItem: async (item) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const { name, category_id, quantity, unit, last_price } = item;

        const query = `
          INSERT INTO inventory_items (name, category_id, quantity, unit, last_price)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.run(query, [name, category_id, quantity || 0, unit, last_price], function(err) {
          if (err) {
            console.error('Error adding inventory item:', err);
            reject(err);
            return;
          }
          resolve(this.lastID);
        });
      } catch (error) {
        console.error('Error in addItem:', error);
        reject(error);
      }
    });
  },

  /**
   * Update an inventory item
   * @param {Number} id - Item ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Boolean>} - Promise resolving to success status
   */
  updateItem: async (id, updates) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();

        const allowedFields = ['name', 'category_id', 'quantity', 'unit', 'last_price', 'is_empty'];
        const setStatements = [];
        const params = [];

        // Build SET statements for allowed fields
        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            setStatements.push(`${field} = ?`);
            params.push(updates[field]);
          }
        }

        // Add last_updated timestamp
        setStatements.push('last_updated = CURRENT_TIMESTAMP');

        if (setStatements.length === 0) {
          resolve(false); // Nothing to update
          return;
        }

        // Add ID to params
        params.push(id);

        const query = `
          UPDATE inventory_items
          SET ${setStatements.join(', ')}
          WHERE id = ?
        `;

        db.run(query, params, function(err) {
          if (err) {
            console.error(`Error updating inventory item ${id}:`, err);
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        });
      } catch (error) {
        console.error('Error in updateItem:', error);
        reject(error);
      }
    });
  },

  /**
   * Mark an item as empty
   * @param {Number} id - Item ID
   * @returns {Promise<Boolean>} - Promise resolving to success status
   */
  markAsEmpty: async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = `
          UPDATE inventory_items
          SET is_empty = 1, quantity = 0, last_updated = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        db.run(query, [id], function(err) {
          if (err) {
            console.error(`Error marking inventory item ${id} as empty:`, err);
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        });
      } catch (error) {
        console.error('Error in markAsEmpty:', error);
        reject(error);
      }
    });
  },

  /**
   * Delete an inventory item
   * @param {Number} id - Item ID
   * @returns {Promise<Boolean>} - Promise resolving to success status
   */
  deleteItem: async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = 'DELETE FROM inventory_items WHERE id = ?';

        db.run(query, [id], function(err) {
          if (err) {
            console.error(`Error deleting inventory item ${id}:`, err);
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        });
      } catch (error) {
        console.error('Error in deleteItem:', error);
        reject(error);
      }
    });
  }
};

export default InventoryDAO;
