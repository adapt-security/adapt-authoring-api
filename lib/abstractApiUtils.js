const { App } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class AbstractApiUtils {
  /**
  * Express middleware which correctly formats incoming request data
  * @return {Function} Middleware function
  */
  static processRequestData(configData) {
    return (req, res, next) => {
      const schema = configData.schemaName || this.schemaName;
      const collection = configData.collectionName || this.collectionName;
      if(!schema) {
        return next(formatError('noschema'));
      }
      if(!collection) {
        return next(formatError('nocollection'));
      }
      req.apiData = { schema, collection };
      next();
    };
  }
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
}
/** @ignore */
function formatError(key, message, messageArg, statusCode = 500) {
  const t = App.instance.lang.t.bind(App.instance.lang);
  const msg = t(`error.${key}`);
  if(message) {
    msg += t(`error.${message}`, messageArg);
  }
  const e = new Error(msg);
  e.statusCode = statusCode;
  return e;
}

module.exports = AbstractApiUtils;
