/**
 * Generates a list of arguments to be passed to the MongoDBModule from a request object
 * @param {external:ExpressRequest} req
 * @return {Array<*>}
 * @memberof api
 */
export function argsFromReq (req) {
  const opts = { schemaName: req.apiData.schemaName, collectionName: req.apiData.collectionName }
  switch (req.method) {
    case 'GET': case 'DELETE':
      return [req.apiData.query, opts]
    case 'POST':
      return [req.apiData.data, opts]
    case 'PUT': case 'PATCH':
      return [req.apiData.query, req.apiData.data, opts]
  }
}
