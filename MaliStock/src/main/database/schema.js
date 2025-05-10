/**
 * Initialize the database schema
 * @param {Object} db - The database instance
 * @returns {Promise} - A promise that resolves when the schema is initialized
 */
const initializeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    // Run all schema creation statements in a transaction
    db.serialize(() => {
      // Create categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating categories table:', err);
          reject(err);
          return;
        }
      });

      // Create inventory items table
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER,
          quantity REAL DEFAULT 0,
          unit TEXT,
          last_price REAL,
          last_spent_price REAL,
          is_empty BOOLEAN DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating inventory_items table:', err);
          reject(err);
          return;
        }

        // Check if the last_spent_price column exists, add it if it doesn't
        db.all("PRAGMA table_info(inventory_items)", (err, rows) => {
          if (err) {
            console.error('Error checking inventory_items table schema:', err);
            // Don't reject, just log the error
          } else {
            console.log('Inventory items table columns:', rows);

            // Make sure rows is an array
            if (!Array.isArray(rows)) {
              console.error('Expected rows to be an array, but got:', typeof rows);
              rows = []; // Set to empty array to avoid further errors
            }

            // Check if last_spent_price column exists
            const hasLastSpentPriceColumn = rows.some(row => row.name === 'last_spent_price');
            if (!hasLastSpentPriceColumn) {
              console.log('Adding last_spent_price column to inventory_items table');
              db.run("ALTER TABLE inventory_items ADD COLUMN last_spent_price REAL", (err) => {
                if (err) {
                  console.error('Error adding last_spent_price column to inventory_items table:', err);
                  // Don't reject, just log the error
                } else {
                  console.log('last_spent_price column added to inventory_items table');
                }
              });
            }
          }
        });
      });

      // Create collections table (for grocery purchases)
      db.run(`
        CREATE TABLE IF NOT EXISTS collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_amount REAL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating collections table:', err);
          reject(err);
          return;
        }
      });

      // Create collection items table
      db.run(`
        CREATE TABLE IF NOT EXISTS collection_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          collection_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          price REAL NOT NULL,
          unit TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (collection_id) REFERENCES collections (id),
          FOREIGN KEY (item_id) REFERENCES inventory_items (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating collection_items table:', err);
          reject(err);
          return;
        }

        // Check if the unit column exists, add it if it doesn't
        db.all("PRAGMA table_info(collection_items)", (err, rows) => {
          if (err) {
            console.error('Error checking collection_items table schema:', err);
            // Don't reject, just log the error
          } else {
            console.log('Collection items table columns:', rows);

            // Make sure rows is an array
            if (!Array.isArray(rows)) {
              console.error('Expected rows to be an array, but got:', typeof rows);
              rows = []; // Set to empty array to avoid further errors
            }

            // Check if unit column exists
            const hasUnitColumn = rows.some(row => row.name === 'unit');
            if (!hasUnitColumn) {
              console.log('Adding unit column to collection_items table');
              db.run("ALTER TABLE collection_items ADD COLUMN unit TEXT", (err) => {
                if (err) {
                  console.error('Error adding unit column to collection_items table:', err);
                  // Don't reject, just log the error
                } else {
                  console.log('Unit column added to collection_items table');
                }
              });
            }
          }
        });
      });

      // Create price history table to track price changes over time
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
          console.error('Error creating price_history table:', err);
          reject(err);
          return;
        }

        console.log('price_history table created or already exists');

        // Verify the table was created
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'", (err, table) => {
          if (err) {
            console.error('Error verifying price_history table creation:', err);
            // Don't reject here, just log the error
          } else if (!table) {
            console.error('price_history table was not created properly');
            // Don't reject here, just log the error
          } else {
            console.log('price_history table verified');

            // Check if the required columns exist, add them if they don't
            db.all("PRAGMA table_info(price_history)", (err, rows) => {
              if (err) {
                console.error('Error checking price_history table schema:', err);
                // Don't reject, just log the error
              } else {
                console.log('Price history table columns:', rows);

                // Make sure rows is an array
                if (!Array.isArray(rows)) {
                  console.error('Expected rows to be an array, but got:', typeof rows);
                  rows = []; // Set to empty array to avoid further errors
                }

                // Check if unit column exists
                const hasUnitColumn = rows.some(row => row.name === 'unit');
                if (!hasUnitColumn) {
                  console.log('Adding unit column to price_history table');
                  db.run("ALTER TABLE price_history ADD COLUMN unit TEXT", (err) => {
                    if (err) {
                      console.error('Error adding unit column to price_history table:', err);
                      // Don't reject, just log the error
                    } else {
                      console.log('Unit column added to price_history table');
                    }
                  });
                }

                // Check if standard_unit column exists
                const hasStandardUnitColumn = rows.some(row => row.name === 'standard_unit');
                if (!hasStandardUnitColumn) {
                  console.log('Adding standard_unit column to price_history table');
                  db.run("ALTER TABLE price_history ADD COLUMN standard_unit TEXT", (err) => {
                    if (err) {
                      console.error('Error adding standard_unit column to price_history table:', err);
                      // Don't reject, just log the error
                    } else {
                      console.log('standard_unit column added to price_history table');
                    }
                  });
                }

                // Check if standard_unit_price column exists
                const hasStandardUnitPriceColumn = rows.some(row => row.name === 'standard_unit_price');
                if (!hasStandardUnitPriceColumn) {
                  console.log('Adding standard_unit_price column to price_history table');
                  db.run("ALTER TABLE price_history ADD COLUMN standard_unit_price REAL", (err) => {
                    if (err) {
                      console.error('Error adding standard_unit_price column to price_history table:', err);
                      // Don't reject, just log the error
                    } else {
                      console.log('standard_unit_price column added to price_history table');
                    }
                  });
                }
              }
            });
          }
        });
      });

      // Insert default categories if they don't exist
      const defaultCategories = [
        'Spices',
        'Grains',
        'Pulses',
        'Oils',
        'Dairy',
        'Vegetables',
        'Fruits',
        'Snacks',
        'Beverages',
        'Cleaning Supplies',
        'Others'
      ];

      // Prepare the insert statement
      const stmt = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)', (err) => {
        if (err) {
          console.error('Error preparing statement:', err);
          reject(err);
          return;
        }
      });

      // Insert default categories
      defaultCategories.forEach((category) => {
        stmt.run(category, (err) => {
          if (err) {
            console.error(`Error inserting category ${category}:`, err);
          }
        });
      });

      // Finalize the statement
      stmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing statement:', err);
          reject(err);
          return;
        }

        // Resolve the promise when all operations are complete
        resolve();
      });
    });
  });
};

export { initializeDatabase };
