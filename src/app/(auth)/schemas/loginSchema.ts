// src/app/(auth)/schemas/loginSchema.ts
import { z } from "zod";

export const loginSchema = z.object({
  phone_number: z
    .string()
    .min(10, "Telefon raqam kamida 10 ta belgidan iborat bo‘lishi kerak"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo‘lishi kerak"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
