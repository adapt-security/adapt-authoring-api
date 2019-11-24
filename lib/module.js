const { App, AbstractModule, DataStoreQuery, Responder, Utils } = require('adapt-authoring-core');
const ApiUtils = require('./utils');
/**
* Abstract module for creating APIs
* @extends {AbstractModule}
*/
class AbstractApiModule extends AbstractModule {
  /**
  * Object to define and configure the API
  * @type {ApiDefinition}
  */
  static get def() {
    throw new Error(App.instance.lang.t('error.defnotoverridden'));
  }
  /**
  * Express middleware which correctly formats incoming request data
  * @return {Function} Middleware function
  */
  static processRequestData() {
    return (req, res, next) => {
      req.type = this.def.model;
      if(req.method === 'GET' || req.hasQuery || req.hasParams) {
        req.dsquery = new DataStoreQuery({
          type: req.type,
          fieldsMatching: { ...req.params, ...req.query }
        });
      } else if(req.body && !req.dsquery) {
        req.body.type = req.type;
      }
      next();
    };
  }
  /**
  * Express middleware which correctly formats incoming request data
  * @return {Function} Middleware function
  */
  static validateRequestData() {
    return (req, res, next) => {
      if(req.headers['content-type'] !== 'application/json') {
        return next();
      }
      try {
        App.instance.getModule('jsonschema').validate(req.type, req.body);
        next();
      } catch(e) {
        e.statusCode = 400;
        next(e);
      }
    };
  }
  /**
  *
  */
  static requestHandler() {
    return (req, res, next) => {
      const r = new Responder(res);
      ApiUtils.callDbFunction(req)
        .then(data => r.success(data))
        .catch(e => r.error(e));
    };
  }
  /**
  * @throws {Error}
  */
  constructor(...args) {
    super(...args);
    /**
    * The Express router instance
    * @type {express~Router}
    */
    this.router = {};
  }
  /** @override */
  preload(app, resolve, reject) {
    try {
      ApiUtils.validateSchemaDef(this.constructor.def);
    } catch(e) {
      reject(e);
    }
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
  * Adds all schemas to the db
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
  * Adds middleware to the stack
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
    const middleware = [
      this.constructor.processRequestData(),
      this.constructor.validateRequestData()
    ];
    this.constructor.def.routes.forEach(r => {
      if(Array.isArray(r.handlers)) {
        r.handlers = r.handlers.reduce((hs, h) => {
          hs[h] = this.constructor.requestHandler();
          return hs;
        }, {});
      }
      Object.keys(r.handlers).forEach((k) => {
        r.handlers[k] = Utils.isArray(r.handlers[k]) ? [...middleware, ...r.handlers[k]] : [...middleware, r.handlers[k]];
      }, {});
      if(!r.scopes) {
        r.scopes = {};
      }
      Object.entries(r.handlers).forEach(([m,h]) => {
        if(!r.scopes[m]) r.scopes[m] = [`${ApiUtils.httpMethodToAction(m)}:${this.constructor.def.name}`];
      });
      Object.entries(r.scopes).forEach(([m,s]) => this.app.auth.secureRoute(`${this.router.path}${r.route}`, m, s));

      this.router.addRoute(r);
    });
  }
}

module.exports = AbstractApiModule;
