const { App, DataStoreQuery, Responder } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class Utils {
  static setQueryType(def) {
    return (req, res, next) => {
      if(req.dsquery && !req.dsquery.type) {
        req.dsquery.type = def.model;
      }
      next();
    };
  }
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
        r.success({ statusCode, data });
      })
      .catch(next);
  }
  /**
  * Checks for obvious mistakes with the Class API definition
  * @param {Object} def The definition to validate
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
  App.instance.lang.t(...args);
}

module.exports = Utils;
