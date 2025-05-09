import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

// Define the path for the database file
const getUserDataPath = () => {
  const userDataPath = app.getPath('userData');
  const dbPath = join(userDataPath, 'database');
  
  // Create the database directory if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
  
  return dbPath;
};

// Database file path
const dbFilePath = join(getUserDataPath(), 'malapantry.sqlite');

export { dbFilePath };
