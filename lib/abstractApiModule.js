const _ = require('lodash');
const { AbstractModule, Hook } = require('adapt-authoring-core');
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
    * @type {Array<ApiRoute>}
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
        modifying: true,
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
        modifying: true,
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
  /**
  * Retrieves a schema by name
  * @param {String} schemaName
  * @return {Object}
  */
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
        this.processRequestMiddleware(config),
        async (req, res, next) => this.requestHook.invoke(req).then(() => next()),
        ...handlers
      ];
    }, {});
    this.router.addRoute(config);
  }
  /**
  * Express middleware which correctly formats incoming request data
  * @param {Route} config Route config data
  * @return {Function} Middleware function
  */
  processRequestMiddleware(config) {
    return (req, res, next) => {
      const collectionName = config.collectionName || this.collectionName;
      if(!collectionName) {
        return next(new Error(this.app.lang.t('error.nocollection')));
      }
      const data = req.body;
      const query = { ...req.query, ...req.params };
      const schemaName = config.schemaName || this.schemaName;
      req.apiData = {
        config,
        collectionName,
        data,
        query,
        schemaName
      };
      next();
    };
  }
  /**
  * Validates data
  * @param {String} schemaName Name of the schema to validate against
  * @param {Object} data Data to validate
  * @param {Boolean} strictMode If set to true, this function will throw errors on missing required values, and fill in any missing defaults
  */
  async validate(schemaName, data, strictMode = true) {
    const jsonschema = await this.app.waitForModule('jsonschema');
    const schema = await this.getSchema(schemaName);
    return jsonschema.validate(schema, data, { useDefaults: strictMode, ignoreRequired: !strictMode });
  }
  /**
  * Middleware to handle a generic API request. Supports POST, GET, PUT and DELETE of items in the database.
  * @return {Function} Express middleware function
  */
  requestHandler() {
    return async (req, res, next) => {
      const method = req.method.toLowerCase();
      const func = this[ApiUtils.httpMethodToDBFunction(method)];
      if(!func) {
        const message = this.app.lang.t('error.methodnotsupported', { method });
        this.log('error', message);
        return res.sendError(res.StatusCodes.Error.Missing, message);
      }
      let data;
      try {
        data = await func.apply(this, ApiUtils.argsFromReq(req));
      } catch(e) {
        return next(e);
      }
      if(!data) {
        return res.sendError(res.StatusCodes.Error.Missing, this.app.lang.t('error.itemnotfound'));
      }
      if(_.isArray(data) && req.params._id) { // special case for when _id param is present
        if(!data.length) {
          return res.sendError(res.StatusCodes.Error.Missing, this.app.lang.t('error.itemnotfound'));
        }
        data = data[0];
      }
      res.status(res.StatusCodes.Success[method]).json(data);
    };
  }
  /**
  * Express request handler for API queries
  * @return {function}
  */
  queryHandler() {
    return async(req, res, next) => {
      try {
        const results = await this.find(req.apiData.schema, req.apiData.collectionName, req.body);
        res.status(res.StatusCodes.Success.get).json(results);
      } catch(e) {
        next(e);
      }
    };
  }
  /**
  * Inserts a new document into the DB
  * @param {String} schemaName Name of the schema to validate against
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} data Data to be inserted into the DB
  * @return {Promise} Resolves with DB data
  */
  async insert(schemaName, collectionName, data) {
    await this.validate(schemaName, data);
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.insert(collectionName, data);
  }
  /**
  * Retrieves documents from the DB
  * @param {String} schemaName Name of the schema to validate against
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} filter Attributes to use to filter DB documents
  * @return {Promise} Resolves with DB data
  */
  async find(schemaName, collectionName, filter) {
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.find(collectionName, filter);
  }
  /**
  * Updates an existing document in the DB
  * @param {Object} schemaName Name of the schema to validate against
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} filter Attributes to use to filter DB documents
  * @param {Object} data Data to be inserted into the DB
  * @return {Promise} Resolves with DB data
  */
  async update(schemaName, collectionName, filter, data) {
    await this.validate(schemaName, data);
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.update(collectionName, filter, data);
  }
  /**
  * Replaces an existing document in the DB
  * @param {Object} schemaName Name of the schema to validate against
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} filter Attributes to use to filter DB documents
  * @param {Object} data Data to be inserted into the DB
  * @return {Promise} Resolves with DB data
  */
  async replace(schemaName, collectionName, filter, data) {
    await this.validate(schemaName, data);
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.replace(collectionName, filter, data);
  }
  /**
  * Removes a single document from the DB
  * @param {String} schemaName Name of the schema to validate against
  * @param {String} collectionName DB collection to insert document into
  * @param {Object} filter Attributes to use to filter DB documents
  * @return {Promise} Resolves with DB data
  */
  async delete(schemaName, collectionName, filter) {
    const mongodb = await this.app.waitForModule('mongodb');
    return mongodb.delete(collectionName, filter);
  }
}

module.exports = AbstractApiModule;
