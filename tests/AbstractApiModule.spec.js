import { before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readJson } from 'adapt-authoring-core'
import AbstractApiModule from '../lib/AbstractApiModule.js'

let defaultRoutes
before(async () => {
  defaultRoutes = await readJson(`${import.meta.dirname}/../default-routes.json`)
})

function createInstance (overrides = {}) {
  const instance = Object.create(AbstractApiModule.prototype)
  instance.root = 'test'
  instance.permissionsScope = undefined
  instance.schemaName = undefined
  instance.collectionName = undefined
  instance.routes = []
  instance.requestHandler = function defaultRequestHandler () {}
  instance.queryHandler = function queryHandler () {}
  instance.serveSchema = function serveSchema () {}
  Object.assign(instance, overrides)
  return instance
}

describe('AbstractApiModule', () => {
  describe('#mapStatusCode()', () => {
    const instance = Object.create(AbstractApiModule.prototype)

    const cases = [
      { method: 'post', expected: 201 },
      { method: 'get', expected: 200 },
      { method: 'put', expected: 200 },
      { method: 'patch', expected: 200 },
      { method: 'delete', expected: 204 }
    ]
    cases.forEach(({ method, expected }) => {
      it(`should return ${expected} for ${method.toUpperCase()}`, () => {
        assert.equal(instance.mapStatusCode(method), expected)
      })
    })

    it('should return undefined for unknown methods', () => {
      assert.equal(instance.mapStatusCode('options'), undefined)
    })
  })

  describe('#setDefaultOptions()', () => {
    it('should populate defaults on an empty options object', () => {
      const instance = Object.create(AbstractApiModule.prototype)
      instance.schemaName = 'testSchema'
      instance.collectionName = 'testCollection'
      const options = {}
      instance.setDefaultOptions(options)
      assert.equal(options.schemaName, 'testSchema')
      assert.equal(options.collectionName, 'testCollection')
      assert.equal(options.validate, true)
      assert.equal(options.invokePreHook, true)
      assert.equal(options.invokePostHook, true)
    })

    it('should not override existing values', () => {
      const instance = Object.create(AbstractApiModule.prototype)
      instance.schemaName = 'testSchema'
      instance.collectionName = 'testCollection'
      const options = { schemaName: 'customSchema', validate: false }
      instance.setDefaultOptions(options)
      assert.equal(options.schemaName, 'customSchema')
      assert.equal(options.validate, false)
    })

    it('should handle undefined options by creating defaults', () => {
      const instance = Object.create(AbstractApiModule.prototype)
      instance.schemaName = 'testSchema'
      instance.collectionName = 'testCollection'
      const options = instance.setDefaultOptions()
      assert.equal(options, undefined)
    })
  })

  describe('#applyRouteConfig()', () => {
    it('should set root, schemaName, and collectionName from config', async () => {
      const instance = createInstance()
      await instance.applyRouteConfig({
        root: 'content',
        schemaName: 'content',
        collectionName: 'content',
        useDefaultRoutes: false,
        routes: []
      })
      assert.equal(instance.root, 'content')
      assert.equal(instance.schemaName, 'content')
      assert.equal(instance.collectionName, 'content')
    })

    it('should not override schemaName or collectionName when not in config', async () => {
      const instance = createInstance({ schemaName: 'existing', collectionName: 'existing' })
      await instance.applyRouteConfig({ root: 'content', useDefaultRoutes: false, routes: [] })
      assert.equal(instance.schemaName, 'existing')
      assert.equal(instance.collectionName, 'existing')
    })

    it('should set routes to custom routes only when useDefaultRoutes is false', async () => {
      const instance = createInstance()
      const customRoute = { route: '/custom', handlers: { get: () => {} } }
      await instance.applyRouteConfig({ root: 'test', useDefaultRoutes: false, routes: [customRoute] })
      assert.equal(instance.routes.length, 1)
      assert.equal(instance.routes[0].route, '/custom')
    })

    it('should set routes to empty array when config has no routes', async () => {
      const instance = createInstance()
      await instance.applyRouteConfig({ root: 'test', routes: [] })
      assert.deepEqual(instance.routes, [])
    })

    it('should expand ${scope} placeholders in permissions using root', async () => { // eslint-disable-line no-template-curly-in-string
      const instance = createInstance({ root: 'content' })
      await instance.applyRouteConfig({
        root: 'content',
        routes: [{ route: '/', permissions: { get: ['read:${scope}'], post: ['write:${scope}'] } }] // eslint-disable-line no-template-curly-in-string
      })
      assert.deepEqual(instance.routes[0].permissions.get, ['read:content'])
      assert.deepEqual(instance.routes[0].permissions.post, ['write:content'])
    })

    it('should prefer permissionsScope over root for ${scope} expansion', async () => { // eslint-disable-line no-template-curly-in-string
      const instance = createInstance({ root: 'content', permissionsScope: 'custom' })
      await instance.applyRouteConfig({
        root: 'content',
        routes: [{ route: '/', permissions: { get: ['read:${scope}'] } }] // eslint-disable-line no-template-curly-in-string
      })
      assert.deepEqual(instance.routes[0].permissions.get, ['read:custom'])
    })

    it('should pass through null permissions unchanged', async () => {
      const instance = createInstance({ root: 'content' })
      await instance.applyRouteConfig({
        root: 'content',
        routes: [{ route: '/', permissions: { get: null } }]
      })
      assert.equal(instance.routes[0].permissions.get, null)
    })
  })

  describe('#findOne()', () => {
    function createFindOneInstance (findResults) {
      const notFoundError = { setData: () => { const e = new Error('NOT_FOUND'); e.code = 'NOT_FOUND'; return e } }
      const tooManyResultsError = { setData: () => { const e = new Error('TOO_MANY_RESULTS'); e.code = 'TOO_MANY_RESULTS'; return e } }
      const instance = Object.create(AbstractApiModule.prototype)
      instance.find = async () => findResults
      instance.app = { errors: { NOT_FOUND: notFoundError, TOO_MANY_RESULTS: tooManyResultsError } }
      return instance
    }

    it('should throw NOT_FOUND when no results and throwOnMissing is not set', async () => {
      const instance = createFindOneInstance([])
      await assert.rejects(() => instance.findOne({}), /NOT_FOUND/)
    })

    it('should throw NOT_FOUND when no results and throwOnMissing is true', async () => {
      const instance = createFindOneInstance([])
      await assert.rejects(() => instance.findOne({}, { throwOnMissing: true }), /NOT_FOUND/)
    })

    it('should return null when no results and throwOnMissing is false', async () => {
      const instance = createFindOneInstance([])
      const result = await instance.findOne({}, { throwOnMissing: false })
      assert.equal(result, null)
    })

    it('should return null when no results and strict is false (backward compat)', async () => {
      const instance = createFindOneInstance([])
      const result = await instance.findOne({}, { strict: false })
      assert.equal(result, null)
    })

    it('should prefer throwOnMissing over strict when both are set', async () => {
      const instance = createFindOneInstance([])
      await assert.rejects(() => instance.findOne({}, { throwOnMissing: true, strict: false }), /NOT_FOUND/)
    })

    it('should return the single result when found', async () => {
      const doc = { _id: '1', name: 'test' }
      const instance = createFindOneInstance([doc])
      const result = await instance.findOne({})
      assert.deepEqual(result, doc)
    })

    it('should throw TOO_MANY_RESULTS when more than one result is returned', async () => {
      const instance = createFindOneInstance([{ _id: '1' }, { _id: '2' }])
      await assert.rejects(() => instance.findOne({}), /TOO_MANY_RESULTS/)
    })
  })

  describe('default-routes.json', () => {
    it('should define an array of route objects', () => {
      assert.ok(Array.isArray(defaultRoutes.routes))
      assert.ok(defaultRoutes.routes.length > 0)
    })

    it('should include routes for /, /schema, /:_id, /query, and /validate', () => {
      const routePaths = defaultRoutes.routes.map(r => r.route)
      assert.ok(routePaths.includes('/'))
      assert.ok(routePaths.includes('/schema'))
      assert.ok(routePaths.includes('/:_id'))
      assert.ok(routePaths.includes('/query'))
      assert.ok(routePaths.includes('/validate'))
    })

    it('should use permissionsScope when set', () => {
      const instance = createInstance({ root: 'content', permissionsScope: 'custom' })
      instance.applyRouteConfig({ root: 'content', permissionsScope: 'custom', routes: defaultRoutes.routes })
      const rootRoute = instance.routes.find(r => r.route === '/')
      assert.ok(rootRoute.permissions.post.includes('write:custom'))
      assert.ok(rootRoute.permissions.get.includes('read:custom'))
    })

    it('should fall back to root for permissions when permissionsScope is not set', () => {
      const instance = createInstance({ root: 'content', permissionsScope: undefined })
      instance.applyRouteConfig({ root: 'content', routes: defaultRoutes.routes })
      const rootRoute = instance.routes.find(r => r.route === '/')
      assert.ok(rootRoute.permissions.post.includes('write:content'))
      assert.ok(rootRoute.permissions.get.includes('read:content'))
    })

    it('should set validate: false and modifying: false on /query route', () => {
      const instance = createInstance()
      instance.applyRouteConfig({ root: 'test', routes: defaultRoutes.routes })
      const queryRoute = instance.routes.find(r => r.route === '/query')
      assert.equal(queryRoute.validate, false)
      assert.equal(queryRoute.modifying, false)
    })

    it('should set modifying: false and gate /validate on the write scope', () => {
      const instance = createInstance({ root: 'content' })
      instance.applyRouteConfig({ root: 'content', routes: defaultRoutes.routes })
      const validateRoute = instance.routes.find(r => r.route === '/validate')
      assert.equal(validateRoute.modifying, false)
      assert.ok(validateRoute.permissions.post.includes('write:content'))
    })
  })

  describe('#validateHandler()', () => {
    function createValidateInstance (validate) {
      const status = []
      const json = []
      const res = {
        status (code) { status.push(code); return res },
        json (data) { json.push(data); return res }
      }
      const instance = createInstance({
        validate,
        mapStatusCode: AbstractApiModule.prototype.mapStatusCode
      })
      return { instance, res, status, json }
    }

    it('should respond 200 with the validated data', async () => {
      const validated = { _id: '1', title: 'valid' }
      const calls = []
      const { instance, res, status, json } = createValidateInstance(async (...args) => {
        calls.push(args)
        return validated
      })
      const req = { apiData: { schemaName: 'course', data: { title: 'valid' } } }
      let nextErr = 'unset'
      await instance.validateHandler(req, res, e => { nextErr = e })
      assert.deepEqual(calls, [['course', { title: 'valid' }, {}]])
      assert.deepEqual(status, [200])
      assert.deepEqual(json, [validated])
      assert.equal(nextErr, 'unset')
    })

    it('should forward a validation error to next and not respond', async () => {
      const error = new Error('invalid')
      const { instance, res, status, json } = createValidateInstance(async () => { throw error })
      const req = { apiData: { schemaName: 'course', data: {} } }
      let nextErr
      await instance.validateHandler(req, res, e => { nextErr = e })
      assert.equal(nextErr, error)
      assert.equal(status.length, 0)
      assert.equal(json.length, 0)
    })
  })

  describe('#setUpPagination()', () => {
    function createPaginationInstance (docCount = 0, config = {}) {
      const headers = {}
      const countCalls = []
      const instance = createInstance({
        getConfig: (key) => config[key],
        app: {
          config: {
            get: (key) => {
              const defaults = { 'adapt-authoring-api.defaultPageSize': 100, 'adapt-authoring-api.maxPageSize': 250 }
              return defaults[key]
            }
          },
          waitForModule: async () => ({
            count: async (collectionName, query) => {
              countCalls.push({ collectionName, query })
              return docCount
            }
          })
        }
      })
      const req = { originalUrl: '/api/content/query', query: {}, apiData: { collectionName: 'content', query: {} } }
      const res = { set: (k, v) => { headers[k] = v } }
      return { instance, req, res, headers, countCalls }
    }

    it('should skip pagination when limit is 0', async () => {
      const { instance, req, res, headers } = createPaginationInstance(500)
      const mongoOpts = { limit: 0 }
      await instance.setUpPagination(req, res, mongoOpts)
      assert.equal(mongoOpts.limit, undefined)
      assert.equal(headers['X-Adapt-Page'], undefined)
      assert.equal(headers['X-Adapt-PageSize'], undefined)
    })

    it('should apply default pagination when limit is not 0', async () => {
      const { instance, req, res, headers } = createPaginationInstance(50)
      const mongoOpts = {}
      await instance.setUpPagination(req, res, mongoOpts)
      assert.equal(mongoOpts.limit, 100)
      assert.equal(headers['X-Adapt-Page'], 1)
      assert.equal(headers['X-Adapt-PageSize'], 100)
    })

    it('should set Link header when results span multiple pages', async () => {
      const { instance, req, res, headers } = createPaginationInstance(250)
      const mongoOpts = {}
      await instance.setUpPagination(req, res, mongoOpts)
      assert.ok(headers.Link)
      assert.ok(headers.Link.includes('rel="next"'))
    })

    it('should not set Link header for single-page results', async () => {
      const { instance, req, res, headers } = createPaginationInstance(50)
      const mongoOpts = {}
      await instance.setUpPagination(req, res, mongoOpts)
      assert.equal(headers.Link, undefined)
    })

    it('should cap pageSize at maxPageSize', async () => {
      const { instance, req, res, headers } = createPaginationInstance(500)
      const mongoOpts = { limit: 999 }
      await instance.setUpPagination(req, res, mongoOpts)
      assert.equal(headers['X-Adapt-PageSize'], 250)
    })

    it('should count using the collection name and access-filtered query', async () => {
      const { instance, req, res, countCalls } = createPaginationInstance(50)
      req.apiData.query = { $or: [{ createdBy: '507f1f77bcf86cd799439011' }] }
      await instance.setUpPagination(req, res, {})
      assert.equal(countCalls.length, 1)
      assert.equal(countCalls[0].collectionName, 'content')
      assert.deepEqual(countCalls[0].query, req.apiData.query)
    })
  })
})
