const { Module, Utils } = require('adapt-authoring-core');
const apiUtils = require('./utils');
/**
* Abstract module for API creation
* @extends {Module}
*/
class Api extends Module {
  /**
  * Object to define and configure the API
  * @type {ApiDefinition}
  */
  static get def() {
    throw new Error('Should be overridden in subclasses');
  }
  /**
  * Generic Express middleware for handling requests
  * @return {Function} Middleware function
  */
  static requestHandler() {
    return (req, res, next) => {
      req.type = this.def.model;
      if(req.dsquery && !req.dsquery.type) {
        req.dsquery.type = req.type;
      }
      const methodMap = {
        POST: 'create',
        GET: 'retrieve',
        PUT: 'update',
        DELETE: 'delete'
      };
      apiUtils.callDbFunction(methodMap[req.method], req, res, next);
    };
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
    /**
    * Router instance
    * @type {Router}
    */
    Utils.defineGetter(this, 'router', router);

    this.initMiddleware();
    this.initRoutes();

    resolve();
  }
  /** @override */
  boot(app, resolve, reject) {
    const db = this.app.getModule('mongodb');
    const _init = () => {
      this.initSchemas();
      resolve();
    };
    db.isConnected ? _init() : db.on('boot', _init);
  }
  /**
  * Initialises schemas
  */
  initSchemas() {
    if(!this.constructor.def.schemas) {
      return;
    }
    const _logError = (msg) => this.log('error', `${this.app.lang.t('error.addschema')}, ${msg}`);
    const db = this.app.getModule('mongodb');

    this.constructor.def.schemas.forEach(s => {
      if(!s.name) return _logError(this.app.lang.t('error.undefinedproperty', { prop: 'name' }));
      if(!s.definition) return _logError(this.app.lang.t('error.undefinedproperty', { prop: 'definition' }));
      db.addModel({ name: s.name, schema: s.definition });
    });
  }
  /**
  * Initialises middleware
  */
  initMiddleware() {
    if(this.constructor.def.middleware) {
      this.router.addMiddleware(...this.constructor.def.middleware);
    }
  }
  /**
  * Initialises routes
  */
  initRoutes() {
    this.constructor.def.routes.forEach(r => {
      if(Array.isArray(r.handlers)) {
        r.handlers = r.handlers.reduce((hs, h) => {
          hs[h] = this.constructor.requestHandler();
          return hs;
        }, {});
      }
      this.router.addRoute(r);
    });
  }
  /**
  * Handles any API-level errors
  */
  errorHandler(error, req, res, next) {
    this.log('error', `${this.app.lang.t('error.route', { url: req.url })}, ${error.message || error}`);
    if(error.stack) this.log('debug', error.stack);
    new Responder(res).error(error);
  }
}
/**
* @typedef {Object} ApiDefinition
* @property {String} name The name of the api (this will be used as the API endpoint)
* @property {Array<MongoModel>} [schemas] Any schemas to add to the database
* @property {Array<Function>} [middleware] Middleware to be called prior to any requests to the API
* @property {Array<ApiRoute>} routes The list of routes exposed by the API. **If no routes are defined here, no routes will be handled by the router.**
* @example
* {
*   name: 'helloworld',
*   schemas: [ HelloWorldSchema ],
*   middleware: [ helloworldMiddleware ]
*   routes: [
*     {
*       route: '/:id?',
*       handlers: {
*         get: [beforeGet, getRequest, afterGet]
*       }
*     }
*   ]
* }
*/
/**
* @typedef {Object} ApiRoute
* @property {String} route The name of the api (this will be used as the API endpoint)
* @property {Object|Array} handlers Object defining Express request handler functions. If an array is specified, the default handler will be used
* @property {Array<Function>|Function} [handlers.post] POST handlers for the route
* @property {Array<Function>|Function} [handlers.get] GET handlers for the route
* @property {Array<Function>|Function} [handlers.put] PUT handlers for the route
* @property {Array<Function>|Function} [handlers.delete] DELETE handlers for the route
* @example
* {
*   route: '/:id?',
*   handlers: {
*     get: [beforeGet, getRequest, afterGet]
*   }
* }
*/

module.exports = Api;
