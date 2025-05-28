// Script to check database schema using Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Perform a query to get column names from the Vaccine table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'Vaccine'
      ORDER BY ordinal_position
    `;
    
    console.log('Vaccine table columns:');
    console.table(result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
