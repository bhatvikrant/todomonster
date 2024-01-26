import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

import {
  boolean,
  int,
  mysqlTableCreator,
  text,
  datetime,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `todomonster_${name}`);

export const replicacheMeta = mysqlTable("replicache_meta", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value"),
});

export type ReplicacheMeta = InferSelectModel<typeof replicacheMeta>;
export type InsertReplicacheMeta = InferInsertModel<typeof replicacheMeta>;

// Stores last mutationID processed for each Replicache client.
export const replicacheClient = mysqlTable("replicache_client", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  clientGroupID: text("client_group_id").notNull(),
  lastMutationID: int("last_mutation_id").notNull(),
  clientVersion: int("version").notNull(),
  lastModified: datetime("last_modified", { mode: "date", fsp: 6 }).notNull(),
});

export type ReplicacheClient = InferSelectModel<typeof replicacheClient>;
export type InsertReplicacheClient = InferInsertModel<typeof replicacheClient>;

// cvrversion is null until first pull initializes it.
export const replicacheClientGroup = mysqlTable("replicache_client_group", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  cvrVersion: int("cvr_version"),
  clientGroupVersion: int("client_group_version").notNull(),
  lastModified: datetime("last_modified", { mode: "date", fsp: 6 }).notNull(),
});

export type ReplicacheClientGroup = InferSelectModel<
  typeof replicacheClientGroup
>;
export type InsertReplicacheClientGroup = InferInsertModel<
  typeof replicacheClientGroup
>;

// Application domain entities

export const list = mysqlTable("list", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  ownerID: text("owner_id").notNull(),
  name: text("name").notNull(),
  rowVersion: int("row_version").notNull(),
  lastModified: datetime("last_modified", { mode: "date", fsp: 6 }).notNull(),
});

export type List = InferSelectModel<typeof list>;
export type InsertList = InferInsertModel<typeof list>;

export const item = mysqlTable("item", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  listID: text("list_id").notNull(),
  title: text("title").notNull(),
  complete: boolean("complete").notNull(),
  ord: int("ord").notNull(),
  rowVersion: int("row_version").notNull(),
  lastModified: datetime("last_modified", { mode: "date", fsp: 6 }).notNull(),
});

export type Item = InferSelectModel<typeof item>;
export type InsertItem = InferInsertModel<typeof item>;

export const todoIssueMapping = mysqlTable("todo_issue_mapping", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  todoID: text("todo_id").notNull(),
  issueNodeID: text("issue_node_id").notNull(),
  issueNumber: int("issue_number").notNull(),
});
