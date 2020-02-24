const _ = require('lodash');
const { App } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class AbstractApiUtils {
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
      case 'post':
        return 'insert';
      case 'get':
        return 'find';
      case 'put':
      case 'patch':
        return 'replace';
      case 'delete':
        return 'delete';
      default:
        return '';
    }
  }
  /**
  * Generates a list of arguments to be passed to the MongoDBModule from a request object
  * @param {ClientRequest} req
  * @return {Array<*>}
  */
  static argsFromReq(req) {
    const args = [req.apiData.collectionName];
    if(!_.isEqual(req.apiData.query, {})) args.push(req.apiData.query);
    if(req.hasBody) args.push(req.apiData.data);
    return args;
  }
}

module.exports = AbstractApiUtils;
