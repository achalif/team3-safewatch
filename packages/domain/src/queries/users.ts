import { prisma } from "@project/db";
import type { RegisterUserInput } from "../zod_schemas/users";
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
            profile: {
                create: {
                    firstName: input.firstName,
                    lastName: input.lastName,
                },
            },
        },
        omit: { password: true },
    });
}

export async function updateUser(userId: string,
    data : {
        email?: string,
        phoneNumber?: string,
    },
) {
    return prisma.user.update({
        where: {id: userId},
        data,
        omit: {password: true},
    });
}


export async function findUser(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: {id: userId },
            omit : {password: true},
        });
        return user;
    } catch(error) {
        console.log(`Unable to locate an account for ${userId}`, error);
        throw error;
    }
}


export async function deleteUser(userId: string) {
    try {
        const deletedUser = await prisma.user.delete({
            where : { id: userId },
            omit : {password: true},
        });
        return deletedUser;
    } catch(error) {
        console.log(`Unable to delete account for ${userId}`, error);
        throw error;
    }
}

export async function updateProfile(
    userId: string, 
    data : {
        firstName?: string,
        lastName?: string,
        pushToken?: string,
    },
 ) {
    return prisma.profile.update({
            where: { userId },
            data,
        });
    }