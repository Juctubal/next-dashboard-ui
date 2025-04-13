import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type GamefowlAge = "CHICK" | "STAG" | "BULLSTAG" | "COCK" | "PULLET" | "HEN";

export function calculateGamefowlAge(
  date_hatched: Date | null,
  sex: "MALE" | "FEMALE" | null = null
): GamefowlAge | null {
  if (!date_hatched) return null;

  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date_hatched.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average month length

  if (sex === "FEMALE") {
    if (diffMonths <= 2) {
      return "CHICK";
    } else if (diffMonths > 2 && diffMonths <= 12) {
      return "PULLET";
    } else {
      return "HEN";
    }
  } else {
    if (diffMonths <= 3) {
      return "CHICK";
    } else if (diffMonths >= 4 && diffMonths <= 12) {
      return "STAG";
    } else if (diffMonths >= 13 && diffMonths <= 18) {
      return "BULLSTAG";
    } else {
      return "COCK";
    }
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
