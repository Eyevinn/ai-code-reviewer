import { GitHubTarget } from '../../utils/regEx';

const GITHUB_API_URL = 'https://api.github.com';
const MAX_CONTEXT_CHARS = 100_000;
const MAX_FILE_CHARS = 20_000;
const MAX_REPOSITORY_FILES = 20;
const MAX_PULL_REQUEST_FILES = 50;

const TEXT_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.conf',
  '.cpp',
  '.cs',
  '.css',
  '.go',
  '.graphql',
  '.h',
  '.html',
  '.java',
  '.js',
  '.json',
  '.jsx',
  '.kt',
  '.md',
  '.mjs',
  '.php',
  '.proto',
  '.py',
  '.rb',
  '.rs',
  '.scss',
  '.sh',
  '.sql',
  '.svelte',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.vue',
  '.xml',
  '.yaml',
  '.yml'
]);

const IMPORTANT_FILES = new Set([
  'cargo.lock',
  'cargo.toml',
  'dockerfile',
  'go.mod',
  'go.sum',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'pom.xml',
  'requirements.txt',
  'tsconfig.json',
  'yarn.lock'
]);

const EXCLUDED_DIRECTORIES =
  /(^|\/)(\.git|\.next|build|coverage|dist|node_modules|out|target|vendor)(\/|$)/;

export type Repository = {
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  default_branch: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
};

type PullRequest = {
  number: number;
  title: string;
  body: string | null;
  changed_files: number;
  additions: number;
  deletions: number;
  user: { login: string };
  base: { sha: string };
  head: { sha: string };
};

type PullRequestFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

type Commit = {
  sha: string;
  commit: { tree: { sha: string } };
};

type GitTreeEntry = {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
};

type GitTree = {
  truncated: boolean;
  tree: GitTreeEntry[];
};

type GitBlob = {
  content: string;
  encoding: string;
};

export type ReviewContextFile = {
  path: string;
  source: 'patch' | 'snapshot';
  status: string;
  content: string;
  truncated: boolean;
};

export type RepositoryReviewContext = {
  repository: {
    name: string;
    fullName: string;
    owner: string;
    description: string | null;
    defaultBranch: string;
    primaryLanguage: string | null;
    topics: string[];
    stars: number;
    forks: number;
    openIssues: number;
    createdAt: string;
    updatedAt: string;
    pushedAt: string | null;
  };
  target: {
    kind: GitHubTarget['kind'];
    ref: string;
    baseRef: string | null;
    pullNumber: number | null;
    title: string | null;
    description: string | null;
    author: string | null;
    additions: number | null;
    deletions: number | null;
  };
  files: ReviewContextFile[];
  truncated: boolean;
  warnings: string[];
};

function encodePathPart(value: string) {
  return encodeURIComponent(value);
}

async function githubRequest<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_PAT;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Eyevinn-AI-Code-Reviewer',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getRepository(
  owner: string,
  repo: string
): Promise<Repository> {
  return githubRequest<Repository>(
    `/repos/${encodePathPart(owner)}/${encodePathPart(repo)}`
  );
}

function toRepositoryMetadata(repository: Repository) {
  return {
    name: repository.name,
    fullName: repository.full_name,
    owner: repository.owner.login,
    description: repository.description,
    defaultBranch: repository.default_branch,
    primaryLanguage: repository.language,
    topics: repository.topics || [],
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    createdAt: repository.created_at,
    updatedAt: repository.updated_at,
    pushedAt: repository.pushed_at
  };
}

function limitContent(content: string) {
  const normalized = content.replace(/\0/g, '');
  if (normalized.length <= MAX_FILE_CHARS) {
    return { content: normalized, truncated: false };
  }

  return {
    content: normalized.slice(0, MAX_FILE_CHARS),
    truncated: true
  };
}

function withLineNumbers(content: string) {
  return content
    .split('\n')
    .map((line, index) => `${index + 1}: ${line}`)
    .join('\n');
}

function withPatchLineNumbers(patch: string) {
  let newLine = 0;

  return patch
    .split('\n')
    .map((line) => {
      const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunk) {
        newLine = Number(hunk[1]);
        return line;
      }
      if (line.startsWith('-')) {
        return `old | ${line}`;
      }
      if (line.startsWith('\\')) {
        return `    | ${line}`;
      }

      const annotated = `${newLine.toString().padStart(4, ' ')} | ${line}`;
      newLine += 1;
      return annotated;
    })
    .join('\n');
}

function fileExtension(path: string) {
  const name = path.split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function filePriority(path: string) {
  const lowerPath = path.toLowerCase();
  const name = lowerPath.split('/').pop() || '';
  if (IMPORTANT_FILES.has(name) || lowerPath.startsWith('.github/workflows/')) {
    return 0;
  }
  if (name.startsWith('readme') || name.startsWith('contributing')) {
    return 1;
  }
  if (/^(src|app|lib|cmd|internal|pkg|server|client)\//.test(lowerPath)) {
    return 2;
  }
  return 3;
}

function isReviewableFile(entry: GitTreeEntry) {
  if (
    entry.type !== 'blob' ||
    EXCLUDED_DIRECTORIES.test(entry.path) ||
    (entry.size || 0) > 100_000
  ) {
    return false;
  }

  const name = entry.path.toLowerCase().split('/').pop() || '';
  return (
    IMPORTANT_FILES.has(name) || TEXT_EXTENSIONS.has(fileExtension(entry.path))
  );
}

async function buildPullRequestContext(
  target: Extract<GitHubTarget, { kind: 'pull_request' }>,
  repository: Repository,
  warnings: string[]
): Promise<RepositoryReviewContext> {
  const repositoryPath = `/repos/${encodePathPart(
    target.owner
  )}/${encodePathPart(target.repo)}`;
  const pullRequest = await githubRequest<PullRequest>(
    `${repositoryPath}/pulls/${target.pullNumber}`
  );
  const changedFiles = await githubRequest<PullRequestFile[]>(
    `${repositoryPath}/pulls/${target.pullNumber}/files?per_page=100`
  );

  const files: ReviewContextFile[] = [];
  let contextChars = 0;
  let truncated = pullRequest.changed_files > changedFiles.length;
  for (const file of changedFiles) {
    if (!file.patch || files.length >= MAX_PULL_REQUEST_FILES) {
      truncated = true;
      continue;
    }

    const limited = limitContent(withPatchLineNumbers(file.patch));
    if (contextChars + limited.content.length > MAX_CONTEXT_CHARS) {
      truncated = true;
      break;
    }

    contextChars += limited.content.length;
    truncated ||= limited.truncated;
    files.push({
      path: file.filename,
      source: 'patch',
      status: file.status,
      content: limited.content,
      truncated: limited.truncated
    });
  }

  if (truncated) {
    warnings.push(
      'The pull request exceeded one or more review context limits.'
    );
  }

  return {
    repository: toRepositoryMetadata(repository),
    target: {
      kind: target.kind,
      ref: pullRequest.head.sha,
      baseRef: pullRequest.base.sha,
      pullNumber: pullRequest.number,
      title: pullRequest.title,
      description: pullRequest.body,
      author: pullRequest.user.login,
      additions: pullRequest.additions,
      deletions: pullRequest.deletions
    },
    files,
    truncated,
    warnings
  };
}

async function buildRepositoryContext(
  target: Extract<GitHubTarget, { kind: 'repository' }>,
  repository: Repository,
  warnings: string[]
): Promise<RepositoryReviewContext> {
  const repositoryPath = `/repos/${encodePathPart(
    target.owner
  )}/${encodePathPart(target.repo)}`;
  const requestedRef = target.ref || repository.default_branch;
  const commit = await githubRequest<Commit>(
    `${repositoryPath}/commits/${encodePathPart(requestedRef)}`
  );
  const tree = await githubRequest<GitTree>(
    `${repositoryPath}/git/trees/${encodePathPart(
      commit.commit.tree.sha
    )}?recursive=1`
  );
  const reviewableEntries = tree.tree.filter(isReviewableFile);
  const selectedEntries = reviewableEntries
    .sort((left, right) => {
      const priority = filePriority(left.path) - filePriority(right.path);
      return priority || left.path.localeCompare(right.path);
    })
    .slice(0, MAX_REPOSITORY_FILES);

  const blobResults = await Promise.allSettled(
    selectedEntries.map((entry) =>
      githubRequest<GitBlob>(
        `${repositoryPath}/git/blobs/${encodePathPart(entry.sha)}`
      )
    )
  );
  const files: ReviewContextFile[] = [];
  let contextChars = 0;
  let truncated =
    tree.truncated || selectedEntries.length < reviewableEntries.length;

  blobResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      truncated = true;
      warnings.push(`Could not fetch ${selectedEntries[index].path}.`);
      return;
    }

    if (result.value.encoding !== 'base64') {
      truncated = true;
      warnings.push(`Unsupported encoding for ${selectedEntries[index].path}.`);
      return;
    }

    const decoded = Buffer.from(result.value.content, 'base64').toString(
      'utf8'
    );
    const limited = limitContent(withLineNumbers(decoded));
    if (contextChars + limited.content.length > MAX_CONTEXT_CHARS) {
      truncated = true;
      return;
    }

    contextChars += limited.content.length;
    truncated ||= limited.truncated;
    files.push({
      path: selectedEntries[index].path,
      source: 'snapshot',
      status: 'unchanged',
      content: limited.content,
      truncated: limited.truncated
    });
  });

  if (truncated) {
    warnings.push('The repository exceeded one or more review context limits.');
  }
  if (!process.env.GITHUB_PAT) {
    warnings.push(
      'GitHub was accessed without authentication and is subject to lower rate limits.'
    );
  }

  return {
    repository: toRepositoryMetadata(repository),
    target: {
      kind: target.kind,
      ref: commit.sha,
      baseRef: null,
      pullNumber: null,
      title: null,
      description: null,
      author: null,
      additions: null,
      deletions: null
    },
    files,
    truncated,
    warnings
  };
}

export async function getRepositoryReviewContext(
  target: GitHubTarget
): Promise<RepositoryReviewContext> {
  const warnings: string[] = [];
  const repository = await getRepository(target.owner, target.repo);
  if (target.kind === 'pull_request') {
    return buildPullRequestContext(target, repository, warnings);
  }
  return buildRepositoryContext(target, repository, warnings);
}
