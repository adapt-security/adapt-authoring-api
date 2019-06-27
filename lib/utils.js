const { App } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class Utils {
  /**
  * Calls the specified function on the DB module
  * @param {String} funcName Name of function to call
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  */
  static callDbFunction(funcName, req, res) {
    console.log('callDbFunction:', funcName.toUpperCase());
    res.json({
      route: req.originalUrl,
      method: funcName,
      data: {
        body: req.body,
        params: req.params,
        query: req.query
      }
    });
    /*
    const args = [];
    if(query) {
      args.push(query);
    }
    if(data) {
      args.push(data);
    }
    App.instance.getModule('mongodb')[funcName](...args)
      .then(d => {
        new Responder(res).success();
      })
      .catch(e => {
        new Responder(res).error();
      });
    */
  }
  /**
  * Middleware to make sure the input is in an expected format before calling the handler functions
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static sanitiseInput(req, res, next) {
    ['body', 'params', 'query'].forEach(attr => {
      const entries = Object.entries(req[attr]);
      if(entries.length === 0) {
        req[attr] = null;
        return;
      }
      entries.forEach(([key, val]) => {
        if(val === undefined || val === null) delete req[attr][key];
      });
    });
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
