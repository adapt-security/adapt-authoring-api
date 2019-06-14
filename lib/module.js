const { Module, Utils } = require('adapt-authoring-core');
const controller = require('./controller');
const apiUtils = require('./utils');
/**
* Abstract module for API creation
* @extends {Module}
*/
class Api extends Module {
  /**
  * API definition
  * @type {Object}
  */
  static get def() {
    throw new Error('Should be overridden in subclasses');
  }
  /**
  * Default controller, can be used for standard CRUD actions
  * @type {ApiController}
  */
  static get controller() {
    return controller;
  }
  /**
  * @throws {Error}
  */
  constructor(...args) {
    super(...args);

    apiUtils.validateSchemaDef(this.constructor.def);
    /**
    * The Express router instance
    * @type {express~Router}
    */
    this.router = {};
  }
  /** @override */
  preload(app, resolve, reject) {
    const router = this.app.getModule('server').api.createChildRouter(this.constructor.def.name);
    Utils.defineGetter(this, 'router', router);

    this.initMiddleware();
    this.initRoutes();

    resolve();
  }
  /** @override */
  boot(app, resolve, reject) {
    const db = this.app.getModule('mongodb');

    if(db.isConnected) {
      this.initSchemas(resolve);
    }
    else {
      db.on('boot', () => this.initSchemas(resolve));
    }
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
    this.router.addMiddleware(this.sanitiseInput);

    if(!this.constructor.def.middleware) {
      return;
    }
    this.router.addMiddleware(...this.constructor.def.middleware);
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

module.exports = Api;
