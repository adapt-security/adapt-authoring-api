/**
* This file exists to define the below types for documentation purposes.
*/
/**
* Defines an entire API endpoint
* @typedef {Object} ApiDefinition
* @property {String} name The name of the api (this will be used as the API endpoint)
* @property {String} schema The name of the schema to be used for CRUD operations
* @property {Array<Function>} [middleware] Middleware to be called prior to any requests to the API
* @property {Array<Route>} routes The list of routes exposed by the API. **If no routes are defined here, no routes will be handled by the router.**
* @example
* {
*   name: 'helloworld',
*   schema: 'hello',
*   collection: 'hellos',
*   middleware: [ helloworldMiddleware ]
*   routes: [
*     {
*       route: '/:id?',
*       handlers: {
*         get: [beforeGet, getRequest, afterGet],
*         put: putRequest
*       }
*     },
*     {
*       route: '/foo',
*       schema: 'foo'
*       collections: 'foos'
*       handlers: { get: (req, res, next) => res.end() }
*     }
*   ]
* }
*/
