import {z} from "zod";
import { Relationship } from "@project/db";

export const EmergencyContactRelationshipSchema = z
  .enum([
    Relationship.PARENT,
    Relationship.SPOUSE,
    Relationship.SIBLING,
    Relationship.FRIEND,
    Relationship.OTHER,
  ])
  .optional();

export const CreateEmergencyContactSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phoneNumber: z.string().trim().min(7).max(30),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  relationship: EmergencyContactRelationshipSchema,
  isPrimary: z.boolean().default(false),
});

export type CreateEmergencyContactInput = z.infer<typeof CreateEmergencyContactSchema>;

export const UpdateContactSchema = CreateEmergencyContactSchema.extend({
  id: z.string().trim().min(1, "Contact ID is required"),
});

export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;