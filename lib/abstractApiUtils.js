const { App, DataQuery, Utils } = require('adapt-authoring-core');
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
      const schema = this.schema || configData.schema;
      if(!schema) {
        return next(formatError('noschema'));
      }
      req.type = schema;
      if(req.method === 'GET' || req.hasQuery || req.hasParams) {
        req.dsquery = new DataQuery({
          type: req.type,
          fieldsMatching: { ...Utils.trimUndefinedValues(req.params), ...req.query }
        });
      } else if(req.body && !req.dsquery) {
        req.body.type = req.type;
      }
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
        return 'create';
      case 'get':
        return 'retrieve';
      case 'put':
      case 'patch':
        return 'update';
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
