"use client";

import { Delete, PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { handleNewList, handleDeleteList as deleteList } from "./todoActions";
import { useReplicacheContext } from "~/lib/create-replicache-context";
import { useRouter } from "next/navigation";
import { listLists } from "@replicache/mutators";
import { useSubscribe } from "replicache-react";
import Link from "next/link";
import getRandomQuote from "~/lib/quotes";

export default function HomePage() {
  const { rep, userID } = useReplicacheContext();
  const router = useRouter();
  const lists = useSubscribe(rep, listLists, { default: [] });
  console.log("lists:", lists);

  const handleSubmitList = async (listName: string) => {
    await handleNewList(rep, userID, listName, router);
  };

  const handleDeleteList = async (listID: string) => {
    await deleteList(rep, listID, router);
  };

  return (
    <div className="container relative grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Todomonster
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">&ldquo;{getRandomQuote()}&rdquo;</p>
            <footer className="text-sm">Unknown</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to TodoMonster!
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a list to get started.
            </p>
          </div>
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Your Todo Lists</CardTitle>
              <CardDescription>Select a list to view its todos</CardDescription>
            </CardHeader>
            <CardContent>
              {lists.length === 0 && (
                <p className="text-center text-xs italic text-slate-400">
                  ~ No lists ~
                </p>
              )}

              {lists.map((list, idx) => (
                <div key={list.id} className="flex justify-between">
                  <Link href={`/list/${list.id}`} className="group">
                    {idx + 1}.{" "}
                    <span className="capitalize group-hover:underline">
                      {list.name}
                    </span>
                  </Link>

                  <Delete
                    className="h-4 w-4 opacity-30 duration-300 hover:text-red-500 hover:opacity-100"
                    onClick={() => handleDeleteList(list.id)}
                  />
                </div>
              ))}
            </CardContent>

            <CardFooter className="grid place-items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex w-full gap-2">
                    <PlusIcon className="h-4 w-4" />{" "}
                    <span>Create new list</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create new list</DialogTitle>
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
                        "#list-name",
                      ) as HTMLInputElement;

                      await handleSubmitList(input.value);
                    }}
                  >
                    <div className="grid gap-4 py-4">
                      <div className="items-center gap-4">
                        <Label
                          htmlFor="list-name"
                          className="text-right text-sm"
                        >
                          List Name
                        </Label>
                        <Input
                          id="list-name"
                          placeholder={`eg: Work, Groceries...`}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Your Todo Lists</CardTitle>
        <CardDescription>Select a list to view its todos</CardDescription>
      </CardHeader>
      <CardContent>
        {lists.length === 0 && (
          <p className="text-center text-xs italic text-slate-400">
            ~ No lists ~
          </p>
        )}

        {lists.map((list, idx) => (
          <div key={list.id} className="flex justify-between">
            <Link href={`/list/${list.id}`} className="group">
              {idx + 1}.{" "}
              <span className="capitalize group-hover:underline">
                {list.name}
              </span>
            </Link>

            <Delete
              className="h-4 w-4 opacity-30 duration-300 hover:text-red-500 hover:opacity-100"
              onClick={() => handleDeleteList(list.id)}
            />
          </div>
        ))}
      </CardContent>

      <CardFooter className="grid place-items-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex w-full gap-2">
              <PlusIcon className="h-4 w-4" /> <span>Create new list</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create new list</DialogTitle>
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
                  "#list-name",
                ) as HTMLInputElement;

                await handleSubmitList(input.value);
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="items-center gap-4">
                  <Label htmlFor="list-name" className="text-right text-sm">
                    List Name
                  </Label>
                  <Input
                    id="list-name"
                    placeholder={`eg: Work, Groceries...`}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
