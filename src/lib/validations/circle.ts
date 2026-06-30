import { z } from "zod";

export const circleCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
});

export const addMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});
