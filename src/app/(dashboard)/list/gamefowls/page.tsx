import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import GamefowlListClient from "./GamefowlListClient";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Gamefowl, Prisma, GamefowlSex } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Prevent caching with metadata export
export const metadata = {
  cache: 'no-store',
};

const GamefowlListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const {
    page,
    showArchived = "false",
    age,
    sex,
    ...queryParams
  } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Sorting
  const sortBy = searchParams.sortBy === 'id' ? 'id' : 'name';
  const sortDirection = searchParams.sortDirection === 'desc' ? 'desc' : 'asc';

  // Cache control is handled by the metadata export above
  
  // URL PARAMS CONDITION
  const query = {
    isArchived: showArchived === "true",
  } as Prisma.GamefowlWhereInput;

  // Handle age filter
  if (age) {
    const ageValues = age.split(",");
    if (ageValues.length > 0 && !ageValues.includes("all")) {
      query.age = {
        in: ageValues as any[], // Type assertion needed due to Prisma enum
      };
    }
  }

  // Handle sex filter
  if (sex) {
    const sexValues = sex.split(",");
    if (sexValues.length > 0 && !sexValues.includes("all")) {
      query.sex = {
        in: sexValues as GamefowlSex[], // Type assertion for sex enum
      };
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "eventId":
            query.conditioning = {
              some: {
                conditioning: {
                  eventId: parseInt(value),
                },
              },
            };
            break;
          case "search":
            // Check if the search value is a number (potential ID)
            const searchValue = value.trim();
            const isNumber = !isNaN(Number(searchValue));

            if (isNumber) {
              // If it's a number, search by ID
              query.id = parseInt(searchValue);
            } else {
              // If it's not a number, search by name
              query.name = { contains: searchValue, mode: "insensitive" };
            }
            break;
        }
      }
    }
  }

  try {
    const [data, count] = await prisma.$transaction([
    prisma.gamefowl.findMany({
      where: query,
      include: {
        conditioning: true,
        sire: {
          select: {
            id: true,
            name: true,
          },
        },
        dam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortDirection,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.gamefowl.count({ where: query }),
  ]);

    const user = await currentUser();
    const userRole = user?.publicMetadata?.role as string;

    return (
    <GamefowlListClient
      data={data}
      searchParams={{ ...searchParams, count: count.toString() }}
      userRole={userRole}
    />
    );
  } catch (error) {
    console.error('Error fetching gamefowls data:', error);
    throw new Error('Failed to fetch gamefowls data');
  }
};

export default GamefowlListPage;
