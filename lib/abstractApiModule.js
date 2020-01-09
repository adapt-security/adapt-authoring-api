const { App, AbstractModule, Responder, Utils } = require('adapt-authoring-core');
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

    this.init();
  }
  /**
  *
  */
  async init() {
    try {
      ApiUtils.validateSchemaDef(this.constructor.def);
    } catch(e) {
      return this.log('error', e);
    }
    /**
    * Router instance
    * @type {Router}
    */
    this.router = await this.createRouter();

    if(this.constructor.def.middleware) {
      this.router.addMiddleware(...this.constructor.def.middleware);
    }
    this.initRoutes();

    this.setReady();
  }
  async createRouter() {
    const server = await this.app.waitForModule('server');
    return server.api.createChildRouter(this.constructor.def.name);
  }
  /**
  * Initialises routes
  */
  async initRoutes() {
    const middleware = [ApiUtils.processRequestData.bind(this)()];

    this.constructor.def.routes.forEach(r => {
      if(Array.isArray(r.handlers)) {
        r.handlers = r.handlers.reduce((hs, h) => {
          hs[h] = this.constructor.requestHandler();
          return hs;
        }, {});
      };
      Object.keys(r.handlers).forEach((k) => {
        const handlers = Utils.isArray(r.handlers[k]) ? [...r.handlers[k]] : [r.handlers[k]];
        r.handlers[k] = [...middleware, ...handlers];
      }, {});
      if(!r.scopes) {
        r.scopes = {};
      }
      Object.entries(r.handlers).forEach(([m,h]) => {
        if(!r.scopes[m]) r.scopes[m] = [`${ApiUtils.httpMethodToAction(m)}:${this.constructor.def.name}`];
      });
      this.router.addRoute(r);
    });
  }
}

module.exports = AbstractApiModule;
