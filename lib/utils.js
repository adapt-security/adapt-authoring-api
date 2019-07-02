const { App, DataStoreQuery, Responder } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class Utils {
  /**
  * Calls the specified function on the DB module
  * @param {Api} c The JavasScript class
  * @return {String} The model name
  */
  static inferModel(c) {
    if(c.def.model) {
      return c.def.model;
    }
    if(c.def.schemas && c.def.schemas.length === 1) {
      return c.def.schemas[0].name;
    }
  }
  /**
  * Calls the specified function on the DB module
  * @param {String} funcName Name of function to call
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  */
  static callDbFunction(funcName, req, res, next) {
    try {
      this.sanitiseInput(req, res);
    } catch(e) {
      return next(e);
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
  * Middleware to make sure the input is in an expected format before calling the handler functions
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static sanitiseInput(req, res, next) {
    if(!req.type) {
      throw new Error('Type must be specified');
    }
    ['body', 'params', 'query'].forEach(attr => {
      const entries = Object.entries(req[attr]);
      let deleted = 0;
      if(entries.length === 0) {
        req[attr] = null;
        return;
      }
      entries.forEach(([key, val]) => {
        if(val === undefined || val === null) {
          delete req[attr][key];
          deleted++;
        };
      });
      if(deleted === entries.length) req[attr] = null;
    });
    if(req.method === 'GET' || req.query || req.params) {
      req.dsquery = new DataStoreQuery({
        type: req.type,
        fieldsMatching: Object.assign({}, req.params, req.query)
      });
    }
    if(req.body && !req.dsquery) {
      req.body.type = req.type;
    }
    if(typeof next === 'function') {
      next();
    }
  }
  /**
  * Checks for obvious mistakes with the Class API definition
  * @param {Object} def The definition to validate
  * @throw {Error}
  */
  static validateSchemaDef(def) {
    if(typeof def !== 'object') {
      throw new Error(`def must return object, not ${typeof def}`);
    }
    if(!def.name) {
      throw new Error('must specify name in def');
    }
    if(!def.routes) {
      throw new Error('must specify routes in def');
    }
  }
}

module.exports = Utils;
