import { currentUserId } from "@project/auth";
import { NoEmergencyContactsError, triggerSosAlert, triggerSosAlertSchema } from "@project/domain";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await currentUserId();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } },
        { status: 400 }
      );
    }

    const parsed = triggerSosAlertSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid SOS payload.",
          },
        },
        { status: 400 }
      );
    }

    const alert = await triggerSosAlert(userId, parsed.data);
    return Response.json(alert, { status: 201 });
  } catch (error) {
    if (error instanceof NoEmergencyContactsError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: 409 }
      );
    }

    console.error("sos-trigger-error", error);

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
