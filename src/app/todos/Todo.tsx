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

const Todo = () => {
  return (
    <div className="flex justify-between">
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <label
          htmlFor="terms"
          className={cn(
            `text-sm leading-none transition-all duration-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70`,
            {
              "line-through": false,
            },
          )}
        >
          Todo title
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
          <DropdownMenuItem className="group flex items-center gap-2">
            <Pencil className="h-4 w-4 text-slate-600 duration-300 group-hover:rotate-12" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="group flex items-center gap-2 text-red-500"
            // onClick={() => {}}
          >
            <Delete className="h-4 w-4 duration-300 group-hover:rotate-12 group-hover:text-red-500" />
            <span className="group-hover:text-red-500">Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Todo;
