/*
 * EMERGENCY CONTACT ROUTE - Individual Contact Operations
 * Endpoint: /api/v1/contacts/[id]
 * 
 * What does this route do?
 *  - Lets the logged-in user update or delete ONE of their own emergency contacts.
 *  - The [id] in the URL says which contact (e.g. the one they tapped in the app)
 * 
 * 1. PUT /api/v1/contacts/[id]
 *  - Replaces the contact's fields with the request body, validated against
 *    UpdateContactSchema (the [id] from the URL is merged in first).
 *  - 200 with the updated contact | 400 invalid body | 404 not found
 * 
 *  2. DELETE /api/v1/contacts/[id]
 *  - Removes the contact from the user's list.
 *  - 204 (no body) when deleted | 404 not found
 * 
 *  Ownership:
 *  - The [id] comes from the client, so it can't be trusted on its own. Every
 *    query filters by both the contact id AND currentUserId(), so a user can
 *    only change their own contacts.
 *  - 404 covers both "doesn't exist" and "belongs to someone else", so the
 *    route never reveals that another user's contact exists.
 * 
 * 
 *   Errors (both methods):
 *  - 401 no logged-in user | 500 anything unexpected
 *  - Always shaped as { error: { code, message } }.
 * 
 * Listing all contacts or adding a new one lives in /api/v1/contacts (route.ts)
 */
import { currentUserId } from "@project/auth";
import {UpdateContactSchema, updateEmergencyContact, deleteEmergencyContact} from "@project/domain";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await currentUserId();
    const body = await request.json().catch(() =>
    null)

    // Combine path ID with the body to pass to Zod schema
    const payload = { ...body, id };
    
    const parsed = UpdateContactSchema.safeParse(payload); 

    if (!parsed.success) {
      return Response.json(
        {  
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid update payload",
          },
        },
        { status: 400 }
      );
    }
    
    const updatedContact = await updateEmergencyContact(userId, parsed.data);

    if (!updatedContact) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Contact not found." } },
        { status: 404 }
      );
    }

    return Response.json(updatedContact, { status: 200 });

  } catch (error) { 
    console.error("contact-update-error", error);

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

export async function DELETE(request: Request,
  { params } : { params: Promise<{ id: string }> },
) {
  try {
    const {id} = await params;
    const userId = await currentUserId();
    const deleted = await deleteEmergencyContact(userId, id);

    if(!deleted) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Contact not found."} },
        { status: 404}
      );
    }

    return new Response(null, { status: 204 });
  
  } catch (error) {
    console.error("contact-delete-error", error);

    if (error instanceof Error && error.message.includes("Dev identity stub is disabled")) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication is required." } },
        { status: 401 }
      );
    }

    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 },
    );
  }
}
