const { App, DataStoreQuery, Responder } = require('adapt-authoring-core');
/**
* Utilities for APIs
*/
class ApiUtils {
  /**
  * Calls the specified function on the DB module
  * @param {String} funcName Name of function to call
  * @param {ClientRequest} req
  * @param {ServerResponse} res
  * @param {Function} next
  */
  static callDbFunction(funcName, req, res, next) {
    if(!req.type) {
      return next(new Error(t('notype')));
    }
    const r = new Responder(res);
    const args = [];

    if(req.dsquery) args.push(req.dsquery);
    if(req.body) args.push(req.body);

    App.instance.getModule('mongodb')[funcName](...args)
      .then(data => {
        const statusCode = Responder.StatusCodes.Success[req.method.toLowerCase()];
        if(req.params._id) {
          if(data.length !== 1) {
            const e = new Error(t('notfound', { type: req.type }));
            e.statusCode = 404;
            return r.error(e);
          }
          return r.success({ statusCode, data: data[0] });
        }
        r.success({ statusCode, data });
      })
      .catch(next);
  }
  static httpMethodToAction(method) {
    switch(method.toLowerCase()) {
      case 'get':
        return 'read';
      case 'post':
      case 'put':
      case 'patch':
      case 'delete':
        return 'write';
      default:
        return '';
    }
  }
  /**
  * Checks for obvious mistakes with the Class API definition
  * @param {Object} def The definition to validate
  * @throw {Error}
  */
  static validateSchemaDef(def) {
    if(typeof def !== 'object') {
      throw new Error(t('notobject', { def: typeof def }));
    }
    if(!def.name) {
      throw new Error(t('noname'));
    }
    if(!def.routes) {
      throw new Error(t('noroutes'));
    }
    if(!def.model) {
      throw new Error(t('nomodel'));
    }
  }
}
/** @ignore */
function t(...args) {
  App.instance.lang.t(...args);
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

module.exports = ApiUtils;
