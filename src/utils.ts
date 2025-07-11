/**
 * Represents a GitHub API content item response
 */
interface GitHubContentItem {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string | null
  type: 'file' | 'dir' | 'symlink' | 'submodule'
}

/**
 * Custom error class for GitHub API related errors
 */
export class GitHubAPIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

/**
 * Checks if a directory exists in a GitHub repository
 * @param repoOwner - The owner of the repository
 * @param repoName - The name of the repository
 * @param directoryName - The directory to check
 * @throws {GitHubAPIError} If the API request fails
 * @throws {Error} If the directory is not found or other errors occur
 */
export async function checkDirectoryExists(
  repoOwner: string,
  repoName: string,
  directoryName: string
): Promise<boolean> {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new GitHubAPIError(
        response.status,
        `Failed to fetch repository contents: ${response.statusText}`
      )
    }

    const contents: GitHubContentItem[] = await response.json()

    const directoryExists = contents.some(
      (item) => item.name === directoryName && item.type === 'dir'
    )

    if (directoryExists) {
      return true
    }

    return false
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error
    }
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}
