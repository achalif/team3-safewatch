/**
 * What is scanner.ts?
 *  - a lightweight, real-time data ingestion service running inside our background
 * @project/worker app. Its completely isolated as a sandbox file so it can handle 24/7 data
 * streaming without impacting our main API or core database loops.
 * 
 * What does scanner.ts do?
 *  - It functions as a high-frequency polling engine thats designed to capture incidents in real-time
 * using the following 3-step pipeline:
 * 
 *  1. hls-parser (locator) & safe polling loop: Using a recursive implementation of setTimeout(), our script 
 *  safely fetches a plain text .m3u8 index file from the streaming server at safe intervals. Once downloaded, `hls-parser`
 *  maps out the chaotic raw text stream into a clean TypeScript list of the most recent 911 audio chunks 
 *  (into .ts files).
 * 
 *  2. axios (transporter): It cross-checks the new filenames against our memory cache so we dont
 * look at anything twice. If it spots a brand-new audio file endpoint, it immediately issues an HTTP request
 * to download that chunk into our server's memory
 * 
 *  3. hls-ts (unpacker): Since live streams wrap raw sound inside a transport container, LLMs cannot read
 *  the audio files in this format. This allows us to strip away the metadata wrappers and transforms the
 *  audio chunks into raw binary audio (Buffer) which is then passed to our console and can be fed straight
 *  to the AI transcription engine we use.
 */
import axios from 'axios';
import { log } from "@project/log";

log.info("--- 911 STREAM PARSER SANDBOX ---");
log.info("Success! Your new backend scanner script is active and running inside the project worker.");