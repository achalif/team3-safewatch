import { UserStatus, Relationship } from "../generated/prisma";
import { prisma } from "../client";


/**
 * USER DATABASE QUERIES:
 * 
 * What this file does:
 * 
 * 1. createUser(email: string, phoneNumber: string, password: string):
 *      - Creates a new user account record in the User table upon signup.
 *      - Expects a pre-hashed password string.
 * 
 * 2. createProfile(id: string, firstName?: string, lastName?: string)
 *      - Creates a new user profile record in the Profile table and connects it to the matching User Id.
 * 
 * 3. findUser()
 *      - When a user logs in or sends a request, the primary accound record
 *      is searched for to verify that it exists, to prevent duplicate accounts, etc.
 * 
 * 4. deleteAccount(userId: string)
 *      - Delete a user account from the User table
 *      - Due to onDelete: Cascade automatically deletes linked Profile record.
 * 
 * 5. updateUser(userId: string, data)
 *      - Updates core account fields in User table (e.g phone number, email,
 *      password, verification status, etc.).
 * 
 * 6. updateProfile(userId: string, data)
 *      - Updates customizable profile preferences (e.g first name, last name, 
 *      default radius, coordinates, push tokens).
 * 
 * 7. updateLocation(userId: string, latitude: number, longitude: number)
 *      - Enforces that both latitude and longitude are supplied together
 * 
 * 8. updateProfileStatus(userId: string, status: UserStatus, isActiveTracking: boolean)
 *      - Updates the user profile's active status (e.g., OFFLINE, ONLINE, IN_TRANSIT,
 *      EMERGENCY) and tracking state.
 * 
 * 9. addEmergencyContact(userId: string, data)
 *      - Adds a new emergency contact record linked to a specific userId
 * 
 * 10. deleteEmergencyContact(userId: string, contactId: string)
 *      - Deletes a specific emergency contact matching contactId,
 *      ensuring it belongs to the specified userId for authorization
 * 
 * 11. updateEmergencyContact(userId: string, contactId: string, data)
 *      - Updates an emergency contact matching contactId and userId,
 *      with o
 */

export async function createAccount(email: string, phoneNumber: string, password: string) {
    try {
        const user = await prisma.user.create({
            data : {
                email,
                phoneNumber,
                password,
            },
        });

        return user;
    } catch(error) {
        console.error("Failed to create user account: ", error);
        throw new Error("Unable to create user account");
    }

    }


export async function createProfile(userId: string, firstName?: string, lastName?: string, pushToken?: string, defaultRadiusMiles?: number) {
    try {
        return await prisma.profile.create({
            data : {
                firstName,
                lastName,
                pushToken,
                defaultRadiusMiles,
                user : {
                    connect : { id : userId }, // Foreign key, adding userId from User record to new Profile record
                },
            },
        });
    } catch(error) {
        console.error(`Failed to create profile for user: ${userId}`);
        throw new Error("Unable to create user profile");
    }

}

export async function findUser(id: string) {
    try{
        const user = await prisma.user.findUnique({
            where : { id },
            include : { profile : true}, // Pulls related UserProfile if it exists
    });

    return user; 
  } catch(error) {
    console.error(`Failed to fetch user with ID ${id}:`, error); // Logs database/Prisma error in server logs
    throw new Error("Unable to locate user account"); // Stop execution and notify API/route caller that it failed
    }
}

export async function deleteUser(userId: string) {
    try {
        return await prisma.user.delete({
            where : { id : userId },
        });
    } catch(error) {
        console.log(`Failed to delete user account for ${userId}`);
        throw new Error("Unable to delete user account.");
    }
}

export async function updateUser(
    userId: string,
    data: {
        email?: string,
        phoneNumber?: string,
        password?: string,
        isEmailVerified?: boolean,
        isPhoneVerified?: boolean,
    }
) {
    try {
        const updatedUser = await prisma.user.update({
            where : {id: userId},
            data,
        });
        return updatedUser;
    } catch(error) {
        console.log(`Failed to update user account ${userId}`, error);
        throw new Error("Unable to update user account.");
    }
}

export async function updateProfile(
    userId: string,
    data: {
        firstName?: string,
        lastName?: string,
        defaultRadiusMiles? : number,
        longitude?: number,
        latitude?: number,
        pushToken?: string,
    }
) { 
    try {
        const updatedProfile = await prisma.profile.update({
            where : {userId},
            data,
        })
    } catch(error) {
        console.log(`Failed to update profile for user ${userId}`);
        throw new Error("Unable to update user profile");
    }
}

export async function updateLocation(userId: string, longitude: number, latitude: number) {
    return updateProfile(userId, {longitude, latitude});
}

export async function updateProfileStatus(userId: string, status: UserStatus, isActiveTracking: boolean ) {
    try {
        const updatedStatus = await prisma.profile.update({
            where : { userId },
            data: { status, isActiveTracking},
        });
        return updatedStatus;
    } catch(error) {
        console.log(`Failed to update status for user: ${userId}`, error);
        throw new Error("Unable to update user status.");
    }

}

export async function addEmergencyContact(
    userId: string,
    data: {
        firstName: string,
        lastName: string,
        phoneNumber: string,
        email?: string,
        relationship?: Relationship;
    }
) {
  try {
    const contact = await prisma.emergencyContact.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            email: data.email,
            relationship: data.relationship,
            user : {
                connect : { id : userId },
            },
        },
    });

    return contact;
} catch(error) {
    console.log(`Failed to add emergency contact for user: ${userId}`);
    throw new Error("Unable to add emergency contact");
  }
}

export async function deleteEmergencyContact(userId: string, contactId: string) {
    try {
        const deleted = await prisma.emergencyContact.deleteMany({
            where : {id: contactId, userId},
        });
        
        return deleted;
    } catch(error) {
        console.log(`Failed to delete emergency contact: ${contactId}`, error);
        throw new Error("Unable to delete emergency contact");
    }
}

