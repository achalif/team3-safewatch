import { z } from "zod";

export const RegisterUser = z.object({
    email: z.string().trim().email("Invalid email address"),
    phoneNumber: z.string().trim().min(10, "Invalid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    firstName: z.string().trim().min(1, "First name must be at least 2 characters long").optional(),
    lastName: z.string().trim().min(1, "Last name must be at least 2 characters long").optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUser>;