// Validation utilities for user profile (name + phone)

const GIBBERISH_BLOCKLIST = new Set([
  "test",
  "testtest",
  "asdf",
  "asdfasdf",
  "qwerty",
  "qwer",
  "qweqwe",
  "zxcv",
  "admin",
  "user",
  "null",
  "undefined",
  "name",
  "noname",
  "anonymous",
]);

const VOWELS = /[aeiouyаеёиоуыэюяAEIOUYАЕЁИОУЫЭЮЯ]/;
const LETTERS = /\p{L}/u;
const REPEAT_CHAR = /(.)\1{3,}/u; // aaaa, !!!! etc.

/**
 * Validates a person's full name.
 * Returns null on success, or an error message string.
 */
export function validateFullName(input: string): string | null {
  const value = (input ?? "").trim().replace(/\s+/g, " ");
  if (value.length < 2) return "Имя должно содержать минимум 2 символа";
  if (value.length > 80) return "Имя слишком длинное";

  // Must contain at least one letter
  if (!LETTERS.test(value)) return "Имя должно содержать буквы";

  // Allow only letters, spaces, hyphens, apostrophes
  if (!/^[\p{L}][\p{L}\s'’\-]*$/u.test(value)) {
    return "Используйте только буквы, пробелы и дефис";
  }

  // Lower-cased compact form for heuristic checks
  const compact = value.toLowerCase().replace(/[\s'’\-]/g, "");

  if (compact.length < 2) return "Имя слишком короткое";
  if (GIBBERISH_BLOCKLIST.has(compact)) return "Введите настоящее имя";

  // No vowel at all → likely gibberish (e.g. "qjsjwkk")
  if (!VOWELS.test(compact)) return "Введите настоящее имя";

  // 4+ repeating chars in a row ("aaaa", "qjsjwkkkk")
  if (REPEAT_CHAR.test(compact)) return "Введите настоящее имя";

  // Whole string is a repetition of a short pattern: "testtest", "abcabc", "lalala"
  for (let n = 1; n <= Math.floor(compact.length / 2); n++) {
    if (compact.length % n !== 0) continue;
    const piece = compact.slice(0, n);
    if (piece.repeat(compact.length / n) === compact && compact.length >= 4) {
      return "Введите настоящее имя";
    }
  }

  // Vowel ratio sanity check — real names have at least one vowel per ~5 chars
  const vowelCount = (compact.match(/[aeiouyаеёиоуыэюя]/g) ?? []).length;
  if (compact.length >= 5 && vowelCount / compact.length < 0.15) {
    return "Введите настоящее имя";
  }

  return null;
}

/**
 * Validates an international phone number (E.164-ish: + followed by 7–15 digits).
 */
export function validatePhone(input: string): string | null {
  const value = (input ?? "").trim();
  if (!value) return "Укажите номер телефона";
  // Normalise visible separators
  const normalized = value.replace(/[\s()\-]/g, "");
  if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
    return "Введите номер в международном формате, например +77001234567";
  }
  return null;
}

export function normalizePhone(input: string): string {
  return (input ?? "").trim().replace(/[\s()\-]/g, "");
}

/**
 * Decide whether a stored profile is "complete" enough to use the app.
 * Used by the profile-completion gate.
 */
export function isProfileComplete(profile: {
  full_name?: string | null;
  phone?: string | null;
}): boolean {
  if (!profile) return false;
  if (validateFullName(profile.full_name ?? "")) return false;
  return true;
}
