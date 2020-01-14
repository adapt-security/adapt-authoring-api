const { App, AbstractModule, Responder, Utils } = require('adapt-authoring-core');
const ApiUtils = require('./abstractApiUtils');
/**
* Abstract module for creating APIs
* @extends {AbstractModule}
*/
class AbstractApiModule extends AbstractModule {
  /**
  * Middleware to handle a generic API request. Supports POST, GET, PUT and DELETE of items in the database.
  * @return {Function} Express middleware function
  */
  static requestHandler() {
    return (req, res, next) => {
      const r = new Responder(res);
      const successOpts = { statusCode: Responder.StatusCodes.Success[req.method.toLowerCase()] };
      ApiUtils.callDbFunction(req)
        .then(data => {
          if(!data) return r.success(undefined, successOpts);
          r.success(req.params._id ? data[0] : data, successOpts);
        })
        .catch(next);
    };
  }
  /** @override */
  constructor(...args) {
    super(...args);
    (async () => {
      await this.setValues();
      try {
        this.validateValues();
      } catch(e) {
        return this.log('error', e);
      }
      await this.init();

      this.addMiddleware();
      this.addRoutes();
    })();
  }
  async setValues() {
    /**
    * Name of the API module
    * @type {String}
    */
    this.root;
    /**
    * The Router instance used for HTTP requests
    * @type {Router}
    */
    this.router;
    /**
    * Middleware to be added to the API router
    * @type {Array}
    */
    this.middleware;
    /**
    * Routes to be added to the API router
    * @type {Array}
    */
    this.routes;
    /**
    * Default schema to validate request data against (can be overridden by individual handlers)
    * @type {String}
    */
    this.schemaName;
  }
  validateValues() {
    if(!this.root && !this.router) {
      throw new Error(this.app.lang.t('error.norootorrouter'));
    }
    if(!this.routes) {
      throw new Error(this.app.lang.t('error.noroutes'));
    }
  }
  /**
  * Adds any defined middleware
  * @return {Promise}
  */
  async addMiddleware() {
    if(this.middleware && this.middleware.length) {
      this.router.addMiddleware(...this.middleware);
    }
  }
  /**
  * Adds any defined routes
  * @return {Promise}
  */
  async addRoutes() {
    if(!this.router) {
      const server = await this.app.waitForModule('server');
      this.router = server.api.createChildRouter(this.root);
    }
    this.routes.forEach(this.addRoute, this);
  }
  addRoute(config) {
    Object.entries(config.handlers).forEach(([method, handler]) => {
      const handlers = Utils.isArray(handler) ? [...handler] : [handler];
      config.handlers[method] = [ApiUtils.processRequestData.bind(this)(config), ...handlers];
    }, {});
    this.router.addRoute(config);
  }
  /**
  * Initialise the module
  * @return {Promise}
  */
  async init() {
    this.setReady();
  }
}

module.exports = AbstractApiModule;
