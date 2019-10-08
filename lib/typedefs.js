/**
* This file exists to define the below types for documentation purposes.
*/
/**
* Defines an entire API endpoint
* @typedef {Object} ApiDefinition
* @property {String} name The name of the api (this will be used as the API endpoint)
* @property {Array< MongoDBModel>} [schemas] Any schemas to add to the database
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
* Defines how an individual API route should be handled
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
