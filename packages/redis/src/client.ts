/**
 * REDIS CLIENT CONNECTION
 * 
 * What does this file do?
 *      - Creates an instance of a shared Upstash Redis HTTP client for our APIs and services.
 * 
 * Why is this file needed?
 *      - Security: Prevents direct mobile/client access to Redis by routing requests to the
 *      backend API where validation and authorization happen.
 * 
 *      - Performance: Rather than opening a new database connection each time a GPS ping comes in,
 *      this file creates a single, stateless HTTP client instance that is configured
 *      via environment variables.
 * 
 *      - Reliability: Eliminates the need to establish and manage persistent TCP connection,
 *      allowing us to communicate with the database using HTTP requests. 
 *
 */

import { Redis } from "@upstash/redis";
export const redis = Redis.fromEnv();

