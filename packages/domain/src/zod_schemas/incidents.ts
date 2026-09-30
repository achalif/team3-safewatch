/**
 * ZOD SCHEMAS FOR INCIDENTS
 * 
 * 
 * 
 */

import {z} from "zod";

export const listActiveIncidentsSchema = z.object({
    limit: z.coerce.number().int().positive().max(50).optional(),
});

export type ListActiveIncidentsInput = z.infer<typeof listActiveIncidentsSchema>;
