/**
 * Converts HTTP methods to a corresponding 'action' for use in auth
 * @param {String} method The HTTP method
 * @return {String}
 * @memberof api
 */
export function httpMethodToAction (method) {
  switch (method.toLowerCase()) {
    case 'get':
      return 'read'
    case 'post':
    case 'put':
    case 'patch':
    case 'delete':
      return 'write'
    default:
      return ''
  }
}
