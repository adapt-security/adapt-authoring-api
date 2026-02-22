/**
 * Converts HTTP methods to a corresponding database function
 * @param {String} method The HTTP method
 * @return {String}
 * @memberof api
 */
export function httpMethodToDBFunction (method) {
  switch (method.toLowerCase()) {
    case 'post': return 'insert'
    case 'get': return 'find'
    case 'put': case 'patch': return 'update'
    case 'delete': return 'delete'
    default: return ''
  }
}
