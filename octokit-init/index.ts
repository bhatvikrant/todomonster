import { Octokit } from "octokit";
import { env } from "~/env";

export const owner = "bhatvikrant";
export const repo = "todomonster";

const octokit = new Octokit({
  auth: env.GITHUB_PAT,
});

export default octokit;
