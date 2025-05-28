// Script to execute SQL file using Prisma
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    const sqlFilePath = process.argv[2];
    
    if (!sqlFilePath) {
      console.error('Please provide a path to an SQL file as an argument');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(path.resolve(sqlFilePath), 'utf8');
    
    // Split SQL by semicolons to execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`Successfully executed statement ${i + 1}/${statements.length}`);
      } catch (err) {
        console.error(`Error executing statement ${i + 1}: ${err.message}`);
        console.error(`Statement: ${statement}`);
      }
    }
    
    console.log('SQL execution completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
