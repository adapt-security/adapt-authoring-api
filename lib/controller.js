const { Responder } = require('adapt-authoring-core');
const controller = require('./controller');
const utils = require('./utils');
/**
* A generic controller for API CRUD tasks
*/
class ApiController {
  /**
  * Handles incoming post requests
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static post(req, res, next) {
    utils.callDbFunction('create', req, res);
  }
  /**
  * Handles incoming get requests
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static get(req, res, next) {
    utils.callDbFunction('retrieve', req, res);
  }
  /**
  * Handles incoming put requests
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static put(req, res, next) {
    utils.callDbFunction('update', req, res);
  }
  /**
  * Handles incoming delet requests
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static delete(req, res, next) {
    utils.callDbFunction('delete', req, res);
  }
}

module.exports = ApiController;
