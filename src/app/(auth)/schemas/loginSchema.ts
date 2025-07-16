import { z } from "zod";

export const loginSchema = z.object({
  phone_number: z.string().min(5, "Telefon raqam juda qisqa"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo‘lishi kerak"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
