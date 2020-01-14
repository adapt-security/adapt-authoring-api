const { App, DataQuery, Utils } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class AbstractApiUtils {
  /**
  * Express middleware which correctly formats incoming request data
  * @return {Function} Middleware function
  */
  static processRequestData() {
    return (req, res, next) => {
      req.type = this.constructor.def.schema;
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
  * Calls a function on the DB module (infers function to call from the request data)
  * @param {ClientRequest} req
  * @return {Promise}
  */
  static async callDbFunction(req) {
    if(!req.type) {
      throw formatError('dbfail', 'notype', {}, 400);
    }
    const mdb = await App.instance.waitForModule('mongodb');
    const funcName = this.httpMethodToDBFunction(req.method);

    if(!mdb[funcName]) {
      throw formatError('dbfail', 'nodbfunc', { method: req.method }, 400);
    }
    const args = [];

    if(req.dsquery) args.push(req.dsquery);
    if(req.hasBody) args.push(req.body);

    return (await mdb[funcName](...args));
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
