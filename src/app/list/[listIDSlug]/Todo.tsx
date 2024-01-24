"use client";

import { Delete, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import type { Todo as TodoType, TodoUpdate } from "@replicache/types";
import { handleDeleteTodos, handleUpdateTodo } from "~/app/todoActions";
import { type Replicache } from "replicache";
import { type Mutators } from "@replicache/mutators";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { useState } from "react";

const Todo = ({
  todo,
  rep,
}: {
  todo: TodoType;
  rep: Replicache<Mutators> | null;
}) => {
  const [open, setOpen] = useState(false);
  const handleToggleComplete = async () => {
    await handleUpdateTodo(rep, { id: todo.id, complete: !todo.complete });
  };

  const handleUpdateItem = async (update: TodoUpdate) => {
    await handleUpdateTodo(rep, update);
  };

  const handleDeleteItems = async (ids: string[]) => {
    if (ids) {
      await handleDeleteTodos(rep, ids);
    }
  };
  return (
    <>
      <div className="flex justify-between">
        <div
          className={cn("flex items-center space-x-2", {
            "opacity-30": todo.complete,
          })}
        >
          <Checkbox
            id={`checkbox-${todo.id}`}
            checked={todo.complete}
            onCheckedChange={handleToggleComplete}
          />
          <label
            htmlFor={`checkbox-${todo.id}`}
            className={cn(
              `text-sm leading-none transition-all duration-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70`,
              {
                "line-through": todo.complete,
              },
            )}
          >
            {todo.text}
          </label>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="group flex items-center gap-2"
              onClick={() => setOpen(true)}
            >
              <Pencil className="h-4 w-4 text-slate-600 duration-300 group-hover:rotate-12" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="group flex items-center gap-2 text-red-500"
              onClick={() => handleDeleteItems([todo.id])}
            >
              <Delete className="h-4 w-4 duration-300 group-hover:rotate-12 group-hover:text-red-500" />
              <span className="group-hover:text-red-500">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Todo</DialogTitle>
            <DialogDescription>
              Create a Todo list to organize your tasks. For eg:{" "}
              {`"Work", "Groceries", "Chores"`}, etc.
            </DialogDescription>
          </DialogHeader>
          <form
            className="w-full"
            onSubmit={async (e) => {
              e.preventDefault();

              const form = e.target as HTMLFormElement;
              // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
              const input = form.querySelector(
                "#edit-todo",
              ) as HTMLInputElement;

              // await handleSubmitList(input.value);

              await handleUpdateItem({ id: todo.id, text: input.value });
              setOpen(false);
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="items-center gap-4">
                <Label htmlFor="edit-todo" className="text-right text-sm">
                  Edit
                </Label>
                <Input
                  defaultValue={todo.text}
                  id="edit-todo"
                  placeholder={`eg: Work, Groceries...`}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Todo;
