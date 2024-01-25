import db from "~/server/db";
import { item, list } from "~/server/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import type {
  List,
  List as ReplicacheList,
  TodoUpdate,
} from "replicache/types";
import type { Affected, Todo, SearchResult } from "@replicache/types";
import { union, unionAll } from "drizzle-orm/sqlite-core";

export function getPutsSince(
  nextData: Map<string, number>,
  prevData: Map<string, number>,
): string[] {
  const puts: string[] = [];
  nextData.forEach((rowVersion, id) => {
    const prev = prevData.get(id);
    if (prev === undefined || prev < rowVersion) {
      puts.push(id);
    }
  });
  return puts;
}

export function getDelsSince(
  nextData: Map<string, number>,
  prevData: Map<string, number>,
): string[] {
  const dels: string[] = [];
  prevData.forEach((_, id) => {
    if (!nextData.has(id)) {
      dels.push(id);
    }
  });
  return dels;
}

export function getLists(listIDs: string[]) {
  if (listIDs.length === 0) return [];
  const listStatemenetQuery = db
    .select({
      id: list.id,
      name: list.name,
      ownerID: list.ownerID,
    })
    .from(list)
    .where(inArray(list.id, listIDs))
    .prepare();

  const listRows = listStatemenetQuery.all();
  const lists = listRows.map((row) => {
    const listItem: List = {
      id: row.id,
      name: row.name,
      ownerID: row.ownerID,
    };
    return listItem;
  });
  return lists;
}

export type ListAndID = {
  id: string;
  name: string;
  ownerID: string;
  rowVersion: number;
  lastModified: number;
};

export function createList(userID: string, listToInsert: ReplicacheList) {
  if (userID !== listToInsert.ownerID) {
    throw new Error("Authorization error, cannot create list for other user");
  }
  const { id, ownerID, name } = listToInsert;
  const insertListStatementQuery = db
    .insert(list)
    .values({
      id,
      ownerID,
      name,
      rowVersion: 1,
      lastModified: new Date(),
    })
    .prepare();

  insertListStatementQuery.run();

  return { listIDs: [], userIDs: [ownerID] };
}

export function searchLists(accessibleByUserID: string): SearchResult[] {
  const listRowStatementQuery = db
    .select({
      id: list.id,
      rowVersion: list.rowVersion,
    })
    .from(list)
    .where(or(eq(list.ownerID, accessibleByUserID)))
    .prepare();

  const listRows = listRowStatementQuery.all();

  return listRows;
}

export function searchTodosAndShares(listIDs: string[]) {
  if (listIDs.length === 0) return { shareMeta: [], todoMeta: [] };

  const todoStatementQuery = db
    .select({
      id: item.id,
      rowVersion: item.rowVersion,
      type: sql<string>`'todoMeta'`,
    })
    .from(item)
    .where(inArray(item.listID, listIDs));

  const sharesAndTodos = todoStatementQuery.prepare().all();

  const result: {
    shareMeta: { id: string; rowVersion: number }[];
    todoMeta: { id: string; rowVersion: number }[];
  } = {
    shareMeta: [],
    todoMeta: [],
  };

  sharesAndTodos.forEach((row) => {
    const { id, rowVersion, type } = row;
    result[type as "shareMeta" | "todoMeta"].push({ id, rowVersion });
  });

  return result;
}

function requireAccessToList(listID: string, accessingUserID: string) {
  const listRowStatementQuery = db
    .select({ numberOfRows: sql<number>`count(*)` })
    .from(list)
    .where(and(eq(list.id, listID), or(eq(list.ownerID, accessingUserID))))
    .prepare();

  const [{ numberOfRows }] = listRowStatementQuery.all();

  if (numberOfRows === 0) {
    throw new Error("Authorization error, can't access list");
  }
}

function getAccessors(listID: string) {
  const ownerIDStatementQuery = db
    .select({ userID: list.ownerID })
    .from(list)
    .where(eq(list.id, listID));

  const userIdRows = ownerIDStatementQuery.prepare().all();

  return userIdRows.map((row: { userID: string }) => row.userID);
}

export function deleteList(userID: string, listID: string): Affected {
  requireAccessToList(listID, userID);
  const userIDs = getAccessors(listID);
  const deleteListStatementQuery = db
    .delete(list)
    .where(eq(list.id, listID))
    .prepare();

  deleteListStatementQuery.run();

  db.select({
    id: item.id,
  })
    .from(item)
    .where(eq(item.listID, listID))
    .then((items) => {
      items.forEach((item) => {
        deleteTodo(userID, item.id, true);
      });
    })
    .catch(console.log);

  return {
    listIDs: [],
    userIDs,
  };
}

export function createTodo(userID: string, todo: Omit<Todo, "sort">) {
  requireAccessToList(todo.listID, userID);
  const maxOrdRowStatementQuery = db
    .select({ maxOrd: sql<number>`max(${item.ord})` })
    .from(item)
    .where(eq(item.listID, todo.listID))
    .prepare();

  const { maxOrd } = maxOrdRowStatementQuery.get() ?? { maxOrd: 0 };

  const { id, listID, text, complete } = todo;

  const insertItemStatementQuery = db
    .insert(item)
    .values({
      id,
      listID,
      title: text,
      complete,
      ord: maxOrd + 1,
      rowVersion: 1,
      lastModified: new Date(),
    })
    .prepare();

  insertItemStatementQuery.run();
  addToQstash({ type: "createTodo", data: todo, userID });

  return { listIDs: [todo.listID], userIDs: [] };
}

export function getTodos(todoIDs: string[]) {
  if (todoIDs.length === 0) return [];
  const todoRowStatementQuery = db
    .select({
      id: item.id,
      listID: item.listID,
      title: item.title,
      complete: item.complete,
      ord: item.ord,
    })
    .from(item)
    .where(inArray(item.id, todoIDs))
    .prepare();

  const todoRows = todoRowStatementQuery.all();

  const todos = todoRows.map((row) => {
    const todoToGet: Todo = {
      id: row.id,
      listID: row.listID,
      text: row.title,
      complete: row.complete,
      sort: row.ord,
    };
    return todoToGet;
  });

  return todos;
}

function mustGetTodo(id: string): Todo {
  const [todo] = getTodos([id]);
  if (!todo) {
    throw new Error("Specified todo does not exist");
  }
  return todo;
}

export function updateTodo(userID: string, todoToUpdate: TodoUpdate): Affected {
  const { listID } = mustGetTodo(todoToUpdate.id);
  requireAccessToList(listID, userID);
  const { text = null, complete = null, sort = null, id } = todoToUpdate;

  const completeAsInteger = complete !== null ? Number(complete) : null;

  const updateItemStatementQuery = db
    .update(item)
    .set({
      title: sql<string>`coalesce(${text}, title)`,
      complete: sql<boolean>`coalesce(${completeAsInteger}, complete)`,
      ord: sql<number>`coalesce(${sort}, ord)`,
      rowVersion: sql<number>`row_version + 1`,
      lastModified: new Date(),
    })
    .where(eq(item.id, id))
    .prepare();

  updateItemStatementQuery.run();
  addToQstash({ type: "updateTodo", data: todoToUpdate, userID });

  return {
    listIDs: [listID],
    userIDs: [],
  };
}

export function deleteTodo(
  userID: string,
  todoID: string,
  skipAccessCheck = false, // Todo: remove this check later once you have a fix
): Affected {
  const { listID } = mustGetTodo(todoID);
  if (!skipAccessCheck) {
    requireAccessToList(listID, userID);
  }
  const deleteTodoStatementQuery = db
    .delete(item)
    .where(eq(item.id, todoID))
    .prepare();

  deleteTodoStatementQuery.run();
  addToQstash({ type: "deleteTodo", data: { id: todoID }, userID });

  return {
    listIDs: [listID],
    userIDs: [],
  };
}

function addToQstash({
  type,
  data,
  userID,
}: {
  type: "createTodo" | "updateTodo" | "deleteTodo";
  data: Partial<Todo>;
  userID: string;
}) {
  void fetch("http://localhost:3000/api/qstash/add-to-queue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      data,
      userID,
    }),
  });
}
