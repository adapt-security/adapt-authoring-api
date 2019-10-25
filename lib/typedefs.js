/**
* This file exists to define the below types for documentation purposes.
*/
/**
* Defines an entire API endpoint
* @typedef {Object} ApiDefinition
* @property {String} name The name of the api (this will be used as the API endpoint)
* @property {String} model The name MongoDB model to be used for CRUD operations
* @property {Array< MongoDBModel>} [schemas] Any schemas to add to the database
* @property {Array<Function>} [middleware] Middleware to be called prior to any requests to the API
* @property {Array<Route>} routes The list of routes exposed by the API. To use the default functionality, an array of strings can be specified here instead (e.g. ['post','get','put','delete']). **If no routes are defined here, no routes will be handled by the router.**
* @example
* {
*   name: 'helloworld',
*   model: 'hello',
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
