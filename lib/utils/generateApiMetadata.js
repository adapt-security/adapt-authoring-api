/**
 * Generates REST API metadata and stores on route config
 * @param {AbstractApiModule} instance The current AbstractApiModule instance
 * @memberof api
 */
export function generateApiMetadata (instance) {
  const getData = isList => {
    const $ref = { $ref: `#/components/schemas/${instance.schemaName}` }
    return {
      description: `The ${instance.schemaName} data`,
      content: { 'application/json': { schema: isList ? { type: 'array', items: $ref } : $ref } }
    }
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
  ]
  const verbMap = {
    put: 'Replace',
    get: 'Retrieve',
    patch: 'Update',
    delete: 'Delete',
    post: 'Insert'
  }
  instance.routes.forEach(r => {
    r.meta = {}
    Object.keys(r.handlers).forEach(method => {
      let summary, parameters, requestBody, responses
      switch (r.route) {
        case '/':
          if (method === 'post') {
            summary = `${verbMap.post} a new ${instance.schemaName} document`
            requestBody = getData()
            responses = { 201: getData() }
          } else {
            summary = `${verbMap.get} all ${instance.collectionName} documents`
            parameters = queryParams
            responses = { 200: getData(true) }
          }
          break

        case '/:_id':
          summary = `${verbMap[method]} an existing ${instance.schemaName} document`
          requestBody = method === 'put' || method === 'patch' ? getData() : method === 'delete' ? undefined : {}
          responses = { [method === 'delete' ? 204 : 200]: getData() }
          break

        case '/query':
          summary = `Query all ${instance.collectionName}`
          parameters = queryParams
          responses = { 200: getData(true) }
          break

        case '/schema':
          summary = `Retrieve ${instance.schemaName} schema`
          break
      }
      r.meta[method] = { summary, parameters, requestBody, responses }
    })
  })
}
