/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextRequest } from "next/server";
import octokit, { owner, repo } from "octokit-init";

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("body:", body);
  try {
    const res = await octokit.rest.issues.create({
      owner,
      repo,
      title: "qwerty",
    });

    return Response.json(res, { status: res.status });
  } catch (error) {
    console.log("error:", error);
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
}
