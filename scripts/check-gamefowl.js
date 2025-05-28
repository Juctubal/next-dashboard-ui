// Script to check existing gamefowl
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all gamefowl records
    const gamefowl = await prisma.gamefowl.findMany({
      select: {
        id: true,
        name: true,
        bloodline: true,
        sex: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log('Gamefowl records:');
    console.table(gamefowl);
    
    // Count vaccines
    const vaccineCount = await prisma.vaccine.count();
    console.log(`Total vaccines in database: ${vaccineCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
