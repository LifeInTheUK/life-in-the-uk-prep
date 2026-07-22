import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "./config";

export const sql = neon(DATABASE_URL);
