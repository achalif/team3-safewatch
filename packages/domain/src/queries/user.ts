import { prisma, Relationship } from "@project/db";
/**
 * USER AND PROFILE QUERIES
 * 
 * 1. createUser(userId: string, data)
 *      - Creates a user record AND a profile record in one transaction 
 * 
 * 2. findUser(userId: string)
 *      - Searches for a specific user record in the User table if it exists
 * 
 * 4. deleteUser(userId: string)
 *      - Deletes a user record from the User table
 *      -onDelete(): Cascade ensures that any emergency contact records and the profile record tied to this
 *      user account is also deleted
 * 
 * 5. updateUser(userId: string, data)
 *      - Updates specified fields for a User account
 *    
 * 6. addEmergencyContact(userId: string, data)
 *      - Adds a new emergency contact tied to a specific user
 * 
 * 7. updateLocation(userId: string, longitude: number, latitude: number)
 *      - Periodically updates user's location
 * 
 * 8. deleteEmergencyContact(userId: string, contactId: string)
 *      - Deletes an emergency contact tied to a specified user
 *
 */

export async function createUser(
    userId: string,
    data : {
        email: string;
        phoneNumber: string;
        password: string;
        firstName?: string;
        lastName?: string;
    }
) {
    try {
        const user = await prisma.user.create({
            data : {
                id: userId,
                phoneNumber: data.phoneNumber,
                email: data.email,
                password: data.password,
                profile : {
                    create : {
                        firstName: data.firstName,
                        lastName: data.lastName,
                    }
                }
            }
        })
        return user;
    }   catch(error) {
        console.log(`Failed to create a user account`, error);
        throw error;
    }
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



export async function addEmergencyContact(
    userId: string,
    data : {
        firstName: string,
        lastName: string,
        phoneNumber: string,
        email?: string,
        relationship?: Relationship,
    },
) {
    try {
        const contact = await prisma.emergencyContact.create({
            data : {
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                email: data.email,
                relationship: data.relationship,

                user : { connect: { id: userId } },
            }
        })
        return contact;

    } catch(error) {
        console.log(`Unable to add emergency contact to  ${userId}`, error);
        throw error;
    }
}

export async function deleteEmergencyContact(userId: string, contactId: string) {
    const { count } = await prisma.emergencyContact.deleteMany({
        where: { id: contactId, userId },
    });
    return count > 0;
}

export async function updateEmergencyContact(
    userId: string,
    contactId: string,
    data: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        email?: string;
        relationship?: Relationship;
    },
) {
    const { count } = await prisma.emergencyContact.updateMany({
        where: { id: contactId, userId },
        data,
    });
    return count > 0;
}
