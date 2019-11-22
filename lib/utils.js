const { App, Responder, Utils } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class ApiUtils {
  /**
  * Calls the specified function on the DB module
  * @param {String} funcName Name of function to call
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static callDbFunction(funcName, req, res, next) {
    if(!req.type) {
      return next(formatError('dbcallfail', 'notype'));
    }
    const r = new Responder(res);
    const args = [];

    if(req.dsquery) args.push(req.dsquery);
    if(req.body) args.push(req.body);

    App.instance.getModule('mongodb')[funcName](...args)
      .then(data => {
        const statusCode = Responder.StatusCodes.Success[req.method.toLowerCase()];
        if(req.params._id) {
          if(data.length !== 1) {
            return r.error(formatError('dbcallfail', 'itemnotfound', { type: req.type }), { statusCode: 404 });
          }
          return r.success(data[0], { statusCode });
        }
        r.success(data, { statusCode });
      })
      .catch(next);
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
  * Converts HTTP methods to a corresponding DataStore function
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
