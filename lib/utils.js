const { App } = require('adapt-authoring-core');

class Utils {
  /**
  * Calls the correcponsing DB function
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
  * Makes sure the input is in an expected format before calling the handler functions
  */
  static sanitiseInput(req, res, next) {
    console.log('sanitiseInput', req.params, req.query, req.body);
    next();
  }
  /**
  * Checks for obvious mistakes with the Class API definition
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
