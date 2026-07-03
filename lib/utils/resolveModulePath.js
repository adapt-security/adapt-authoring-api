import { fileURLToPath } from 'node:url'

/**
 * Resolves a path relative to a module URL to a native filesystem path. Uses
 * fileURLToPath rather than URL.prototype.pathname so the result is a valid path
 * on Windows (no leading slash before the drive letter) and correctly decodes
 * characters that URL would percent-encode (e.g. spaces, `#`).
 * @param {String} relativePath Path relative to baseUrl
 * @param {String} baseUrl A file: URL to resolve against (e.g. import.meta.url)
 * @return {String} Native filesystem path
 */
export function resolveModulePath (relativePath, baseUrl) {
  return fileURLToPath(new URL(relativePath, baseUrl))
}
