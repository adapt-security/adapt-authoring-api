/**
 * This file exists to define the below types for documentation purposes.
 */
/**
 * For AbstractApiModule subclasses the Express ClientRequest object is given an extra apiData property which contains useful data related to the incoming request.
 * Extends Route definition with additional API-specific attributes
 * @typedef {Object} ApiRequestData
 * @property {Object} config The API route's config data. Set when the route is initialised.
 * @property {String} collectionName The DB collection name
 * @property {Object} data The request body data
 * @property {Object} query The request query data
 * @property {String} schemaName The schema name for data validation
 * @property {Boolean} modifying Whether the request modifies data
 * @see {ApiRoute}
 */
/**
 * Extends the existing Route definition with additional API-specific attributes
 * @typedef {Route} ApiRoute
 * @extends {Route}
 * @property {Array<string>} modifiers Defines which HTTP methods should modify data. This only needs do be defined for routes which modify data (default is non-modifying)
 * @property {Boolean} validate Whether the request data should be validated
 * @property {Object} permissions Definition of permissions allowed required to access each handler
 * @property {Array<string>} [permissions.post] POST handlers for the route
 * @property {Array<string>} [permissions.get] GET handlers for the route
 * @property {Array<string>} [permissions.put] PUT handlers for the route
 * @property {Array<string>} [permissions.delete] DELETE handlers for the route
 * @example
 * {
 *    route: '/',
 *    handlers: { post: postHandler },
 *    permissions: { post: ['write:scope'] }
 *    modifiers: ['post'],
 * }
 */
/**
 * @typedef {Object} InsertOptions
 * @property {String} schemaName Name of the schema to validate against
 * @property {String} collectionName DB collection to insert document into
 * @property {String} validate Whether the incoming data should be validated
 * @property {String} invokePostHook Whether the function should invoke the 'post' action hook on success
 */
/**
 * @typedef {Object} FindOptions
 * @property {String} schemaName Name of the schema to validate against
 * @property {String} collectionName DB collection to insert document into
 */
/**
 * @typedef {Object} UpdateOptions
 * @property {String} schemaName Name of the schema to validate against
 * @property {String} collectionName DB collection to insert document into
 * @property {Boolean} validate Whether the incoming data should be validated
 * @property {String} invokePostHook Whether the function should invoke the 'post' action hook on success
 * @property {Boolean} rawUpdate Whether the provided data should be considered 'raw' (i.e. not format and apply $set MongoDB keyword)
 */
/**
 * @typedef {Object} DeleteOptions
 * @property {String} collectionName DB collection to remove document from
 * @property {String} invokePostHook Whether the function should invoke the 'post' action hook on success
 */