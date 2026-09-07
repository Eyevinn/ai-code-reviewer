export type GitHubRepositoryTarget = {
  kind: 'repository';
  owner: string;
  repo: string;
  ref?: string;
};

export type GitHubPullRequestTarget = {
  kind: 'pull_request';
  owner: string;
  repo: string;
  pullNumber: number;
};

export type GitHubTarget = GitHubRepositoryTarget | GitHubPullRequestTarget;

const OWNER_PART = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPOSITORY_PART = /^[A-Za-z0-9_.-]+$/;

export function parseGitHubUrl(value: string): GitHubTarget | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'github.com' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return undefined;
  }

  let parts: string[];
  try {
    parts = url.pathname
      .split('/')
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));
  } catch {
    return undefined;
  }

  if (parts.length < 2) {
    return undefined;
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, '');
  if (
    !OWNER_PART.test(owner) ||
    !REPOSITORY_PART.test(repo) ||
    repo === '.' ||
    repo === '..' ||
    repo.length > 100
  ) {
    return undefined;
  }

  if (parts.length === 2) {
    return { kind: 'repository', owner, repo };
  }

  const isSupportedPullPath =
    parts.length === 4 || (parts.length === 5 && parts[4] === 'files');
  if (parts[2] === 'pull' && isSupportedPullPath) {
    const pullNumber = Number(parts[3]);
    if (Number.isSafeInteger(pullNumber) && pullNumber > 0) {
      return { kind: 'pull_request', owner, repo, pullNumber };
    }
    return undefined;
  }

  if (parts[2] === 'tree' && parts.length >= 4) {
    const ref = parts.slice(3).join('/');
    if (ref && ref.length <= 1_024 && !/[\u0000-\u001f\u007f]/.test(ref)) {
      return { kind: 'repository', owner, repo, ref };
    }
  }

  return undefined;
}

export const githubUrlRegex = (
  value: string
): { owner: string; repo: string } | undefined => {
  const target = parseGitHubUrl(value);
  return target ? { owner: target.owner, repo: target.repo } : undefined;
};
