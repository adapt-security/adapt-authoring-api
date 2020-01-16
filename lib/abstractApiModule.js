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
    return async (req, res, next) => {
      const Codes = Responder.StatusCodes;
      const method = req.method.toLowerCase();
      let data;
      try {
        const funcName = ApiUtils.httpMethodToDBFunction(method);
        data = await ApiUtils.callDbFunction(funcName, req.dsquery, req.body);
      } catch(e) {
        return next(e);
      }
      const r = new Responder(res);
      // special case for when _id param is present
      if(Utils.isArray(data) && req.params._id) {
        if(!data.length) {
          const message = App.instance.lang.t('error.itemnotfound', { type: req.dsquery.type });
          return r.error(message, Codes.Error.Missing);
        }
        data = data[0];
      }
      r.success(data, { statusCode: Codes.Success[method] });
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
