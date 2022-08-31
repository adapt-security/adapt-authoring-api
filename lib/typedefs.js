/**
 * This file exists to define the below types for documentation purposes.
 */
/**
 * Extends Route definition with additional API-specific attributes
 * @typedef {Object} ApiRequestData
 * @property {Object} config The API route's config data. Set when the route is initialised.
 * @property {String} collectionName The DB collection name
 * @property {Object} data The request body data
 * @property {Object} query The request query data
 * @property {String} schemaName The schema name for data validation
 * @property {Boolean} modifying Whether the request modifies data
 * @see {Route}
 */
/**
 * Extends Route definition with additional API-specific attributes
 * @typedef {Object} ApiRoute
 * @property {Boolean} modifying Whether the route modifies data
 * @property {Boolean} validate When the request data should be validated
 * @see {Route}
 */
