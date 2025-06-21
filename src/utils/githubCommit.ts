import { Octokit } from "@octokit/rest";
export async function commitFile(filePath: string, content: string, message: string) {
  const token = process.env.GITHUB_TOKEN;
  const repoInfo = process.env.GITHUB_REPOSITORY;
  if (!token || !repoInfo) {
    console.log("GITHUB_TOKEN or GITHUB_REPOSITORY not set. Skipping commit.");
    return;
  }

  const [owner, repo] = repoInfo.split("/");
  const octokit = new Octokit({ auth: token });

  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    if (!Array.isArray(data) && "sha" in data) {
      sha = data.sha as string;
    }
  } catch {
    // File might not exist
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(content).toString("base64"),
    sha,
  });
  console.log(`✅ Committed ${filePath} to GitHub`);
}
