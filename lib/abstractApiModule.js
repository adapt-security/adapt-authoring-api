const _ = require('lodash');
const { AbstractModule, Hook, Responder } = require('adapt-authoring-core');
const ApiUtils = require('./abstractApiUtils');
/**
* Abstract module for creating APIs
* @extends {AbstractModule}
*/
class AbstractApiModule extends AbstractModule {
  /** @override */
  constructor(app, pkg, options = { autoInit: true }) {
    super(app, pkg);
    /**
    * Signifies that the module instance is an API module. Can be used by other modules for quick verification checks.
    * @type {Boolean}
    */
    this.isApiModule = true;
    /**
    * Hook invoked when a new API request is handled
    * @type {Hook}
    */
    this.requestHook = new Hook({ type: Hook.Types.Series, mutable: true });

    if(options.autoInit) this._init();
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
  /**
  * Sets values used to initialise the API
  * @return {Promise}
  */
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
    * Default DB collection to store data to (can be overridden by individual handlers)
    * @type {String}
    */
    this.collectionName;
  }
  /**
  * Uses default configuration for API routes
  * @example
  * POST /
  * GET /:_id?
  * PUT/DELETE  /:_id
  */
  useDefaultRouteConfig() {
    /** @ignore */ this.routes = [
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
      },
      {
        route: '/query',
        validate: false,
        handlers: {
          post: this.queryHandler()
        }
      }
    ];
  }
  /**
  * Checks required values have been set
  */
  validateValues() {
    if(!this.root && !this.router) {
      throw new Error(this.app.lang.t('error.norootorrouter'));
    }
    if(!this.routes) {
      throw new Error(this.app.lang.t('error.noroutes'));
    }
    if(!this.collectionName) {
      throw new Error(this.app.lang.t('error.nocollectionname'));
    }
  }
  async getSchema(schemaName) {
    return (await this.app.waitForModule('jsonschema')).getSchema(schemaName);
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
      /** @ignore */ this.router = server.api.createChildRouter(this.root);
    }
    this.routes.forEach(this.addRoute, this);
  }
  /**
  * Adds a single route definition
  * @param {Route} config
  */
  addRoute(config) {
    Object.entries(config.handlers).forEach(([method, handler]) => {
      const handlers = _.isArray(handler) ? [...handler] : [handler];
      config.handlers[method] = [
        ApiUtils.processRequestData.bind(this)(config),
        ApiUtils.callRequestHook.bind(this),
        this.validateMiddleware.bind(this),
        ...handlers
      ];
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
        const args = [req.apiData.collectionName];
        if(!_.isEqual(req.apiData.query, {})) args.push(req.apiData.query);
        if(req.hasBody) args.push(req.apiData.data);
        data = await func(...args);
      } catch(e) {
        return next(e);
      }
      // special case for when _id param is present
      if(_.isArray(data) && req.params._id) {
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
  queryHandler() {
    return async(req, res, next) => {
      try {
        const query = await this.validate(req.apiData.schema, req.body, {
          useDefaults: false,
          ignoreRequired: true
        });
        const results = await this.find(req.apiData.collectionName, query);
        new Responder(res).success(results, { statusCode: Responder.StatusCodes.Success.get });
      } catch(e) {
        next(e);
      }
    };
  }
  /**
  * Middleware to validate incoming requests
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  * @return {Promise}
  */
  async validateMiddleware(req, res, next) {
    if(req.apiData.config.validate === false || !req.apiData.schema) {
      return next();
    }
    const v = (data, lite = false) => {
      const opts = { useDefaults: !lite, ignoreRequired: lite };
      return this.validate(req.apiData.schema, data, opts);
    };
    const errors = [];
    if(req.hasQuery) {
      try {
        req.apiData.query = await v(req.apiData.query, true);
      } catch(e) {
        console.log(e);
        errors.push(`query: ${e.errors.join(', ')}`);
      }
    }
    if(req.hasBody) {
      try {
        req.apiData.data = await v(req.apiData.data);
      } catch(e) {
        errors.push(`body: ${e.errors.join(', ')}`);
      }
    }
    if(errors.length) {
      return next(new Error(`Request data validation failed: ${errors.join('. ')}`));
    }
    next();
  }
  /**
  * Validates data against a JSON schema
  * @param {Object} schema Schema to validate against
  * @param {Object} data Data to be validated
  * @param {Object} options
  * @return {Promise} Resolves with validated data
  */
  async validate(schema, data, options) {
    const jsonschema = await this.app.waitForModule('jsonschema');
    return jsonschema.validate(schema, data, options);
  }
  /**
  * Inserts a new document into the DB
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} data Data to be inserted into the DB
  * @return {Promise} Resolves with DB data
  */
  async insert(collectionName, data) {
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.insert(collectionName, data);
  }
  /**
  * Retrieves documents from the DB
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} filter Attributes to use to filter DB documents
  * @return {Promise} Resolves with DB data
  */
  async find(collectionName, filter) {
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.find(collectionName, filter);
  }
  /**
  * Replaces an existing document in the DB
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} filter Attributes to use to filter DB documents
  * @param {Object} data Data to be inserted into the DB
  * @return {Promise} Resolves with DB data
  */
  async replace(collectionName, filter, data) {
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.replace(collectionName, filter, data);
  }
  /**
  * Removes a single document from the DB
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} filter Attributes to use to filter DB documents
  * @return {Promise} Resolves with DB data
  */
  async delete(collectionName, filter) {
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.delete(collectionName, filter);
  }
}

module.exports = AbstractApiModule;
