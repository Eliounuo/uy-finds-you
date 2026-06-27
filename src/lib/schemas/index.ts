import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Введите email")
    .email("Неверный формат email")
    .max(254, "Email слишком длинный")
    .toLowerCase(),
});
export type EmailFormData = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, "Код должен состоять из 6 цифр")
    .regex(/^\d{6}$/, "Только цифры"),
});
export type OtpFormData = z.infer<typeof otpSchema>;

// ── Profile ───────────────────────────────────────────────────────────────────
const GIBBERISH = new Set(["test", "asdf", "qwerty", "admin", "user", "null", "undefined", "anonymous"]);

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(80, "Имя слишком длинное")
    .regex(/^[\p{L}][\p{L}\s''\-]*$/u, "Используйте только буквы, пробелы и дефис")
    .refine((v) => !GIBBERISH.has(v.toLowerCase().replace(/[\s''\-]/g, "")), "Введите настоящее имя"),
  phone: z
    .string()
    .min(1, "Укажите номер телефона")
    .transform((v) => v.replace(/[\s()\-]/g, ""))
    .pipe(z.string().regex(/^\+[1-9]\d{6,14}$/, "Введите номер в международном формате, например +77001234567")),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

// ── Request ───────────────────────────────────────────────────────────────────
export const requestSchema = z.object({
  city: z.string().min(1, "Выберите город"),
  district: z.string().optional(),
  check_in: z.string().min(1, "Укажите дату заезда"),
  check_out: z.string().min(1, "Укажите дату выезда"),
  guests: z.number().int().min(1, "Минимум 1 гость").max(20, "Максимум 20 гостей"),
  rooms: z.number().int().min(1).max(10).optional(),
  budget_max: z.number().positive("Укажите бюджет").max(10_000_000).optional(),
  amenities: z.array(z.string()).default([]),
  notes: z.string().max(1000, "Не более 1000 символов").optional(),
  is_urgent: z.boolean().default(false),
}).refine(
  (d) => new Date(d.check_out) > new Date(d.check_in),
  { message: "Дата выезда должна быть позже даты заезда", path: ["check_out"] },
);
export type RequestFormData = z.infer<typeof requestSchema>;

// ── Property ──────────────────────────────────────────────────────────────────
export const propertySchema = z.object({
  title: z.string().min(5, "Минимум 5 символов").max(120, "Максимум 120 символов"),
  description: z.string().max(3000, "Максимум 3000 символов").optional(),
  city: z.string().min(1, "Укажите город"),
  address: z.string().min(5, "Укажите адрес").max(200),
  price_per_night: z.number().positive("Укажите цену").max(500_000),
  rooms: z.number().int().min(1).max(20),
  max_guests: z.number().int().min(1).max(30),
  amenities: z.array(z.string()).default([]),
});
export type PropertyFormData = z.infer<typeof propertySchema>;

// ── Contact / Message ─────────────────────────────────────────────────────────
export const messageSchema = z.object({
  text: z.string().min(1, "Введите сообщение").max(2000, "Максимум 2000 символов").trim(),
});
export type MessageFormData = z.infer<typeof messageSchema>;
