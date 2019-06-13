const { Module, Utils } = require('adapt-authoring-core');
/**
* Abstract module for API creation
* @extends {Module}
*/
class Api extends Module {
  /**
  * API definition
  * @type {APIDefinition}
  */
  static get def() {
    throw new Error('Should be overridden in subclasses');
  }
  /**
  *
  */
  constructor(...args) {
    super(...args);
    /**
    * The Express router instance
    * @type {express~Router}
    */
    this.router = {};
  }
  /**
  * @param {App} app App instance
  * @param {Function} resolve Function to call on fulfilment
  * @param {Function} reject Function to call on rejection
  */
  boot(app, resolve, reject) {
    this.init();
  }
  /**
  * Initialises the API
  */
  init() {
    const router = this.app.getModule('server').createRouter(this.constructor.def.name);
    Utils.defineGetter(this, 'router', router);

    this.initSchemas();
    this.initMiddleware();
    this.initRoutes();

    // router.use(this.errorHandler);
  }
  /**
  * Initialises schemas
  */
  initSchemas() {
    if(!this.constructor.def.schemas) {
      return;
    }
    const _logError = (msg) => this.log('error', `Failed to add database model, ${msg}`);
    const db = this.app.getModule('mongodb');
    this.constructor.def.schemas.forEach(s => {
      if(!s.name) return _logError(`Property 'name' must be defined`);
      if(!s.definition) return _logError(`Property 'definition' must be defined`);
      try {
        db.addModel({ name: s.name, schema: s.definition });
      } catch(e) {
        _logError(e);
      }
    });
  }
  /**
  * Initialises middleware
  */
  initMiddleware() {
    if(!this.constructor.def.middleware) {
      return;
    }
    this.router.use(...this.constructor.def.middleware);
  }
  /**
  * Initialises routes
  */
  initRoutes() {
    this.router.addRoute(...this.constructor.def.routes);
  }
  /**
  * Handles any API-level errors
  */
  errorHandler(error, req, res, next) {
    this.log('error', `API error from route '${req.url}', ${error.message || error}`);
    if(error.stack) this.log('debug', error.stack);
    new Responder(res).error(error);
  }
}

/**
* @typedef {Object} APIDefinition
* @property {String} name Name of the API
* @property {Array<Object>} routes Routes to be handled by the API
*/

module.exports = Api;
