import {
  Event,
  EventGamefowl,
  Gamefowl,
  ConditioningStatus,
} from "@prisma/client";

export type EventWithRelations = Omit<Event, "eventDate"> & {
  eventDate: string;
  gamefowl: (EventGamefowl & {
    gamefowl: Gamefowl;
  })[];
  conditioning: {
    id: number;
    status: ConditioningStatus;
  }[];
};
