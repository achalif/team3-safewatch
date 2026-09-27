import { prisma } from "@project/db";
import type { RegisterUserInput } from "../schemas/register-user";
import { createHash } from "node:crypto";

export function hashPassword(password: string) {
    return createHash("sha256").update(password).digest("hex");
}

export async function createNewUser(input: RegisterUserInput) {
    return prisma.user.create({
        data: {
            email: input.email,
            phoneNumber: input.phoneNumber,
            password: hashPassword(input.password),
            role: "USER",
            profile: {
                create: {
                firstName: input.firstName ?? null,
                lastName: input.lastName ?? null,
                status: "OFFLINE",
            },
        },
        },
    });
}