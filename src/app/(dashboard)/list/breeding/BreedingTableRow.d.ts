import { Breeding, Gamefowl } from "@prisma/client";

type BreedingWithRelations = Breeding & {
  sire: Gamefowl;
  dam: Gamefowl;
  startDate: Date;
  endDate: Date | null;
};

declare const BreedingTableRow: React.FC<{ item: BreedingWithRelations }>;
export default BreedingTableRow;
