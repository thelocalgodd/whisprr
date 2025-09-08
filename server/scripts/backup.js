import dotenv from "dotenv";
dotenv.config();

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/whisprr";
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Extract database name from URI
const dbName = MONGODB_URI.split('/').pop().split('?')[0];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `${dbName}-${timestamp}`);

async function createBackup() {
  console.log('📦 Starting database backup...');
  
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Run mongodump command
    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error);
        return;
      }
      
      if (stderr) {
        console.warn('⚠️ Backup warnings:', stderr);
      }
      
      console.log('✅ Backup completed successfully!');
      console.log(`📁 Backup location: ${backupPath}`);
      console.log(stdout);
    });
    
  } catch (error) {
    console.error('❌ Backup error:', error);
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup();
}

export default createBackup;