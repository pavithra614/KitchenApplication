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
          SELECT ci.*, i.name, ci.unit, c.name as category_name
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
        const {
          collection_id,
          item_id,
          quantity,
          price,
          unit,
          standard_unit,
          standard_unit_price
        } = item;

        // Calculate the unit price
        const calculatedUnitPrice = standard_unit_price || (price / quantity);

        // Begin a transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Insert the collection item
          const insertQuery = `
            INSERT INTO collection_items (collection_id, item_id, quantity, price, unit)
            VALUES (?, ?, ?, ?, ?)
          `;

          db.run(insertQuery, [collection_id, item_id, quantity, price, unit], function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error adding collection item:', err);
              reject(err);
              return;
            }

            const collectionItemId = this.lastID;

            console.log(`Recording price history for item ${item_id}: price=${price}, quantity=${quantity}, unitPrice=${calculatedUnitPrice}, collection_id=${collection_id}`);

            // First check if the price_history table exists
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'", (err, table) => {
              if (err) {
                db.run('ROLLBACK');
                console.error('Error checking if price_history table exists:', err);
                reject(err);
                return;
              }

              if (!table) {
                console.error('price_history table does not exist, creating it now');

                // Create the price_history table if it doesn't exist
                db.run(`
                  CREATE TABLE IF NOT EXISTS price_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_id INTEGER NOT NULL,
                    price REAL NOT NULL,
                    quantity REAL NOT NULL,
                    unit_price REAL NOT NULL,
                    unit TEXT,
                    collection_id INTEGER,
                    standard_unit TEXT,
                    standard_unit_price REAL,
                    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_id) REFERENCES inventory_items (id),
                    FOREIGN KEY (collection_id) REFERENCES collections (id)
                  )
                `, (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    console.error('Error creating price_history table:', err);
                    reject(err);
                    return;
                  }

                  recordPriceAndUpdateInventory();
                });
              } else {
                // Table exists, proceed with insertion
                recordPriceAndUpdateInventory();
              }
            });

            // Function to record price history and update inventory
            function recordPriceAndUpdateInventory() {
              const insertPriceHistoryQuery = `
                INSERT INTO price_history (
                  item_id, price, quantity, unit_price, collection_id, unit,
                  standard_unit, standard_unit_price
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `;

              db.run(insertPriceHistoryQuery, [
                item_id, price, quantity, calculatedUnitPrice, collection_id, unit,
                standard_unit || unit, standard_unit_price || calculatedUnitPrice
              ], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Error recording price history:', err);
                  reject(err);
                  return;
                }

                console.log(`Successfully recorded price history for item ${item_id}`);

                // Continue with updating inventory
                // Store the total price as the last_spent_price
                const totalPriceToStore = price;

                // Get the inventory item to check its unit
                db.get('SELECT unit FROM inventory_items WHERE id = ?', [item_id], (err, inventoryItem) => {
                  if (err) {
                    db.run('ROLLBACK');
                    console.error('Error getting inventory item unit:', err);
                    reject(err);
                    return;
                  }

                  // Convert quantity to the inventory unit if needed
                  let quantityToAdd = quantity;

                  if (inventoryItem && inventoryItem.unit && unit && inventoryItem.unit !== unit) {
                    // Handle weight unit conversions
                    if ((inventoryItem.unit === 'kg' && unit === 'g') ||
                        (inventoryItem.unit === 'kg' && unit === 'mg')) {
                      // Convert g to kg
                      if (unit === 'g') {
                        quantityToAdd = quantity / 1000;
                        console.log(`Converting ${quantity} g to ${quantityToAdd} kg for inventory update`);
                      }
                      // Convert mg to kg
                      else if (unit === 'mg') {
                        quantityToAdd = quantity / 1000000;
                        console.log(`Converting ${quantity} mg to ${quantityToAdd} kg for inventory update`);
                      }
                    }
                    // Handle g to mg and mg to g conversions
                    else if ((inventoryItem.unit === 'g' && unit === 'mg') ||
                             (inventoryItem.unit === 'mg' && unit === 'g')) {
                      if (inventoryItem.unit === 'g' && unit === 'mg') {
                        quantityToAdd = quantity / 1000;
                        console.log(`Converting ${quantity} mg to ${quantityToAdd} g for inventory update`);
                      } else {
                        quantityToAdd = quantity * 1000;
                        console.log(`Converting ${quantity} g to ${quantityToAdd} mg for inventory update`);
                      }
                    }
                    // Handle volume unit conversions
                    else if ((inventoryItem.unit === 'l' && unit === 'ml') ||
                             (inventoryItem.unit === 'ml' && unit === 'l')) {
                      if (inventoryItem.unit === 'l' && unit === 'ml') {
                        quantityToAdd = quantity / 1000;
                        console.log(`Converting ${quantity} ml to ${quantityToAdd} l for inventory update`);
                      } else {
                        quantityToAdd = quantity * 1000;
                        console.log(`Converting ${quantity} l to ${quantityToAdd} ml for inventory update`);
                      }
                    }
                  }

                  // Only update the quantity and last_spent_price, NOT the last_price
                  // The last_price should only be updated manually by the user
                  const updateInventoryQuery = `
                    UPDATE inventory_items
                    SET quantity = quantity + ?,
                        last_spent_price = ?,
                        is_empty = 0,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = ?
                  `;

                  db.run(updateInventoryQuery, [quantityToAdd, totalPriceToStore, item_id], (err) => {
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
            }
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
  },

  /**
   * Get price history for an item
   * @param {Number} itemId - Item ID
   * @returns {Promise<Array>} - Promise resolving to list of price history entries
   */
  getItemPriceHistory: async (itemId) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!itemId) {
          console.error('Invalid item ID provided to getItemPriceHistory:', itemId);
          resolve([]);
          return;
        }

        console.log('Getting price history for item ID:', itemId);

        const db = await getDB();

        // First check if the price_history table exists
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'", (err, table) => {
          if (err) {
            console.error('Error checking if price_history table exists:', err);
            reject(err);
            return;
          }

          if (!table) {
            console.error('price_history table does not exist');
            // Return empty array instead of rejecting to avoid crashing the UI
            resolve([]);
            return;
          }

          // Table exists, proceed with query
          const query = `
            SELECT ph.*, c.name as collection_name, c.purchase_date
            FROM price_history ph
            LEFT JOIN collections c ON ph.collection_id = c.id
            WHERE ph.item_id = ?
            ORDER BY ph.recorded_at DESC
          `;

          db.all(query, [itemId], (err, rows) => {
            if (err) {
              console.error(`Error getting price history for item ${itemId}:`, err);
              reject(err);
              return;
            }

            console.log(`Found ${rows ? rows.length : 0} price history records for item ${itemId}`);
            resolve(rows || []);
          });
        });
      } catch (error) {
        console.error('Error in getItemPriceHistory:', error);
        // Return empty array instead of rejecting to avoid crashing the UI
        resolve([]);
      }
    });
  }
};

export default CollectionDAO;