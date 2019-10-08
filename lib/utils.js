const { App, DataStoreQuery, Responder } = require('adapt-authoring-core');
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
      return next(new Error(t('notype')));
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
            return r.error(new Error(t('error.itemnotfound', { type: req.type })), { statusCode: 404 });
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
  * Checks for obvious mistakes with the Class API definition
  * @param {ApiDefinition} def The definition to validate
  * @throw {Error}
  */
  static validateSchemaDef(def) {
    if(typeof def !== 'object') {
      throw new Error(t('notobject', { def: typeof def }));
    }
    if(!def.name) {
      throw new Error(t('noname'));
    }
    if(!def.routes) {
      throw new Error(t('noroutes'));
    }
    if(!def.model) {
      throw new Error(t('nomodel'));
    }
  }
}
/** @ignore */
function t(...args) {
  return App.instance.lang.t(...args);
}

module.exports = ApiUtils;
