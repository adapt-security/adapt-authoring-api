const { App, AbstractModule, Responder, Utils } = require('adapt-authoring-core');
const ApiUtils = require('./abstractApiUtils');
/**
* Abstract module for creating APIs
* @extends {AbstractModule}
*/
class AbstractApiModule extends AbstractModule {
  /** @override */
  constructor(...args) {
    super(...args);
    this._init();
  }
  /** @ignore */
  async _init() {
    await this.setValues();
    try {
      this.validateValues();
    } catch(e) {
      return this.log('error', e);
    }
    this.addMiddleware();
    await this.addRoutes();
    await this.init();
  }
  /**
  * Initialises the module. Any custom initialisation tasks you need to perform should go here.
  * @return {Promise}
  */
  async init() {
    this.setReady();
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
    /**
    * Default DB collection to store data to (can be overridden by individual handlers)
    * @type {String}
    */
    this.collectionName;
  }
  useDefaultRouteConfig() {
    this.routes = [
      {
        route: '/',
        handlers: {
          post: this.requestHandler()
        }
      },
      {
        route: '/:_id?',
        handlers: {
          get: this.requestHandler()
        }
      },
      {
        route: '/:_id',
        handlers: {
          put: this.requestHandler(),
          delete: this.requestHandler()
        }
      }
    ];
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
  addMiddleware() {
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
  * Middleware to handle a generic API request. Supports POST, GET, PUT and DELETE of items in the database.
  * @return {Function} Express middleware function
  */
  requestHandler() {
    return async (req, res, next) => {
      const r = new Responder(res);
      const Codes = Responder.StatusCodes;
      const method = req.method.toLowerCase();
      let data;
      try {
        const func = this[ApiUtils.httpMethodToDBFunction(method)].bind(this);
        if(!func) {
          const message = this.app.lang.t('error.methodnotsupported', { method });
          this.log('error', message);
          return r.error(message, Codes.Error.Missing);
        }
        const args = [this.collectionName];
        if(req.query) args.push(req.query);
        if(req.body) args.push(req.body);
        data = await func(...args);
      } catch(e) {
        return next(e);
      }
      // special case for when _id param is present
      if(Utils.isArray(data) && req.params._id) {
        if(!data.length) {
          const message = this.app.lang.t('error.itemnotfound', { type: req.dsquery.type });
          this.log('error', message);
          return r.error(message, Codes.Error.Missing);
        }
        data = data[0];
      }
      r.success(data, { statusCode: Codes.Success[method] });
    };
  }
  async validate(data) {
    if(!data) {
      throw new Error('Cannot validate, must provide data');
    }
    const validated = Object.assign({}, data);
    const jsonschema = await this.app.waitForModule('jsonschema');
    await jsonschema.validate(this.schemaName, validated);
    return validated;
  }
  async insert(collectionName, data) {
    const mongodb = await this.app.waitForModule('mongodb');
    await this.validate(data);
    return (await mongodb.insert(collectionName, data));
  }
  async find(collectionName, filter) {
    const mongodb = await this.app.waitForModule('mongodb');
    return (await mongodb.find(collectionName, filter));
  }
  async replace(filter, data) {
    const mongodb = await this.app.waitForModule('mongodb');
    await this.validate(data);
    return (await mongodb.replace(filter, data));
  }
  async delete(filter) {
    const mongodb = await this.app.waitForModule('mongodb');
    return (await mongodb.delete(filter));
  }
}

module.exports = AbstractApiModule;
