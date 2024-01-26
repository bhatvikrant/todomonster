"use server";

import { eq, and, gt } from "drizzle-orm";
import type {
  PatchOperation,
  PullRequestV1,
  PullResponseOKV1,
  PullResponseV1,
} from "replicache";

import type {
  Cookie,
  ClientRecord,
  ClientViewRecord,
  List,
  SearchResult,
  Todo,
} from "@replicache/types";
import { getClientGroupForUpdate, putClientGroup } from "./sharedActions";
import {
  getTodos,
  getLists,
  getPutsSince,
  getDelsSince,
  searchLists,
  searchTodosAndShares,
} from "./appActions";
import db from "~/server/db";
import { replicacheClient } from "~/server/db/schema";

// cvrKey -> ClientViewRecord
const cvrCache = new Map<string, ClientViewRecord>();

function makeCVRKey(clientGroupID: string, order: number) {
  return `${clientGroupID}/${order}`;
}

function getBaseCVR(clientGroupID: string, cookie: Cookie) {
  let previousCVR: ClientViewRecord | undefined;

  if (
    typeof cookie === "object" &&
    cookie !== null &&
    typeof cookie.order === "number"
  ) {
    previousCVR = cvrCache.get(makeCVRKey(clientGroupID, cookie.order));
  }

  const baseCVR = previousCVR ?? {
    list: new Map<string, number>(),
    todo: new Map<string, number>(),
    share: new Map<string, number>(),
    clientVersion: 0,
  };

  console.log({ previousCVR, baseCVR });

  return { previousCVR, baseCVR };
}

async function searchClients(
  clientGroupID: string,
  sinceClientVersion: number,
) {
  const clientRowStatementQuery = db
    .select({
      id: replicacheClient.id,
      lastMutationID: replicacheClient.lastMutationID,
      clientVersion: replicacheClient.clientVersion,
    })
    .from(replicacheClient)
    .where(
      and(
        eq(replicacheClient.clientGroupID, clientGroupID),
        gt(replicacheClient.clientVersion, sinceClientVersion),
      ),
    )
    .prepare();

  const clientRows = await clientRowStatementQuery.execute();

  const clients = clientRows.map((row) => {
    const client: ClientRecord = {
      id: row.id,
      clientGroupID,
      lastMutationID: row.lastMutationID,
      clientVersion: row.clientVersion,
    };
    return client;
  });

  return clients;
}

function fromSearchResult(result: SearchResult[]): Map<string, number> {
  const data = new Map<string, number>();
  result.forEach((row) => data.set(row.id, row.rowVersion));
  return data;
}

async function pullForChanges(
  clientGroupID: string,
  baseCVR: ClientViewRecord,
  userID: string,
  cookie: Cookie,
): Promise<{
  nextCVRVersion: number;
  nextCVR: ClientViewRecord;
  clientChanges: ClientRecord[];
  lists: List[];
  todos: Todo[];
}> {
  const baseClientGroupRecord = await getClientGroupForUpdate(clientGroupID);
  const clientChanges = await searchClients(
    clientGroupID,
    baseCVR.clientVersion,
  );
  const listMeta = await searchLists(userID);

  const listIDs = listMeta.map((listRow) => listRow.id);

  const { todoMeta } = await searchTodosAndShares(listIDs);

  const nextCVR: ClientViewRecord = {
    list: fromSearchResult(listMeta),
    todo: fromSearchResult(todoMeta),
    clientVersion: baseClientGroupRecord.clientGroupVersion,
  };

  const listPuts = getPutsSince(nextCVR.list, baseCVR.list);
  const todoPuts = getPutsSince(nextCVR.todo, baseCVR.todo);

  let previousCVRVersion = baseClientGroupRecord.cvrVersion;
  if (previousCVRVersion === null) {
    if (
      typeof cookie === "object" &&
      cookie !== null &&
      typeof cookie.order === "number"
    ) {
      previousCVRVersion = cookie.order;
    } else {
      previousCVRVersion = 0;
    }
    console.log(
      `ClientGroup ${clientGroupID} is new, initializing to ${previousCVRVersion}`,
    );
  }

  const nextClientGroupRecord = {
    ...baseClientGroupRecord,
    cvrVersion: previousCVRVersion + 1,
  };

  console.log({
    listPuts,
    todoPuts,
    nextClientGroupRecord,
  });

  const lists = await getLists(listPuts);
  const todos = await getTodos(todoPuts);
  await putClientGroup(nextClientGroupRecord);

  return {
    nextCVRVersion: nextClientGroupRecord.cvrVersion,
    nextCVR,
    clientChanges,
    lists,
    todos,
  };
}

function getPatch(
  previousCVR: ClientViewRecord | undefined,
  listDels: string[],
  lists: List[],

  todoDels: string[],
  todos: Todo[],
): PatchOperation[] {
  const patch: PatchOperation[] = [];

  if (previousCVR === undefined) {
    patch.push({ op: "clear" });
  }

  listDels.forEach((id) => {
    patch.push({ op: "del", key: `list/${id}` });
  });

  lists.forEach((listItem) => {
    patch.push({ op: "put", key: `list/${listItem.id}`, value: listItem });
  });

  todoDels.forEach((id) => {
    patch.push({ op: "del", key: `todo/${id}` });
  });

  todos.forEach((todoItem) => {
    patch.push({ op: "put", key: `todo/${todoItem.id}`, value: todoItem });
  });

  return patch;
}

async function processPull(
  pull: PullRequestV1,
  userID: string,
): Promise<PullResponseV1> {
  const { clientGroupID, cookie } = pull;
  const replicacheCookie = cookie as Cookie;
  const { previousCVR, baseCVR } = getBaseCVR(clientGroupID, replicacheCookie);

  const { nextCVRVersion, nextCVR, clientChanges, lists, todos } =
    await db.transaction(() =>
      pullForChanges(clientGroupID, baseCVR, userID, replicacheCookie),
    );

  const listDels = getDelsSince(nextCVR.list, baseCVR.list);

  const todoDels = getDelsSince(nextCVR.todo, baseCVR.todo);

  console.log({ listDels, todoDels });

  const patch = getPatch(previousCVR, listDels, lists, todoDels, todos);

  const responseCookie: Cookie = {
    clientGroupID,
    order: nextCVRVersion,
  };

  const body: PullResponseOKV1 = {
    cookie: responseCookie,
    lastMutationIDChanges: Object.fromEntries(
      clientChanges.map((clientRecord: ClientRecord): [string, number] => [
        clientRecord.id,
        clientRecord.lastMutationID,
      ]),
    ),
    patch,
  };

  cvrCache.set(
    makeCVRKey(responseCookie.clientGroupID, responseCookie.order),
    nextCVR,
  );

  return body;
}

export default processPull;
