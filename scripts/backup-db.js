const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, "..", "backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

// Generate timestamp for the backup file
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFileName = `backup_${timestamp}.sql`;
const backupPath = path.join(backupsDir, backupFileName);

// Get database URL from environment
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create the backup command using psql
const command = `psql "${dbUrl}" -c "\\copy (SELECT * FROM pg_dump()) TO '${backupPath}'"`;

console.log("Starting database backup...");

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating backup: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Backup stderr: ${stderr}`);
    return;
  }
  console.log(`Backup completed successfully!`);
  console.log(`Backup file location: ${backupPath}`);
});
