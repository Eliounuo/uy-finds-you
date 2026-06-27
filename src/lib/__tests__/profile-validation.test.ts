import { describe, it, expect } from "vitest";
import {
  validateFullName,
  validatePhone,
  normalizePhone,
  isProfileComplete,
} from "../profile-validation";

describe("validateFullName", () => {
  it("accepts valid Kazakh names", () => {
    expect(validateFullName("Алия Нурланова")).toBeNull();
    expect(validateFullName("Бекзат")).toBeNull();
    expect(validateFullName("Jean-Pierre")).toBeNull();
  });

  it("rejects empty / too short", () => {
    expect(validateFullName("")).not.toBeNull();
    expect(validateFullName("A")).not.toBeNull();
  });

  it("rejects gibberish blocklist entries", () => {
    expect(validateFullName("test")).not.toBeNull();
    expect(validateFullName("asdf")).not.toBeNull();
    expect(validateFullName("admin")).not.toBeNull();
  });

  it("rejects names with no vowels", () => {
    expect(validateFullName("qjsjwkk")).not.toBeNull();
  });

  it("rejects repeated-character sequences", () => {
    expect(validateFullName("aaaaa")).not.toBeNull();
  });

  it("rejects names over 80 chars", () => {
    expect(validateFullName("А".repeat(81))).not.toBeNull();
  });

  it("rejects names with digits", () => {
    expect(validateFullName("Ali1 Nur")).not.toBeNull();
  });
});

describe("validatePhone", () => {
  it("accepts valid KZ numbers", () => {
    expect(validatePhone("+77001234567")).toBeNull();
    expect(validatePhone("+7 700 123 45 67")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(validatePhone("")).not.toBeNull();
  });

  it("rejects numbers without leading +", () => {
    expect(validatePhone("77001234567")).not.toBeNull();
  });

  it("rejects too-short numbers", () => {
    expect(validatePhone("+7123")).not.toBeNull();
  });
});

describe("normalizePhone", () => {
  it("strips spaces, dashes, parentheses", () => {
    expect(normalizePhone("+7 (700) 123-45-67")).toBe("+77001234567");
  });
});

describe("isProfileComplete", () => {
  it("returns true for valid profile", () => {
    expect(isProfileComplete({ full_name: "Алия Нурланова", phone: "+77001234567" })).toBe(true);
  });

  it("returns false when name is missing", () => {
    expect(isProfileComplete({ full_name: null, phone: "+77001234567" })).toBe(false);
  });

  it("returns false when phone is missing", () => {
    expect(isProfileComplete({ full_name: "Алия Нурланова", phone: null })).toBe(false);
  });
});
