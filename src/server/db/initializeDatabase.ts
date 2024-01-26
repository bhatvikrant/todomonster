import db from "./index";
import { replicacheMeta } from "./schema";

// consider default values https://orm.drizzle.team/docs/indexes-constraints#default

const initializeDatabase = async () => {
  const rows = await db.select().from(replicacheMeta).prepare().execute();

  if (rows.length === 0) {
    // Insert a row to set the global database version in the replicacheServer table.
    console.log("initializing database...");
    await db
      .insert(replicacheMeta)
      .values({
        key: "schemaVersion",
        value: "1",
      })
      .execute();
  } else {
    console.log("database already initialized.");
  }
};

await initializeDatabase();
