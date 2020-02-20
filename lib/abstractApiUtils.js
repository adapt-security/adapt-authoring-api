const { App } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class AbstractApiUtils {
  /**
  * Express middleware which correctly formats incoming request data
  * @param {Route} config Route config data
  * @return {Function} Middleware function
  */
  static processRequestData(config) {
    return async (req, res, next) => {
      const collectionName = config.collectionName || this.collectionName;
      if(!collectionName) {
        return next(formatError('nocollection'));
      }
      const data = req.body;
      const query = { ...req.query, ...req.params };
      let schema;
      try {
        schema = await this.getSchema(query.type || data.type);
      } catch {} // no problem
      req.apiData = {
        config,
        collectionName,
        query,
        schema,
        data
      };
      next();
    };
  }
  static async callRequestHook(req, res, next) {
    await this.requestHook.invoke(req);
    next();
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
  let msg = t(`error.${key}`);
  if(message) {
    msg += t(`error.${message}`, messageArg);
  }
  const e = new Error(msg);
  e.statusCode = statusCode;
  return e;
}

module.exports = AbstractApiUtils;
