"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import Todo from "./Todo";

const Todos = () => {
  return (
    <div>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Your Todos</CardTitle>
          <CardDescription>
            {`Complete them all and you'll be a hero!`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* {allTodos.isLoading && (
          <div className="grid place-items-center">
            <Icons.spinner className="h-4 w-4 animate-spin" />
          </div>
        )} */}
          {/* {allTodos.length === 0 && ( */}
          <p className="text-center text-xs italic text-slate-400">
            ~ Nothing To Do yet ~
          </p>
          {/* )} */}
          {/* {allTodos.map((todo) => ( */}
          <Todo />
          {/* ))} */}
        </CardContent>
      </Card>

      <form
        className="sticky bottom-10 mt-6 flex items-center gap-2 bg-white"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
          const input = form.querySelector("#new-todo") as HTMLInputElement;

          console.log("input.value:", input.value);
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

export default Todos;
