type GamefowlAge = "CHICK" | "STAG" | "BULLSTAG" | "COCK";

export function calculateGamefowlAge(
  date_hatched: Date | null
): GamefowlAge | null {
  if (!date_hatched) return null;

  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date_hatched.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average month length

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
