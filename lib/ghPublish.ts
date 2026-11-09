/*
 * Publishing from the site's own editors (trajetória layers, gallery).
 * Commits a set of files to main in ONE commit through the GitHub API, using
 * a fine-grained token the owner pastes once; it is kept only in that
 * browser's localStorage. Vercel deploys main automatically.
 * (Direct publishing was explicitly chosen by the site owner.)
 */
export const REPO = { owner: "BrunoMullerBrazil", repo: "Portfolio", branch: "main" };
const TOKEN_KEY = "traj-editor-gh-token"; // shared by every editor on the site

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
export function setToken(t: string) {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {}
}

export type FileChange =
  | { path: string; text: string }
  | { path: string; base64: string }
  | { path: string; remove: true };

export async function commitFiles(token: string, message: string, files: FileChange[]) {
  const gh = async (path: string, init?: RequestInit) => {
    const r = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.repo}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return r.json();
  };
  const ref = await gh(`/git/ref/heads/${REPO.branch}`);
  const head = await gh(`/git/commits/${ref.object.sha}`);
  const tree: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
  for (const f of files) {
    if ("remove" in f) {
      tree.push({ path: f.path, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const body = "text" in f ? { content: f.text, encoding: "utf-8" } : { content: f.base64, encoding: "base64" };
    const blob = await gh(`/git/blobs`, { method: "POST", body: JSON.stringify(body) });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh(`/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
  const c = await gh(`/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] }),
  });
  await gh(`/git/refs/heads/${REPO.branch}`, { method: "PATCH", body: JSON.stringify({ sha: c.sha }) });
  return c.sha as string;
}
