"use server";

import { eq } from "drizzle-orm";
import type { MutationV1 } from "replicache";
import type {
  Affected,
  ClientGroupRecord,
  ClientRecord,
  List as ReplicacheList,
  Todo,
} from "@replicache/types";

import { getClientGroupForUpdate, putClientGroup } from "./sharedActions";
import {
  createList,
  createTodo,
  deleteList,
  deleteTodo,
  updateTodo,
} from "./appActions";
import db from "~/server/db";
import { replicacheClient } from "~/server/db/schema";
import Ably from "ably";
import { env } from "~/env";

async function getClient(clientID: string): Promise<Omit<ClientRecord, "id">> {
  const clientRowStatementQuery = db
    .select({
      clientGroupID: replicacheClient.clientGroupID,
      lastMutationID: replicacheClient.lastMutationID,
      clientVersion: replicacheClient.clientVersion,
    })
    .from(replicacheClient)
    .where(eq(replicacheClient.id, clientID))
    .prepare();

  const clientRow = (await clientRowStatementQuery.execute())[0] ?? {
    clientGroupID: "",
    lastMutationID: 0,
    clientVersion: 0,
  };

  return clientRow;
}

async function getClientForUpdate(clientID: string): Promise<ClientRecord> {
  const previousClient = await getClient(clientID);
  return {
    id: clientID,
    clientGroupID: previousClient.clientGroupID,
    lastMutationID: previousClient.lastMutationID,
    clientVersion: previousClient.clientVersion,
  };
}

function mutate(userID: string, mutation: MutationV1): Affected {
  switch (mutation.name) {
    case "createList":
      return createList(
        userID,
        mutation.args as ReplicacheList,
      ) as unknown as Affected;
    case "deleteList":
      return deleteList(userID, mutation.args as string) as unknown as Affected;
    case "createTodo":
      return createTodo(
        userID,
        mutation.args as Omit<Todo, "sort">,
      ) as unknown as Affected;
    case "updateTodo":
      return updateTodo(userID, mutation.args as Todo) as unknown as Affected;
    case "deleteTodo":
      return deleteTodo(userID, mutation.args as string) as unknown as Affected;
    default:
      return {
        listIDs: [],
        userIDs: [],
      };
  }
}

async function putClient(client: ClientRecord) {
  const { id, clientGroupID, lastMutationID, clientVersion } = client;
  const insertClientStatementQuery = db
    .insert(replicacheClient)
    .values({
      id,
      clientGroupID,
      lastMutationID,
      clientVersion,
      lastModified: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        lastMutationID,
        clientVersion,
        lastModified: new Date(),
      },
    })
    .prepare();

  await insertClientStatementQuery.execute();
}

export async function processMutation(
  clientGroupID: string,
  userID: string,
  mutation: MutationV1,
  error?: string | undefined,
) {
  let affected: Affected = { listIDs: [], userIDs: [] };
  console.log(
    error === null ? "Processing mutation" : "Processing mutation error",
    JSON.stringify(mutation, null, ""),
  );

  const baseClientGroup = await getClientGroupForUpdate(clientGroupID);
  const baseClient = await getClientForUpdate(mutation.clientID);

  console.log("baseClientGroup", { baseClientGroup }, "baseClient", {
    baseClient,
  });

  const nextClientVersion = baseClientGroup.clientGroupVersion + 1;
  const nextMutationID = baseClient.lastMutationID + 1;

  console.log(
    "nextClientVersion",
    nextClientVersion,
    "nextMutationID",
    nextMutationID,
  );

  // It's common due to connectivity issues for clients to send a
  // mutation which has already been processed. Skip these.
  if (mutation.id < nextMutationID) {
    console.log(
      `Mutation ${mutation.id} has already been processed - skipping`,
    );
    return { affected };
  }

  // If the Replicache client is working correctly, this can never
  // happen. If it does there is nothing to do but return an error to
  // client and report a bug to Replicache.
  if (mutation.id > nextMutationID) {
    throw new Error(
      `Mutation ${mutation.id} is from the future - aborting. This can happen in development if the server restarts. In that case, clear application data in browser and refresh.`,
    );
  }

  if (error === undefined) {
    console.log("Processing mutation:", JSON.stringify(mutation));
    try {
      affected = mutate(userID, mutation);
    } catch (mutateError: unknown) {
      // TODO: You can store state here in the database to return to clients to
      // provide additional info about errors.
      console.log(`Handling error from mutation "${mutation.name}":`);
      console.log(JSON.stringify(mutation));
      throw mutateError;
    }
  }

  const nextClientGroup: ClientGroupRecord = {
    id: clientGroupID,
    cvrVersion: baseClientGroup.cvrVersion,
    clientGroupVersion: nextClientVersion,
  };

  const nextClient: ClientRecord = {
    id: mutation.clientID,
    clientGroupID,
    lastMutationID: nextMutationID,
    clientVersion: nextClientVersion,
  };

  await putClientGroup(nextClientGroup);
  await putClient(nextClient);

  return { affected };
}

export async function sendPoke() {
  const ably = new Ably.Rest(env.NEXT_PUBLIC_ABLY_API_KEY);

  ably.channels.get(`todomonster-todos`).publish("poke-event");
  const t0 = Date.now();
  console.log("👉 Sent poke in", Date.now() - t0);
}
