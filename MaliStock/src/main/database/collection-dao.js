import { getDB } from './db-manager';

/**
 * Data Access Object for collection operations
 */
const CollectionDAO = {
  /**
   * Get all collections
   * @returns {Promise<Array>} - Promise resolving to list of collections
   */
  getAllCollections: async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = `
          SELECT c.*,
                 COUNT(ci.id) as item_count,
                 SUM(ci.price) as actual_total
          FROM collections c
          LEFT JOIN collection_items ci ON c.id = ci.collection_id
          GROUP BY c.id
          ORDER BY c.purchase_date DESC
        `;

        db.all(query, [], (err, rows) => {
          if (err) {
            console.error('Error getting collections:', err);
            reject(err);
            return;
          }
          resolve(rows);
        });
      } catch (error) {
        console.error('Error in getAllCollections:', error);
        reject(error);
      }
    });
  },

  /**
   * Get a collection by ID
   * @param {Number} id - Collection ID
   * @returns {Promise<Object>} - Promise resolving to collection data
   */
  getCollectionById: async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = `
          SELECT c.*,
                 COUNT(ci.id) as item_count,
                 SUM(ci.price) as actual_total
          FROM collections c
          LEFT JOIN collection_items ci ON c.id = ci.collection_id
          WHERE c.id = ?
          GROUP BY c.id
        `;

        db.get(query, [id], (err, row) => {
          if (err) {
            console.error(`Error getting collection ${id}:`, err);
            reject(err);
            return;
          }
          resolve(row);
        });
      } catch (error) {
        console.error('Error in getCollectionById:', error);
        reject(error);
      }
    });
  },

  /**
   * Get items in a collection
   * @param {Number} collectionId - Collection ID
   * @returns {Promise<Array>} - Promise resolving to list of items in the collection
   */
  getCollectionItems: async (collectionId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const query = `
          SELECT ci.*, i.name, i.unit, c.name as category_name
          FROM collection_items ci
          JOIN inventory_items i ON ci.item_id = i.id
          LEFT JOIN categories c ON i.category_id = c.id
          WHERE ci.collection_id = ?
          ORDER BY i.name ASC
        `;

        db.all(query, [collectionId], (err, rows) => {
          if (err) {
            console.error(`Error getting items for collection ${collectionId}:`, err);
            reject(err);
            return;
          }
          resolve(rows);
        });
      } catch (error) {
        console.error('Error in getCollectionItems:', error);
        reject(error);
      }
    });
  },

  /**
   * Add a new collection
   * @param {Object} collection - Collection data
   * @returns {Promise<Number>} - Promise resolving to ID of the new collection
   */
  addCollection: async (collection) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const { name, purchase_date, total_amount, notes } = collection;

        const date = purchase_date || new Date().toISOString();

        // Begin a transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Insert the collection
          const query = `
            INSERT INTO collections (name, purchase_date, total_amount, notes)
            VALUES (?, ?, ?, ?)
          `;

          db.run(query, [name, date, total_amount || 0, notes], function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error adding collection:', err);
              reject(err);
              return;
            }

            const collectionId = this.lastID;

            // Commit the transaction
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                reject(err);
                return;
              }
              resolve(collectionId);
            });
          });
        });
      } catch (error) {
        console.error('Error in addCollection:', error);
        reject(error);
      }
    });
  },

  /**
   * Add an item to a collection
   * @param {Object} item - Collection item data
   * @returns {Promise<Number>} - Promise resolving to ID of the new collection item
   */
  addCollectionItem: async (item) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const { collection_id, item_id, quantity, price } = item;

        // Begin a transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Insert the collection item
          const insertQuery = `
            INSERT INTO collection_items (collection_id, item_id, quantity, price)
            VALUES (?, ?, ?, ?)
          `;

          db.run(insertQuery, [collection_id, item_id, quantity, price], function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error adding collection item:', err);
              reject(err);
              return;
            }

            const collectionItemId = this.lastID;

            // Update the inventory item quantity and price
            const updateInventoryQuery = `
              UPDATE inventory_items
              SET quantity = quantity + ?,
                  last_price = ?,
                  is_empty = 0,
                  last_updated = CURRENT_TIMESTAMP
              WHERE id = ?
            `;

            db.run(updateInventoryQuery, [quantity, price / quantity, item_id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                console.error('Error updating inventory item:', err);
                reject(err);
                return;
              }

              // Update the collection total
              const updateCollectionQuery = `
                UPDATE collections
                SET total_amount = (
                  SELECT SUM(price) FROM collection_items WHERE collection_id = ?
                )
                WHERE id = ?
              `;

              db.run(updateCollectionQuery, [collection_id, collection_id], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Error updating collection total:', err);
                  reject(err);
                  return;
                }

                // Commit the transaction
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    reject(err);
                    return;
                  }
                  resolve(collectionItemId);
                });
              });
            });
          });
        });
      } catch (error) {
        console.error('Error in addCollectionItem:', error);
        reject(error);
      }
    });
  },

  /**
   * Update a collection
   * @param {Number} id - Collection ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Boolean>} - Promise resolving to success status
   */
  updateCollection: async (id, updates) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();

        const allowedFields = ['name', 'purchase_date', 'total_amount', 'notes'];
        const setStatements = [];
        const params = [];

        // Build SET statements for allowed fields
        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            setStatements.push(`${field} = ?`);
            params.push(updates[field]);
          }
        }

        if (setStatements.length === 0) {
          resolve(false); // Nothing to update
          return;
        }

        // Add ID to params
        params.push(id);

        const query = `
          UPDATE collections
          SET ${setStatements.join(', ')}
          WHERE id = ?
        `;

        db.run(query, params, function(err) {
          if (err) {
            console.error(`Error updating collection ${id}:`, err);
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        });
      } catch (error) {
        console.error('Error in updateCollection:', error);
        reject(error);
      }
    });
  },

  /**
   * Delete a collection
   * @param {Number} id - Collection ID
   * @returns {Promise<Boolean>} - Promise resolving to success status
   */
  deleteCollection: async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();

        // Begin a transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Delete collection items first
          const deleteItemsQuery = 'DELETE FROM collection_items WHERE collection_id = ?';

          db.run(deleteItemsQuery, [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error(`Error deleting collection items for collection ${id}:`, err);
              reject(err);
              return;
            }

            // Delete the collection
            const deleteCollectionQuery = 'DELETE FROM collections WHERE id = ?';

            db.run(deleteCollectionQuery, [id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                console.error(`Error deleting collection ${id}:`, err);
                reject(err);
                return;
              }

              const changes = this.changes;

              // Commit the transaction
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Error committing transaction:', err);
                  reject(err);
                  return;
                }
                resolve(changes > 0);
              });
            });
          });
        });
      } catch (error) {
        console.error('Error in deleteCollection:', error);
        reject(error);
      }
    });
  }
};

export default CollectionDAO;
