import { currentUserId } from "@project/auth";
import { createEmergencyContact, createEmergencyContactSchema } from "@project/domain";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await currentUserId();
    const body = await request.json();
    const parsed = createEmergencyContactSchema.safeParse(body);

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

    const errorCode =
      typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;

    if (errorCode === "P2002") {
      return Response.json(
        { error: { code: "CONFLICT", message: "A contact with this identifier already exists." } },
        { status: 409 }
      );
    }

    if (errorCode === "P2025") {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "The requested resource was not found." } },
        { status: 404 }
      );
    }

    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}
