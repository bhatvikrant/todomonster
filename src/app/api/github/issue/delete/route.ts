/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextRequest } from "next/server";
import octokit, { owner, repo } from "octokit-init";

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("body:", body);
  try {
    const issue = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: 5,
    });
    console.log("issue:", issue);

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
        issueId: issue.data.node_id,
      },
    );

    return Response.json(res, { status: 200 });
  } catch (error) {
    console.log("error:", error);
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
}
