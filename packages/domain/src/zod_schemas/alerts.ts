import { z } from "zod";

export const triggerSosAlertSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type TriggerSosAlertInput = z.infer<typeof triggerSosAlertSchema>;

// Thrown when the current user has no one to notify; the route maps it to 409.
export class NoEmergencyContactsError extends Error {
  readonly code = "NO_EMERGENCY_CONTACTS";

  constructor() {
    super("Add at least one emergency contact before triggering an SOS alert.");
  }
}
