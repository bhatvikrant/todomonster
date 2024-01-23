import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { env } from "~/env.js";
import * as schema from "./schema";

export const serverID = 1;

const db = drizzle(
  new Database(env.DATABASE_URL, {
    fileMustExist: false,
  }),
  { schema },
);

export default db;
