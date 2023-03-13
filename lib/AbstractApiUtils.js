/**
 * Utilities for APIs
 * @memberof api
 */
class AbstractApiUtils {
  /**
   * Converts HTTP methods to a corresponding 'action' for use in auth
   * @param {String} method The HTTP method
   * @return {String}
   */
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
   * Converts HTTP methods to a corresponding database function
   * @param {String} method The HTTP method
   * @return {String}
   */
  static httpMethodToDBFunction(method) {
    switch(method.toLowerCase()) {
      case 'post': return 'insert';
      case 'get': return 'find';
      case 'put': case 'patch': return 'update';
      case 'delete': return 'delete';
      default: return '';
    }
  }
  /**
   * Generates a list of arguments to be passed to the MongoDBModule from a request object
   * @param {external:ExpressRequest} req
   * @return {Array<*>}
   */
  static argsFromReq(req) {
    const opts = { schemaName: req.apiData.schemaName, collectionName: req.apiData.collectionName };
    switch(req.method) {
      case 'GET': case 'DELETE':
        return [req.apiData.query, opts];
      case 'POST':
        return [req.apiData.data, opts];
      case 'PUT': case 'PATCH':
        return [req.apiData.query, req.apiData.data, opts];
    }
  }
  /**
   * Generates REST API metadata and stores on route config
   * @param {AbstractApiModule} instance The current AbstractApiModule instance
   */
  static generateApiMetadata(instance) {
    const getData = isList => {
      const $ref = { $ref: `#/components/schemas/${instance.schemaName}` };
      return {
        description: `The ${instance.schemaName} data`,
        content: { "application/json": { schema: isList ? { type: "array", items: $ref } : $ref } }
      };
    }
    const queryParams = [
      { 
        name: 'limit', 
        in: 'query', 
        description: `How many results should be returned Default value is ${instance.app.config.get('adapt-authoring-api.defaultPageSize')} (max value is ${instance.app.config.get('adapt-authoring-api.maxPageSize')})` 
      }, 
      {
        name: 'page', 
        in: 'query', 
        description: 'The page of results to return (determined from the limit value)' 
      }
    ];
    const verbMap = { 
      put: 'Replace',
      get: 'Retrieve',
      patch: 'Update',
      delete: 'Delete',
      post: 'Insert'
    };
    instance.routes.forEach(r => {
      r.meta = {};
      Object.keys(r.handlers).forEach(method => {
        let summary,  parameters, requestBody, responses;
        switch(r.route) {
          case '/':
            if(method === 'post') {
              summary = `${verbMap.post} a new ${instance.schemaName} document`;
              requestBody = getData();
              responses = { 201: getData() };
            } else {
              summary = `${verbMap.get} all ${instance.collectionName} documents`;
              parameters = queryParams;
              responses = { 200:  getData(true) };
            }
            break;

          case '/:_id':
            summary = `${verbMap[method]} an existing ${instance.schemaName} document`;
            requestBody = method === 'put' || method === 'patch' ? getData() : {};
            responses = { [method === 'delete' ? 204 : 200]: getData() };
            break;

          case '/query':
            summary = `Query all ${instance.collectionName}`;
            parameters = queryParams;
            responses = { 200: getData(true) };
            break;

          case '/schema':
            summary = `Retrieve ${instance.schemaName} schema`;
            break;
        }
        r.meta[method] = { summary, parameters, requestBody, responses };
      });
    });
  }
  /**
   * Clones an object and converts any Dates and ObjectIds to Strings
   * @param {Object} data 
   * @returns A clone object with stringified ObjectIds
   */
  static stringifyValues(data) {
    return Object.entries(data).reduce((cloned, [key, val]) => {
      const type = val?.constructor?.name;
      cloned[key] =
        type === 'Date' || type === 'ObjectId' ? val.toString() :
        type === 'Array' || type === 'Object' ? this.stringifyValues(val) :
        val;
      return cloned;
    }, Array.isArray(data) ? [] : {});
  }
}

export default AbstractApiUtils;