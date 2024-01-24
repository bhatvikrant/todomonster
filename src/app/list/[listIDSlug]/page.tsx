"use client";

import { useReplicacheContext } from "src/lib/create-replicache-context";
import { usePathname } from "next/navigation";
import { handleNewItem } from "~/app/todoActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Todo from "./Todo";
import { useSubscribe } from "replicache-react";
import { getList, todosByList } from "@replicache/mutators";
import { type ReadTransaction } from "replicache";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ListPage = () => {
  const { rep } = useReplicacheContext();

  const pathname = usePathname();
  const listID = pathname.split("/").pop() ?? "";

  const selectedList = useSubscribe(
    rep,
    (tx: ReadTransaction) => getList(tx, listID),
    { default: undefined, dependencies: [listID] },
  );

  const todos = useSubscribe(
    rep,
    async (tx: ReadTransaction) => todosByList(tx, listID),
    { default: [], dependencies: [listID] },
  );
  todos.sort((a, b) => a.sort - b.sort);

  const handleSubmitItem = async (text: string) => {
    if (text) {
      handleNewItem(rep, listID, text);
    }
  };
  return (
    <div>
      <Link href="/" className="group mb-4 flex items-center gap-2 text-xs">
        <ArrowLeft className="h-3 w-3 text-slate-500 group-hover:text-slate-600" />
        <span className="text-slate-500 group-hover:text-slate-600 group-hover:underline">
          All lists
        </span>
      </Link>

      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="capitalize">
            {selectedList?.name} list
          </CardTitle>
          <CardDescription>
            {`Complete them all and you'll be a hero!`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todos.length === 0 && (
            <p className="text-center text-xs italic text-slate-400">
              ~ Nothing To Do yet ~
            </p>
          )}
          {todos.map((todo) => (
            <Todo key={todo.id} todo={todo} rep={rep} />
          ))}
        </CardContent>
        <p className="mx-6 mb-2 text-xs italic text-slate-500">
          {todos.filter((todo) => !todo.complete).length} item(s) left
        </p>
      </Card>

      <form
        className="sticky bottom-10 mt-6 flex items-center gap-2 bg-white"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
          const input = form.querySelector("#new-todo") as HTMLInputElement;

          await handleSubmitItem(input.value);
          input.value = "";
        }}
      >
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Input
              id="new-todo"
              placeholder="I want to..."
              required
              autoFocus
            />
          </div>
        </div>

        <Button>Create</Button>
      </form>
    </div>
  );
};

export default ListPage;
