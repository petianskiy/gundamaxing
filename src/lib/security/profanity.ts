// Blocklist of slurs and offensive terms that cannot appear in usernames or handles.
// Uses substring matching (case-insensitive) so "xNIGGERx" is also caught.

const BLOCKED_TERMS = [
  // Racial slurs
  "nigger", "nigga", "nigg3r", "n1gger", "n1gga", "niqqer", "niqqa",
  "chink", "ch1nk", "gook", "g00k", "spic", "sp1c", "wetback",
  "kike", "k1ke", "beaner", "coon", "c00n", "darkie", "jigaboo",
  "raghead", "towelhead", "zipperhead", "paki", "pak1",
  "redskin", "injun", "halfbreed",
  // Homophobic slurs
  "faggot", "fag", "f4g", "f4ggot", "fagg0t", "dyke", "dyk3",
  "tranny", "tr4nny",
  // Other slurs
  "retard", "r3tard", "ret4rd",
  // Nazi/hate symbols
  "nazi", "n4zi", "hitler", "h1tler", "heil", "sieg",
  "1488", "14words", "whitepower",
  // Sexual
  "pedophile", "pedo", "ped0",
];

// Build regex patterns that catch leet speak substitutions
function normalizeForCheck(input: string): string {
  return input
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/\$/g, "s")
    .replace(/@/g, "a")
    .replace(/[_\-.\s]/g, "");
}

export function containsProfanity(input: string): boolean {
  const normalized = normalizeForCheck(input);
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

export function validateCleanUsername(input: string): string | null {
  if (containsProfanity(input)) {
    return "This username contains inappropriate language and is not allowed.";
  }
  return null;
}
