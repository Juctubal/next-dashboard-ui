import { calculateGamefowlAge } from "./utils";
import { prisma } from "./prisma";

/**
 * Updates the age field for all gamefowls based on their date_hatched
 * This function can be called by a cron job or scheduled task
 */
export async function updateGamefowlAges() {
  try {
    console.log("Starting gamefowl age update...");

    // Get all gamefowls with a date_hatched
    const gamefowls = await prisma.gamefowl.findMany({
      where: {
        date_hatched: {
          not: null,
        },
      },
    });

    console.log(`Found ${gamefowls.length} gamefowls to check for age updates`);

    // Update each gamefowl's age based on date_hatched
    const updatePromises = gamefowls.map(async (gamefowl) => {
      const calculatedAge = calculateGamefowlAge(
        gamefowl.date_hatched,
        gamefowl.sex
      );

      // Only update if the age has changed
      if (calculatedAge !== gamefowl.age) {
        return prisma.gamefowl.update({
          where: { id: gamefowl.id },
          data: { age: calculatedAge },
        });
      }
      return null;
    });

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter(Boolean).length;

    console.log(`Updated age for ${updatedCount} gamefowls`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("Error updating gamefowl ages:", error);
    return { success: false, error };
  }
}
