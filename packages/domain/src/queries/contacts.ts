import { prisma } from "@project/db";
import type { CreateEmergencyContactInput, UpdateContactInput } from "../zod_schemas/contacts";


export async function createEmergencyContact(
  userId: string,
  input: CreateEmergencyContactInput,
) {
  return prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.emergencyContact.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    return tx.emergencyContact.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber.trim(),
        email: input.email?.trim() || null,
        relationship: input.relationship ?? null,
        isPrimary: input.isPrimary,
        userId,
      },
    });
  });
}

export async function listEmergencyContacts(userId: string) {
    return prisma.emergencyContact.findMany({
      where : {userId},
      select : {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
        relationship: true,
        isPrimary: true
      },
      orderBy : [{isPrimary: "desc"}, {lastName: "asc"}]
    });

  }

export async function updateEmergencyContact(userId: string,
  payload: UpdateContactInput,
) {
  const {id: contactId, ...updatedFields} = payload;

  // updateMany instead of update: a missing or foreign contact updates 0 rows
  // instead of throwing, so the route can return 404
  const { count } = await prisma.emergencyContact.updateMany({
    where: {id: contactId, userId},
    data: updatedFields,
  });

  if (count === 0) {
    return null;
  }

  return prisma.emergencyContact.findFirst({
    where: {id: contactId, userId},
  });
}

export async function deleteEmergencyContact(userId: string, contactId: string) {
    const { count } = await prisma.emergencyContact.deleteMany({
        where: { id: contactId, userId },
    });
    return count > 0;
}


