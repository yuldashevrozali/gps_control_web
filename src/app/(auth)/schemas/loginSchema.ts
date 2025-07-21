// loginSchema.ts
import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email("To‘g‘ri email kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo‘lishi kerak"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
