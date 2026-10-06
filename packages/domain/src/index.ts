/**
 * DOMAIN PACKAGE ENTRY POINT (@project/domain)
 *
 * What does this file do?
 *  - Re-exports every query and Zod schema in this package, so the web app can
 *    import anything with one line:  import { createNewUser } from "@project/domain";
 *
 * Where does the actual code live?
 *  - queries/:  Prisma queries, one file per model (incidents, users, contacts)
 *  - zod_schemas/: Zod validation schemas + their inferred types, one file per model
 */

export * from "./queries/incidents";
export * from "./queries/users";
export * from "./queries/contacts";
export * from "./zod_schemas/users";
export * from "./zod_schemas/incidents";
export * from "./zod_schemas/contacts";

export * from "./queries/alerts";
export * from "./zod_schemas/alerts";
export * from "./queries/location";
export * from "./zod_schemas/location";
