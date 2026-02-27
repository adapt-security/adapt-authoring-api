/**
 * Recursively replaces placeholder strings in an object tree.
 * Non-string values (functions, numbers, booleans, null) pass through unchanged.
 * @param {*} obj The value to process
 * @param {Object<string,string>} replacements Map of placeholder to replacement value
 * @returns {*} The value with all placeholders resolved
 * @memberof api
 */
export function replacePlaceholders (obj, replacements) {
  if (typeof obj === 'string') {
    return Object.entries(replacements).reduce((s, [k, v]) => v != null ? s.replaceAll(k, v) : s, obj)
  }
  if (Array.isArray(obj)) return obj.map(item => replacePlaceholders(item, replacements))
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replacePlaceholders(v, replacements)])
    )
  }
  return obj
}
