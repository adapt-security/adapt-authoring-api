const { App, Responder } = require('adapt-authoring-core');
/**
* Reusable controller class for basic database CRUD actions
*/
class ApiController {
  /**
  * Handles incoming post requests
  * @param {http~ClientRequest} req
  * @param {http~ClientResponse} res
  * @param {Function} next
  */
  static post(req, res, next) {
    callDbFunction('create', req, res);
  }
  /**
  * Handles incoming get requests
  * @param {http~ClientRequest} req
  * @param {http~ClientResponse} res
  * @param {Function} next
  */
  static get(req, res, next) {
    callDbFunction('retrieve', req, res);
  }
  /**
  * Handles incoming put requests
  * @param {http~ClientRequest} req
  * @param {http~ClientResponse} res
  * @param {Function} next
  */
  static put(req, res, next) {
    callDbFunction('update', req, res);
  }
  /**
  * Handles incoming delet requests
  * @param {http~ClientRequest} req
  * @param {http~ClientResponse} res
  * @param {Function} next
  */
  static delete(req, res, next) {
    callDbFunction('delete', req, res);
  }
};
/**
* Calls the correcponsing DB function
*/
/** @ignore */
function callDbFunction(funcName, req, res) {
  console.log('callDbFunction:', funcName.toUpperCase(), req.params, req.query, req.body);
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

module.exports = ApiController;
