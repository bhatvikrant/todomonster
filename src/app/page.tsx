"use client";

import { Check, Delete, GithubIcon, PlusIcon } from "lucide-react";
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
import { listLists, todosByList } from "@replicache/mutators";
import { useSubscribe } from "replicache-react";
import Link from "next/link";
import getRandomQuote from "~/lib/quotes";
import { useState } from "react";
import { type ReadTransaction } from "replicache";
import clsx from "clsx";

export default function HomePage() {
  const { rep, userID } = useReplicacheContext();
  const [activeListId, setActiveListId] = useState("");
  const router = useRouter();
  const lists = useSubscribe(rep, listLists, { default: [] });
  lists.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));

  const todos = useSubscribe(
    rep,
    async (tx: ReadTransaction) => todosByList(tx, activeListId),
    { default: [], dependencies: [activeListId] },
  );

  const handleSubmitList = async (listName: string) => {
    await handleNewList(rep, userID, listName, router);
  };

  const handleDeleteList = async (listID: string) => {
    const todoIDs = todos.map((todo) => todo.id);
    await deleteList(rep, listID, todoIDs, router);
  };

  return (
    <div className="container relative grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-zinc-900 text-white dark:border-r lg:flex">
        <video
          // src="/demo.mp4"
          src="https://github-production-user-asset-6210df.s3.amazonaws.com/50735025/299723551-28ec9d7d-b6a5-4349-8f49-abc71d0cf81e.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20240125%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240125T154824Z&X-Amz-Expires=300&X-Amz-Signature=c61b038c81c63ae07bff0839ecfbd8f31b6ac6befac89a5c169a31082d2898b0&X-Amz-SignedHeaders=host&actor_id=50735025&key_id=0&repo_id=747590517"
          autoPlay
          className="object-cover"
          controls
          muted
        />

        <div className="flex h-full flex-col justify-between p-10">
          <div>
            <div className="mb-2 flex items-center text-lg font-medium">
              <TodoMonsterSVGLogo />
              <span>TodoMonster</span>
            </div>

            {[
              "Offline first & Realtime sync between tabs. ~ Replicache",
              "1 todo = 1 issue in the github repository. ~ Octokit",
              "Scales to millions of todos. ~ QStash",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center space-x-2 opacity-80"
              >
                <Check className="h-3 w-3 text-green-400" />
                <span className="">{feature}</span>
              </div>
            ))}

            <div className="mt-8 space-y-3">
              <Link
                href="https://github.com/bhatvikrant/todomonster/issues"
                className="flex items-center  gap-2 underline-offset-4 opacity-30 transition-all duration-300 hover:underline hover:opacity-100"
                target="_blank"
              >
                <GithubIcon className="inline h-5 w-5" />{" "}
                <span>View Issues</span>
              </Link>
              <Link
                href="https://github.com/bhatvikrant/todomonster"
                className="flex items-center  gap-2 underline-offset-4 opacity-30 transition-all duration-300 hover:underline hover:opacity-100"
                target="_blank"
              >
                <GithubIcon className="inline h-5 w-5" />{" "}
                <span>View Source code</span>
              </Link>
            </div>
          </div>

          <div className="opacity-60">
            <blockquote className="space-y-2">
              <p className="text-sm">Quote of the render</p>
              <p className="text-lg">&ldquo;{getRandomQuote()}&rdquo;</p>
            </blockquote>
          </div>
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
                    <span className="text-sm capitalize leading-none transition-all duration-300 group-hover:underline peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {list.name}
                    </span>
                  </Link>

                  <Delete
                    className="h-4 w-4 opacity-30 duration-300 hover:text-red-500 hover:opacity-100"
                    onClick={async () => {
                      setActiveListId(list.id);
                      await handleDeleteList(list.id);
                    }}
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
}

const TodoMonsterSVGLogo = (props: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 375 374.999991"
    className={clsx("mr-2 h-6 w-6", props.className)}
  >
    <defs>
      <clipPath id="4cbdb14a6e">
        <path
          d="M 0 36 L 328 36 L 328 363.339844 L 0 363.339844 Z M 0 36 "
          clipRule="nonzero"
        />
      </clipPath>
    </defs>
    <path
      className={clsx("fill-white", props.className)}
      d="M 72.167969 177.210938 C 72.570312 172.5625 74.511719 168.449219 77.367188 164.703125 C 87.417969 151.496094 109.945312 145.441406 125.707031 155.183594 C 134.988281 160.925781 142.433594 168.308594 148.628906 177.046875 C 153.777344 184.304688 158.425781 191.921875 163.429688 199.585938 C 166.925781 194.628906 170.453125 189.535156 174.066406 184.5 C 205.113281 141.277344 239.199219 100.703125 278.738281 64.933594 C 302.996094 42.996094 330.828125 26.695312 360.769531 13.808594 C 365.949219 11.574219 370.261719 12.445312 374.703125 16.929688 C 372.671875 18.828125 370.648438 20.699219 368.640625 22.597656 C 342.488281 47.285156 316.902344 72.546875 293.675781 100.019531 C 280.382812 115.734375 268.058594 132.265625 255.378906 148.492188 C 229.84375 181.167969 210.734375 217.925781 189.03125 253.042969 C 180.65625 266.597656 172.355469 280.207031 163.964844 293.757812 C 160.632812 299.140625 156.246094 299.066406 152.898438 293.5625 C 142.046875 275.699219 133.488281 256.722656 125.402344 237.492188 C 118.648438 221.4375 111.0625 205.773438 101.429688 191.183594 C 96.660156 183.96875 91.046875 178.035156 81.816406 177.246094 C 78.699219 176.988281 75.53125 177.210938 72.167969 177.210938 Z M 72.167969 177.210938 "
      fillOpacity="1"
      fillRule="nonzero"
    />
    <g clipPath="url(#4cbdb14a6e)">
      <path
        className={clsx("fill-white", props.className)}
        d="M 306.996094 121.300781 L 281.558594 146.734375 C 288.90625 162.953125 292.984375 180.957031 292.984375 199.921875 C 292.984375 271.335938 235.09375 329.214844 163.667969 329.214844 C 92.242188 329.214844 34.355469 271.335938 34.355469 199.921875 C 34.355469 128.507812 92.242188 70.628906 163.667969 70.628906 C 181.527344 70.628906 198.523438 74.25 213.984375 80.789062 L 239.609375 55.167969 C 216.925781 43.242188 191.078125 36.496094 163.667969 36.496094 C 73.398438 36.496094 0.214844 109.664062 0.214844 199.921875 C 0.214844 290.179688 73.398438 363.339844 163.667969 363.339844 C 253.941406 363.339844 327.121094 290.171875 327.121094 199.914062 C 327.121094 171.425781 319.824219 144.625 306.996094 121.300781 Z M 306.996094 121.300781 "
        fillOpacity="1"
        fillRule="nonzero"
      />
    </g>
  </svg>
);
