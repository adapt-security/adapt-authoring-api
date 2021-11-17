/**
 * Utilities for APIs
 */
export class AbstractApiUtils {
  /**
   * Converts HTTP methods to a corresponding 'action' for use in auth
   * @param {String} method The HTTP method
   * @return {String}
   */
  static httpMethodToAction(method) {
    switch(method.toLowerCase()) {
      case 'get':
        return 'read';
      case 'post':
      case 'put':
      case 'patch':
      case 'delete':
        return 'write';
      default:
        return '';
    }
  }
  /**
   * Converts HTTP methods to a corresponding database function
   * @param {String} method The HTTP method
   * @return {String}
   */
  static httpMethodToDBFunction(method) {
    switch(method.toLowerCase()) {
      case 'post': return 'insert';
      case 'get': return 'find';
      case 'put': return 'replace';
      case 'patch': return 'update';
      case 'delete': return 'delete';
      default: return '';
    }
  }
  /**
   * Generates a list of arguments to be passed to the MongoDBModule from a request object
   * @param {ClientRequest} req
   * @return {Array<*>}
   */
  static argsFromReq(req) {
    const opts = { schemaName: req.apiData.schemaName, collectionName: req.apiData.collectionName };
    switch(req.method) {
      case 'GET': case 'DELETE':
        return [req.apiData.query, opts];
      case 'POST':
        return [req.apiData.data, opts];
      case 'PUT': case 'PATCH':
        return [req.apiData.query, req.apiData.data, opts];
    }
  }
}
