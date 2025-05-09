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
