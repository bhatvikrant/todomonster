/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextRequest, NextResponse } from "next/server";

import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { type Todo } from "@replicache/types";
import octokit, { owner, repo } from "octokit-init";
import db from "~/server/db";
import { todoIssueMapping } from "~/server/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

type BodyType = {
  type: "createTodo" | "updateTodo" | "deleteTodo";
  data: Partial<Todo>;
  userID: string;
};

async function handler(request: NextRequest) {
  const body: BodyType = await request.json();

  const resp = await handleGithubIssuManipulation(body);

  if (resp.success) {
    return NextResponse.json(resp.data, { status: resp.status });
  } else {
    return new NextResponse(JSON.stringify({ error: resp.error }), {
      status: resp.status,
    });
  }
}

export const POST = verifySignatureAppRouter(handler);

async function handleGithubIssuManipulation({ type, data, userID }: BodyType) {
  switch (type) {
    case "createTodo": {
      if (!data.id) {
        return { message: `Todo id is missing`, status: 500, success: false };
      }
      try {
        try {
          await Promise.all(
            [
              {
                id: new Date().getTime(),
                name: `userID_${userID}`,
                color: "ff0000",
                description: "Todo created by user's Id",
              },
              {
                id: new Date().getTime() + 1,
                name: `listID_${data.listID}`,
                color: "0000ff",
                description: "Todo is part of this list",
              },
            ].map(async (labelData) =>
              octokit.rest.issues.createLabel({
                owner,
                repo,
                ...labelData,
                mediaType: {
                  previews: ["symmetra"],
                },
              }),
            ),
          );
        } catch (error) {
          console.log("error:", error);
        }
        const res = await octokit.rest.issues.create({
          owner,
          repo,
          title: data.text!,
          labels: [`userID_${userID}`, `listID_${data.listID}`],
        });

        await db.insert(todoIssueMapping).values({
          id: nanoid(),
          todoID: data.id,
          issueNodeID: res.data.node_id,
          issueNumber: res.data.number,
        });

        return { data: res, status: res.status, success: true };
      } catch (error) {
        console.log("error:", error);

        return { error, status: 500, success: false };
      }
    }

    case "updateTodo": {
      try {
        const mappingRes = await db.query.todoIssueMapping.findFirst({
          where: eq(todoIssueMapping.todoID, data.id!),
        });

        if (!mappingRes) {
          return { message: `Todo id is missing`, status: 500, success: false };
        }

        const res = await octokit.rest.issues.update({
          owner,
          repo,
          issue_number: mappingRes.issueNumber,
          title: data.text,
          state: data.complete ? "closed" : "open",
        });

        return { data: res, status: res.status, success: true };
      } catch (error) {
        console.log("error:", error);

        return { error, status: 500, success: false };
      }
    }

    case "deleteTodo": {
      try {
        const mappingRes = await db.query.todoIssueMapping.findFirst({
          where: eq(todoIssueMapping.todoID, data.id!),
        });

        if (!mappingRes) {
          return { message: `Todo id is missing`, status: 500, success: false };
        }

        const res = await octokit.graphql(
          `mutation($issueId: ID!) {
                deleteIssue(input: {
                  issueId: $issueId
                }) {
                  repository {
                    name
                  }
                }
              }`,
          {
            issueId: mappingRes.issueNodeID,
          },
        );

        return { data: res, status: 200, success: true };
      } catch (error) {
        console.log("error:", error);

        return { error, status: 500, success: false };
      }
    }
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return { message: `Unknown type: ${type}`, status: 500, success: false };
  }
}
