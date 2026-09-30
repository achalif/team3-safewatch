/**
 * EMERGENCY CONTACT ROUTE - ALL CONTACTS
 * Endpoint: /api/v1/contacts
 * 
 * What does this route do?
 *  - Lets a logged in user see their full list of emergency contacts, or add a new one.
 *  The user always comes from currentUserId(), never from the request, so a user can only
 *  see or add to their own list.
 * 
 * 1. GET /api/v1/contacts
 *  - Returns every emergency contact belonging to the current user
 * 
 * 2. POST /api/v1/contacts
 *  - Adds a new emergency contact for the current user.
 *  - The body is checked against createEmergencyContactSchema first,
 *    bad input returns 400 VALIDATION_ERROR before it can touch the database.
 *  - If isPrimary is true, the user's other contacts are un-marked as primary
 *    in the same transaction, so there's only ever one primary contact.
 *  - Returns 201 status code with the new contact.
 * 
 * Errors always come back as {error: {code, message}}.
 * 
 * Updating or deleting ONE contact lives in /api/v1/contacts/:id
 */

import { currentUserId } from "@project/auth";
import { createEmergencyContact, CreateEmergencyContactSchema, listEmergencyContacts } from "@project/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await currentUserId();
    const contacts = await listEmergencyContacts(userId);
    return Response.json(contacts);
  } catch (error) {
    console.error("contact-list-error", error);

    if (error instanceof Error && error.message.includes("Dev identity stub is disabled")) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication is required." } },
        { status: 401 },
      );
    }

    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await currentUserId();
    const body = await request.json();
    const parsed = CreateEmergencyContactSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid contact payload.",
          },
        },
        { status: 400 }
      );
    }

    const contact = await createEmergencyContact(userId, parsed.data);
    return Response.json(contact, { status: 201 });
  } catch (error) {
    console.error("contact-create-error", error);

    if (error instanceof Error && error.message.includes("Dev identity stub is disabled")) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication is required." } },
        { status: 401 }
      );
    }
    
    return Response.json(
       { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
       { status: 500 }
    );
  }
}

