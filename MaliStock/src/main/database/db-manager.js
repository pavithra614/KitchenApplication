import sqlite3 from 'sqlite3';
import { dbFilePath } from './db-config';
import { initializeDatabase } from './schema';

let db = null;

/**
 * Initialize the database connection
 */
const initializeDB = () => {
  return new Promise((resolve, reject) => {
    try {
      // Enable verbose mode for debugging
      sqlite3.verbose();

      // Create a new database connection
      db = new sqlite3.Database(dbFilePath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }

        // Set pragmas for better performance
        db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;', (err) => {
          if (err) {
            console.error('Error setting pragmas:', err);
            reject(err);
            return;
          }

          // Initialize database schema
          initializeDatabase(db)
            .then(() => {
              console.log('Database initialized successfully');
              resolve(db);
            })
            .catch((err) => {
              console.error('Error initializing database schema:', err);
              reject(err);
            });
        });
      });
    } catch (error) {
      console.error('Database initialization error:', error);
      reject(error);
    }
  });
};

/**
 * Get the database instance
 */
const getDB = async () => {
  if (!db) {
    return await initializeDB();
  }
  return db;
};

/**
 * Close the database connection
 */
const closeDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
          return;
        }
        db = null;
        console.log('Database connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

export { initializeDB, getDB, closeDB };
