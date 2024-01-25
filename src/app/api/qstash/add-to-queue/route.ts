/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { env } from "~/env";

const client = new Client({ token: env.QSTASH_TOKEN });

// Todo: add some security checks to this endpoint, so that only our FE app can call it (and not anyone else) - maybe use a secret key? jwt?
export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await client.publishJSON({
    topic: "todomon-github-issue-manipulations",
    body,
  });

  return NextResponse.json({ ...res }, { status: 200 });
}
