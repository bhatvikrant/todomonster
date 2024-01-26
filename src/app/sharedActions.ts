import type { ClientGroupRecord } from "@replicache/types";

import { eq } from "drizzle-orm";
import db from "~/server/db";
import { replicacheClientGroup } from "~/server/db/schema";

export async function putClientGroup(clientGroup: ClientGroupRecord) {
  const { id, cvrVersion, clientGroupVersion } = clientGroup;
  const insertClientGroupStatementQuery = db
    .insert(replicacheClientGroup)
    .values({
      id,
      cvrVersion,
      clientGroupVersion,
      lastModified: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        cvrVersion,
        clientGroupVersion,
        lastModified: new Date(),
      },
    })

    .prepare();

  await insertClientGroupStatementQuery.execute();
}

async function getClientGroup(
  clientGroupID: string,
): Promise<Omit<ClientGroupRecord, "id">> {
  const clientGroupRowStatementQuery = db
    .select({
      cvrVersion: replicacheClientGroup.cvrVersion,
      clientGroupVersion: replicacheClientGroup.clientGroupVersion,
    })
    .from(replicacheClientGroup)
    .where(eq(replicacheClientGroup.id, clientGroupID))
    .prepare();

  const clientGroupRow = (await clientGroupRowStatementQuery.execute())[0] ?? {
    clientGroupVersion: 0,
    cvrVersion: null,
  };

  return clientGroupRow;
}

export async function getClientGroupForUpdate(
  clientGroupID: string,
): Promise<ClientGroupRecord> {
  const previousClientGroup = await getClientGroup(clientGroupID);
  return {
    id: clientGroupID,
    clientGroupVersion: previousClientGroup.clientGroupVersion,
    cvrVersion: previousClientGroup.cvrVersion,
  };
}
