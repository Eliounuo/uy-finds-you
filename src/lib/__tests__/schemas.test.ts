import { describe, it, expect } from "vitest";
import { emailSchema, profileSchema, requestSchema, messageSchema, otpSchema } from "../schemas";

describe("emailSchema", () => {
  it("accepts valid email", () => {
    const result = emailSchema.safeParse({ email: "User@Example.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("rejects empty email", () => {
    expect(emailSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("rejects malformed email", () => {
    expect(emailSchema.safeParse({ email: "notanemail" }).success).toBe(false);
  });
});

describe("otpSchema", () => {
  it("accepts 6-digit code", () => {
    expect(otpSchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  it("rejects 5-digit code", () => {
    expect(otpSchema.safeParse({ code: "12345" }).success).toBe(false);
  });

  it("rejects non-digit code", () => {
    expect(otpSchema.safeParse({ code: "abc123" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  const valid = { full_name: "Алия Нурланова", phone: "+77001234567" };

  it("accepts valid profile", () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it("normalises phone (strips spaces)", () => {
    const r = profileSchema.safeParse({ ...valid, phone: "+7 700 123 45 67" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("+77001234567");
  });

  it("rejects phone without +", () => {
    expect(profileSchema.safeParse({ ...valid, phone: "77001234567" }).success).toBe(false);
  });

  it("rejects gibberish name", () => {
    expect(profileSchema.safeParse({ ...valid, full_name: "asdf" }).success).toBe(false);
  });

  it("rejects name with digits", () => {
    expect(profileSchema.safeParse({ ...valid, full_name: "Ali 1" }).success).toBe(false);
  });
});

describe("requestSchema", () => {
  const valid = {
    city: "Алматы",
    check_in: "2026-07-01",
    check_out: "2026-07-05",
    guests: 2,
  };

  it("accepts valid request", () => {
    expect(requestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when check_out <= check_in", () => {
    const r = requestSchema.safeParse({ ...valid, check_out: "2026-07-01" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("check_out");
    }
  });

  it("rejects 0 guests", () => {
    expect(requestSchema.safeParse({ ...valid, guests: 0 }).success).toBe(false);
  });

  it("defaults amenities to []", () => {
    const r = requestSchema.safeParse(valid);
    if (r.success) expect(r.data.amenities).toEqual([]);
  });
});

describe("messageSchema", () => {
  it("accepts non-empty message", () => {
    expect(messageSchema.safeParse({ text: "Привет" }).success).toBe(true);
  });

  it("rejects empty message", () => {
    expect(messageSchema.safeParse({ text: "" }).success).toBe(false);
  });

  it("rejects message over 2000 chars", () => {
    expect(messageSchema.safeParse({ text: "а".repeat(2001) }).success).toBe(false);
  });
});
