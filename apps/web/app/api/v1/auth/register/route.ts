import { RegisterUser, createNewUser } from "@project/domain";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = RegisterUser.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      },
      { status: 400 }
    );
  }

  try {
    const user = await createNewUser(parsed.data);

    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          error: {
            code: "CONFLICT",
            message: "Email or phone number already registered",
          },
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong",
        },
      },
      { status: 500 }
    );
  }
}