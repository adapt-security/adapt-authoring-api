import _ from 'lodash'
import { AbstractModule, Hook, stringifyValues } from 'adapt-authoring-core'
import { argsFromReq, generateApiMetadata, httpMethodToDBFunction } from './utils.js'
import DataCache from './DataCache.js'
/**
 * Abstract module for creating APIs
 * @memberof api
 * @extends {AbstractModule}
 */
class AbstractApiModule extends AbstractModule {
  get DEFAULT_ROUTES () {
    const readPerms = [`read:${this.permissionsScope || this.root}`]
    const writePerms = [`write:${this.permissionsScope || this.root}`]
    const handler = this.requestHandler()
    return [
      {
        route: '/',
        handlers: { post: handler, get: this.queryHandler() },
        permissions: { post: writePerms, get: readPerms }
      },
      {
        route: '/schema',
        handlers: { get: this.serveSchema.bind(this) },
        permissions: { get: ['read:schema'] }
      },
      {
        route: '/:_id',
        handlers: { put: handler, get: handler, patch: handler, delete: handler },
        permissions: { put: writePerms, get: readPerms, patch: writePerms, delete: writePerms }
      },
      {
        route: '/query',
        validate: false,
        modifying: false,
        handlers: { post: this.queryHandler() },
        permissions: { post: readPerms }
      }
    ]
  }

  /**
   * Returns the 'OK' status code to match the HTTP method
   * @param {String} httpMethod
   * @return {Number} HTTP status code
   */
  mapStatusCode (httpMethod) {
    const map = {
      post: 201,
      get: 200,
      put: 200,
      patch: 200,
      delete: 204
    }
    return map[httpMethod]
  }

  /** @override */
  async init () {
    /**
     * Signifies that the module instance is an API module. Can be used by other modules for quick verification checks.
     * @type {Boolean}
     */
    this.isApiModule = true
    /**
     * Data cache which can be used to reduce DB calls
     */
    this.cache = new DataCache({
      enable: this.getConfig('enableCache'),
      lifespan: this.getConfig('cacheLifespan')
    })
    /**
     * Hook invoked when a new API request is handled
     * @type {Hook}
     */
    this.requestHook = new Hook({ mutable: true })
    /**
     * Hook invoked before data is inserted into the database
     * @type {Hook}
     */
    this.preInsertHook = new Hook({ mutable: true })
    /**
     * Hook invoked after data is inserted into the database
     * @type {Hook}
     */
    this.postInsertHook = new Hook()
    /**
     * Hook invoked before data is updated in the database
     * @type {Hook}
     */
    this.preUpdateHook = new Hook({ mutable: true })
    /**
     * Hook invoked after data is updated in the database
     * @type {Hook}
     */
    this.postUpdateHook = new Hook()
    /**
     * Hook invoked before data is deleted
     * @type {Hook}
     */
    this.preDeleteHook = new Hook()
    /**
     * Hook invoked after data is deleted
     * @type {Hook}
     */
    this.postDeleteHook = new Hook()
    /**
     * Hook invoked by DB wrapper functions to check access to individual data items
     * @type {Hook}
     */
    this.accessCheckHook = new Hook()

    await this.setValues()
    this.validateValues()
    await this.addRoutes()
  }

  /**
   * Sets values used to initialise the API
   * @return {Promise}
   */
  async setValues () {
    /**
     * Name of the API module
     * @type {String}
     */
    this.root = undefined
    /**
     * The Router instance used for HTTP requests
     * @type {Router}
     */
    this.router = undefined
    /**
     * Routes to be added to the API router
     * @type {Array<ApiRoute>}
     */
    this.routes = undefined
    /**
     * The scope to be used  (see AbstractApiModule#useDefaultRouteConfig)
     * @type {String}
     */
    this.permissionsScope = undefined
    /**
     * Default DB collection to store data to (can be overridden by individual handlers)
     * @type {String}
     */
    this.collectionName = undefined
    /**
     * Default schema to use for validation (can be overridden by individual handlers)
     * @type {String}
     */
    this.schemaName = undefined
  }

  /**
   * Takes an input options param and populates it with defaults
   * @param {Object} options
   */
  setDefaultOptions (options = {}) {
    _.defaults(options, {
      schemaName: this.schemaName,
      collectionName: this.collectionName,
      validate: true,
      invokePreHook: true,
      invokePostHook: true
    })
  }

  /**
   * Uses default configuration for API routes
   * @example
   * POST /
   * GET /:_id?
   * PUT/DELETE  /:_id
   */
  useDefaultRouteConfig () {
    if (!this.root) {
      return this.log('error', 'Must set API root before calling useDefaultConfig function')
    }
    /** @ignore */ this.routes = this.DEFAULT_ROUTES
    this.generateApiMetadata()
  }

  /**
   * Generates REST API metadata and stores on route config
   */
  generateApiMetadata () {
    generateApiMetadata(this)
  }

  /**
   * Checks required values have been set
   */
  validateValues () {
    if (!this.root && !this.router) {
      throw this.app.errors.NO_ROOT_OR_ROUTER_DEF
    }
    if (!this.routes) {
      throw this.app.errors.NO_ROUTES_DEF
    }
    if (!this.collectionName) {
      throw this.app.errors.NO_COLL_NAME
    }
  }

  /**
   * Adds any defined routes
   * @return {Promise}
   */
  async addRoutes () {
    if (!this.router) {
      const server = await this.app.waitForModule('server')
      /** @ignore */ this.router = server.api.createChildRouter(this.root)
    }
    const uniqueRoutes = {}
    this.routes.forEach(r => {
      if (uniqueRoutes[r.route]) {
        return this.log('warn', `duplicate route defined for path '${r.route}', first definition will be used`)
      }
      uniqueRoutes[r.route] = r
    })
    this.router.addHandlerMiddleware(
      this.processRequestMiddleware.bind(this),
      this.sanitiseRequestDataMiddleware.bind(this)
    )
    const auth = await this.app.waitForModule('auth')
    Object.values(uniqueRoutes).forEach(r => this.addRoute(r, auth))
  }

  /**
   * Adds a single route definition
   * @param {Route} config The route config
   * @param {AuthModule} auth Reference to the AuthModule instance to save await-ing
   */
  addRoute (config, auth) {
    Object.entries(config.handlers).forEach(([method, handler]) => {
      config.handlers[method] = Array.isArray(handler) ? [...handler] : [handler]
      const perms = config.permissions && config.permissions[method]
      if (perms) { // remove any trailing slashes first
        const route = config.route.endsWith('/') ? config.route.slice(0, -1) : config.route
        auth.secureRoute(this.router.path + route, method, perms)
      }
    }, {})
    this.router.addRoute(config)
  }

  /**
   * Derives the schema name from passed apiData
   * @param {Object} data Request data
   * @return {String} The schema name
   */
  async getSchemaName (data) {
    return this.schemaName
  }

  /**
   * Retrieves a schema by name
   * @param {String} schemaName
   * @param {Object} data Can be used when determining schema type
   * @return {Object}
   */
  async getSchema (schemaName, data) {
    return (await this.app.waitForModule('jsonschema')).getSchema(schemaName)
  }

  /**
   * Express request handler for serving the schema
   * @param {external:ExpressRequest} req
   * @param {external:ExpressResponse} res
   * @param {Function} next
   * @return {function}
   */
  async serveSchema (req, res, next) {
    try {
      const schema = await this.getSchema(req.apiData.schemaName, { ...req.apiData.query, ...req.apiData.data })
      if (!schema) {
        return next(this.app.errors.NO_SCHEMA_DEF)
      }
      res.type('application/schema+json').json(schema.built)
    } catch (e) {
      return next(e)
    }
  }

  /**
   * Validates data
   * @param {String} schemaName Name of the schema to validate against
   * @param {Object} data Data to validate
   * @param {Object} options
   */
  async validate (schemaName, data, options) {
    if (options.validate === false) {
      return data
    }
    const schema = await this.getSchema(schemaName, data)
    return schema.validate(data, options)
  }

  /**
   * Recursive sanitiser, see sanitiseItem
   * @param {string} schemaName Name of schema to sanitise against
   * @param {object} data Data to sanitise
   * @param {object} options see sanitiseItem
   * @return {Promise} Resolves with the sanitised data
   */
  async sanitise (schemaName, data, options) {
    const isArray = Array.isArray(data)
    const sanitised = await Promise.all((isArray ? data : [data]).map(async d => {
      const schema = await this.getSchema(schemaName, d)
      return schema.sanitise(d, options)
    }))
    return isArray ? sanitised : sanitised[0]
  }

  /**
   * Express middleware which correctly formats incoming request data and stores as req.apiData to be used by later handlers. See ApiRequestData typedef for full details.
   * @param {external:ExpressRequest} req
   * @param {external:ExpressResponse} res
   * @param {Function} next
   * @return {Function} Middleware function
   */
  async processRequestMiddleware (req, res, next) {
    const config = req.routeConfig
    const collectionName = config.collectionName || this.collectionName
    const modifiers = config?.modifiers ?? ['post', 'put', 'patch', 'delete']
    const modifying = config.modifying ?? modifiers.includes(req.method.toLowerCase())
    const data = _.cloneDeep(req.body)
    const query = Object.assign(_.cloneDeep(req.query), _.cloneDeep(req.params))
    const schemaName = await this.getSchemaName({ ...query, ...data })
    req.apiData = { collectionName, config, data, modifying, query, schemaName }
    next()
  }

  /**
   * Sanitises incoming request data
   * @param {external:ExpressRequest} req
   * @param {external:ExpressResponse} res
   * @param {Function} next
   * @return {Function} Middleware function
   */
  async sanitiseRequestDataMiddleware (req, res, next) {
    try {
      if (req.apiData.modifying) {
        const data = { _id: req.apiData.query?._id, ...req.apiData.data }
        req.apiData.data = await this.sanitise(req.apiData.schemaName, data, { isReadOnly: true })
      }
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Middleware to handle a generic API request. Supports POST, GET, PUT and DELETE of items in the database.
   * @return {Function} Express middleware function
   */
  requestHandler () {
    const requestHandler = async (req, res, next) => {
      const method = req.method.toLowerCase()
      const func = this[httpMethodToDBFunction(method)]
      if (!func) {
        return next(this.app.errors.HTTP_METHOD_NOT_SUPPORTED.setData({ method }))
      }
      let data
      try {
        await this.requestHook.invoke(req)
        const preCheck = method !== 'get' && method !== 'post'
        const postCheck = method === 'get'
        if (preCheck) {
          await this.checkAccess(req, req.apiData.query)
        }
        data = await func.apply(this, argsFromReq(req))
        if (postCheck) {
          data = await this.checkAccess(req, data)
        }
        data = await this.sanitise(req.apiData.schemaName, data, { isInternal: true, strict: false })
      } catch (e) {
        return next(e)
      }
      if (Array.isArray(data) && req.params._id) { // special case for when _id param is present
        if (!data.length) {
          return next(this.app.errors.NOT_FOUND.setData({ id: req.params.id, type: req.apiData.schemaName }))
        }
        data = data[0]
      }
      if (method !== 'get') {
        const resource = Array.isArray(data) ? req.apiData.query : data._id.toString()
        this.log('debug', `API_${func.name.toUpperCase()}`, resource, 'by', req.auth.user._id.toString())
      }
      res.status(this.mapStatusCode(method)).json(data)
    }
    return requestHandler
  }

  /**
   * Express request handler for advanced API queries. Supports collation/limit/page/skip/sort and pagination. For incoming query data to be correctly parsed, it must be sent as body data using a POST request.
   * @return {function}
   */
  queryHandler () {
    const queryHandler = async (req, res, next) => {
      try {
        const opts = {
          schemaName: req.apiData.schemaName,
          collectionName: req.apiData.collectionName
        }
        const mongoOpts = {}
        // find and remove mongo options from the query
        Object.entries(req.apiData.query).forEach(([key, val]) => {
          if (['collation', 'limit', 'page', 'skip', 'sort'].includes(key)) {
            try {
              mongoOpts[key] = JSON.parse(req.apiData.query[key])
            } catch (e) {
              this.log('warn', `failed to parse query ${key} param '${mongoOpts[key]}', ${e}`)
            }
            delete req.apiData.query[key]
          } else {
            // otherwise assume we have a query field or option and store for later processing
            opts[key] = val
          }
        })
        // handle search parameter
        const search = req.apiData.query.search
        if (search) {
          delete req.apiData.query.search
          try {
            const schema = await this.getSchema(req.apiData.schemaName)
            if (schema && schema.built && schema.built.properties) {
              const searchableFields = Object.keys(schema.built.properties).filter(
                field => schema.built.properties[field].isSearchable === true
              )
              if (searchableFields.length) {
                // escape special regex characters to prevent ReDoS attacks
                const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const regex = { $regex: escapedSearch, $options: 'i' }
                const searchConditions = searchableFields.map(f => ({ [f]: regex }))
                // merge with existing $or if present
                if (req.apiData.query.$or) {
                  req.apiData.query.$and = [
                    { $or: req.apiData.query.$or },
                    { $or: searchConditions }
                  ]
                  delete req.apiData.query.$or
                } else {
                  req.apiData.query.$or = searchConditions
                }
              }
            }
          } catch (e) {
            this.log('warn', `failed to process search parameter, ${e.message}`)
          }
        }
        req.apiData.query = await this.parseQuery(req.apiData.schemaName, req.body, mongoOpts)
        // remove any valid query keys from the options
        Object.keys(req.apiData.query).forEach(key => delete opts[key])

        await this.requestHook.invoke(req)

        await this.setUpPagination(req, res, mongoOpts)

        let results = await this.find(req.apiData.query, opts, mongoOpts)

        results = await this.checkAccess(req, results)

        // If checkAccess filtered some results, fetch more to fill the page
        const pageSize = mongoOpts.limit
        if (pageSize && results.length < pageSize) {
          let fetchSkip = mongoOpts.skip + pageSize
          while (results.length < pageSize) {
            const extra = await this.find(req.apiData.query, opts, { ...mongoOpts, skip: fetchSkip })
            if (!extra.length) break
            const filtered = await this.checkAccess(req, extra)
            results = results.concat(filtered)
            fetchSkip += extra.length
          }
          if (results.length > pageSize) results = results.slice(0, pageSize)
        }

        results = await this.sanitise(req.apiData.schemaName, results, { isInternal: true, strict: false })

        res.status(this.mapStatusCode('get')).json(results)
      } catch (e) {
        return next(e)
      }
    }
    return queryHandler
  }

  /**
   * Parses an incoming query for use in the DB module
   * @param {String} schemaName The schema name for the data being queried
   * @param {Object} query The query data
   * @param {Object} mongoOptions Options to be passed to the MongoDB function
   * @returns {Object} The parsed query
   */
  async parseQuery (schemaName, query = {}, mongoOptions) {
    let q = Object.assign({}, query)
    if (schemaName) {
      try {
        const opts = { ignoreRequired: true, useDefaults: false, ...mongoOptions }
        if (q.$or) {
          q.$or = await Promise.all(q.$or.map(async expr => {
            try {
              return await this.validate(schemaName, expr, opts)
            } catch (e) { // just return the original expression on error
              return expr
            }
          }))
        } else {
          q = await this.validate(schemaName, q, opts)
        }
      } catch (e) {}
    }
    return q
  }

  /**
   * Validates and sets the relevant pagination options (limit, skip) and HTTP headers (X-Adapt-Page, X-Adapt-PageTotal, Link).
   * @param {external:ExpressRequest} req
   * @param {external:ExpressResponse} res
   * @param {Object} mongoOpts The MongoDB options
   */
  async setUpPagination (req, res, mongoOpts) {
    const maxPageSize = this.getConfig('maxPageSize') ?? this.app.config.get('adapt-authoring-api.maxPageSize')
    let pageSize = mongoOpts.limit ?? this.getConfig('defaultPageSize') ?? this.app.config.get('adapt-authoring-api.defaultPageSize')

    if (pageSize > maxPageSize) pageSize = maxPageSize

    const mongodb = await this.app.waitForModule('mongodb')
    const docCount = await mongodb.getCollection(req.apiData.collectionName).countDocuments(req.apiData.query)
    const pageTotal = Math.ceil(docCount / pageSize) || 1
    let page = parseInt(mongoOpts.page)

    if (isNaN(page) || page < 1) page = 1 // normalise invalid values
    if (page > pageTotal) page = pageTotal

    res.set('X-Adapt-Page', page)
    res.set('X-Adapt-PageSize', pageSize)
    res.set('X-Adapt-PageTotal', pageTotal)

    if (pageTotal > 1) {
      // absolute URL with paging params removed
      const baseUrl = `${req.originalUrl.split('?')[0]}`
      const query = Object.entries(req.query)
        .filter(([k]) => k !== 'page' && k !== 'limit')
        .map(([k, v]) => `${k}=${v}`)
        .concat([`limit=${pageSize}`])
        .join('&')
      const prevPage = page - 1
      const nextPage = page + 1
      const makeLink = (page, rel) => `<${baseUrl}?${query}&page=${page}>; rel="${rel}"`
      const links = [
        page > 1 && makeLink(1, 'first'),
        prevPage > 0 && makeLink(prevPage, 'prev'),
        nextPage <= pageTotal && makeLink(nextPage, 'next'),
        page < pageTotal && makeLink(pageTotal, 'last')
      ].filter(Boolean).join(', ')

      res.set('Link', links)
    }
    // add pagination attributes to mongodb options
    Object.assign(mongoOpts, { limit: pageSize, skip: mongoOpts.skip || (page - 1) * pageSize })
  }

  /**
   * Invokes the access check hook to allow modules to determine whether the request user has sufficient access to the requested resource(s)
   * @param {external:ExpressRequest} req
   * @param {Object} data The data to be checked
   * @return {Promise} Rejects if access should be blocked
   */
  async checkAccess (req, data) {
    if (req.auth.isSuper) {
      return data
    }
    const isArray = Array.isArray(data)
    const filtered = []
    let error
    await Promise.allSettled((isArray ? data : [data]).map(async r => {
      try {
        if (!this.accessCheckHook.hasObservers || (await this.accessCheckHook.invoke(req, r)).some(Boolean)) {
          filtered.push(r)
        }
      } catch (e) {
        error = this.app.errors.UNAUTHORISED
          .setData({ method: req.method, url: req.url })
      }
    }))
    if (isArray) return filtered // we can ignore errors for arrays
    if (error) throw error
    return filtered[0]
  }

  /**
   * Inserts a new document into the DB
   * @param {Object} data Data to be inserted into the DB
   * @param {InsertOptions} options Function options
   * @param {external:MongoDBInsertOneOptions} mongoOptions Options to be passed to the MongoDB function
   * @return {Promise} Resolves with DB data
   */
  async insert (data, options = {}, mongoOptions = {}) {
    options.schemaName = options.schemaName ?? await this.getSchemaName(data)
    this.setDefaultOptions(options)
    if (options.invokePreHook !== false) await this.preInsertHook.invoke(data, options, mongoOptions)

    data = await this.validate(options.schemaName, data, options)
    const mongodb = await this.app.waitForModule('mongodb')
    const results = await mongodb.insert(options.collectionName, data, mongoOptions)

    if (options.invokePostHook !== false) await this.postInsertHook.invoke(results)
    return results
  }

  /**
   * Retrieves documents from the DB
   * @param {Object} query Attributes to use to filter DB documents
   * @param {FindOptions} options Function options
   * @param {external:MongoDBFindOptions} mongoOptions Options to be passed to the MongoDB function
   * @return {Promise} Resolves with DB data
   */
  async find (query, options = {}, mongoOptions = {}) {
    this.setDefaultOptions(options)
    const q = options.validate ? await this.parseQuery(options.schemaName, query, options, mongoOptions) : query
    return this.cache.get(q, options, mongoOptions)
  }

  /**
   * Retrieves a single document from the DB. If multiple results are returned from the query, an error is thrown.
   * @param {Object} query Attributes to use to filter DB documents
   * @param {FindOptions} options Function options
   * @param {external:MongoDBFindOptions} mongoOptions Options to be passed to the MongoDB function
   * @return {Promise} Resolves with the single DB document
   */
  async findOne (query, options = {}, mongoOptions = {}) {
    const results = await this.find(query, options, mongoOptions)
    if (results.length > 1) {
      throw this.app.errors.TOO_MANY_RESULTS.setData({ actual: results.length, expected: 1, query })
    }
    if (options.strict !== false && !results.length) {
      throw this.app.errors.NOT_FOUND.setData({ id: query, type: options.schemaName })
    }
    return results[0] ?? null
  }

  /**
   * Updates an existing document in the DB
   * @param {Object} query Attributes to use to filter DB documents
   * @param {Object} data Data to be inserted into the DB
   * @param {UpdateOptions} options Function options
   * @param {external:MongoDBFindOneAndUpdateOptions} mongoOptions Options to be passed to the MongoDB function
   * @return {Promise} Resolves with DB data
   */
  async update (query, data, options = {}, mongoOptions = {}) {
    options.schemaName = options.schemaName ?? await this.getSchemaName(data)
    this.setDefaultOptions(options)

    const mongodb = await this.app.waitForModule('mongodb')
    const [originalDoc] = await mongodb.find(options.collectionName, query)

    if (!originalDoc) {
      throw this.app.errors.NOT_FOUND.setData({ id: query._id ?? query.toString(), type: options.schemaName })
    }
    const formattedData = options.rawUpdate ? { $set: {}, ...data } : { $set: data }

    if (options.invokePreHook !== false) await this.preUpdateHook.invoke(originalDoc, formattedData.$set, options, mongoOptions)
    formattedData.$set = await this.validate(options.schemaName, {
      ...stringifyValues(originalDoc),
      ...formattedData.$set
    }, options)

    const results = await mongodb.update(options.collectionName, query, formattedData, mongoOptions)
    if (options.invokePostHook !== false) await this.postUpdateHook.invoke(originalDoc, results)
    return results
  }

  /**
   * Updates existing documents in the DB
   * @param {Object} query Attributes to use to filter DB documents
   * @param {Object} data Data to be inserted into the DB
   * @param {UpdateOptions} options Function options
   * @param {external:MongoDBUpdateOptions} mongoOptions Options to be passed to the MongoDB function
   * @return {Promise} Resolves with DB data
   */
  async updateMany (query, data, options = {}, mongoOptions = {}) {
    options.schemaName = options.schemaName ?? await this.getSchemaName(data)
    this.setDefaultOptions(options)

    const mongodb = await this.app.waitForModule('mongodb')
    const originalDocs = await mongodb.find(options.collectionName, query)

    if (!originalDocs.length) {
      return []
    }
    const formattedData = options.rawUpdate ? { $set: {}, ...data } : { $set: data }

    if (options.invokePreHook !== false) await Promise.all(originalDocs.map(d => this.preUpdateHook.invoke(d, formattedData.$set, options, mongoOptions)))
    formattedData.$set = await this.validate(options.schemaName, formattedData.$set, options)

    const updatedDocs = await mongodb.updateMany(options.collectionName, query, formattedData, mongoOptions)

    if (options.invokePostHook !== false) await Promise.all(updatedDocs.map(d => this.postUpdateHook.invoke(d, updatedDocs)))
    return updatedDocs
  }

  /**
   * Removes a single document from the DB
   * @param {Object} query Attributes to use to filter DB documents
   * @param {DeleteOptions} options Function options
   * @param {external:MongoDBDeleteOptions} mongoOptions Options to be passed to the MongoDB function
   * @return {Promise} Resolves with DB data
   */
  async delete (query, options = {}, mongoOptions = {}) {
    this.setDefaultOptions(options)

    const mongodb = await this.app.waitForModule('mongodb')
    const [originalDoc] = await mongodb.find(options.collectionName, query)

    if (!originalDoc) {
      throw this.app.errors.NOT_FOUND.setData({ id: query._id ?? query.toString(), type: options.schemaName })
    }
    if (options.invokePreHook !== false) await this.preDeleteHook.invoke(originalDoc, options, mongoOptions)
    await mongodb.delete(options.collectionName, query, mongoOptions)
    if (options.invokePostHook !== false) await this.postDeleteHook.invoke(originalDoc)
    return originalDoc
  }

  /**
   * Removes multiple documents from the DB
   * @param {Object} query Attributes to use to filter DB documents
   * @param {DeleteOptions} options Function options
   * @param {external:MongoDBDeleteOptions} mongoOptions Options to be passed to the MongoDB function
   * @return {Promise}
   */
  async deleteMany (query, options = {}, mongoOptions = {}) {
    this.setDefaultOptions(options)

    const mongodb = await this.app.waitForModule('mongodb')
    const toDelete = await mongodb.find(options.collectionName, query)
    await mongodb.deleteMany(options.collectionName, query, mongoOptions)

    if (options.invokePostHook !== false) await Promise.all(toDelete.map(d => this.postDeleteHook.invoke(d)))
    return toDelete
  }
}

export default AbstractApiModule
