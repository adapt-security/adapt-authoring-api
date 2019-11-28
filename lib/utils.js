const { App, DataQuery, Responder, Utils } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class ApiUtils {
  /**
  * Express middleware which correctly formats incoming request data
  * @return {Function} Middleware function
  */
  static processRequestData() {
    return (req, res, next) => {
      req.type = this.constructor.def.model;
      if(req.method === 'GET' || req.hasQuery || req.hasParams) {
        req.dsquery = new DataQuery({
          type: req.type,
          fieldsMatching: { ...req.params, ...req.query }
        });
      } else if(req.body && !req.dsquery) {
        req.body.type = req.type;
      }
      next();
    };
  }
  static requestHandler() {
    return (req, res, next) => {
      const r = new Responder(res);
      const successOpts = { statusCode: Responder.StatusCodes.Success[req.method.toLowerCase()] };
      this.callDbFunction(req)
        .then(data => {
          if(!data) return r.success(undefined, successOpts);
          r.success(req.params._id ? data[0] : data, successOpts);
        })
        .catch(next);
    };
  }
  /**
  * Calls a function on the DB module (infers function to call from the request data)
  * @param {ClientRequest} req
  */
  static callDbFunction(req) {
    return new Promise((resolve, reject) => {
      if(!req.type) {
        return reject(formatError('dbfail', 'notype', {}, 400));
      }
      const mdb = App.instance.getModule('mongodb');
      const funcName = this.httpMethodToDBFunction(req.method);

      if(!mdb[funcName]) {
        return reject(formatError('dbfail', 'nodbfunc', { method: req.method }, 400));
      }
      const args = [];

      if(req.dsquery) args.push(req.dsquery);
      if(req.hasBody) args.push(req.body);

      mdb[funcName](...args).then(resolve).catch(reject);
    });
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
  /**
  * Checks for obvious mistakes with the Class API definition
  * @param {ApiDefinition} def The definition to validate
  * @throw {Error}
  */
  static validateSchemaDef(def) {
    if(!Utils.isObject(def)) {
      throw formatError('invalidschemadef', 'notobject', { def: typeof def });
    }
    if(!def.name) {
      throw formatError('invalidschemadef', 'noname');
    }
    if(!def.routes) {
      throw formatError('invalidschemadef', 'noroutes');
    }
    if(!def.model) {
      throw formatError('invalidschemadef', 'nomodel');
    }
  }
}
/** @ignore */
function formatError(type, message, messageArg, statusCode = 500) {
  const t = App.instance.lang.t;
  const e = new Error(`${t(`error.${type}`)}, ${t(`error.${message}`, messageArg)}`);
  e.statusCode = statusCode;
  return e;
}

module.exports = ApiUtils;
