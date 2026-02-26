import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AbstractApiModule from '../lib/AbstractApiModule.js'

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

  describe('#DEFAULT_ROUTES', () => {
    it('should return an array of route objects', async () => {
      const instance = createInstance()
      const routes = await instance.DEFAULT_ROUTES
      assert.ok(Array.isArray(routes))
      assert.ok(routes.length > 0)
    })

    it('should include routes for /, /schema, /:_id, and /query', async () => {
      const instance = createInstance()
      const routes = await instance.DEFAULT_ROUTES
      const routePaths = routes.map(r => r.route)
      assert.ok(routePaths.includes('/'))
      assert.ok(routePaths.includes('/schema'))
      assert.ok(routePaths.includes('/:_id'))
      assert.ok(routePaths.includes('/query'))
    })

    it('should use permissionsScope when set', async () => {
      const instance = createInstance({ root: 'content', permissionsScope: 'custom' })
      const routes = await instance.DEFAULT_ROUTES
      const rootRoute = routes.find(r => r.route === '/')
      assert.ok(rootRoute.permissions.post.includes('write:custom'))
      assert.ok(rootRoute.permissions.get.includes('read:custom'))
    })

    it('should fall back to root for permissions when permissionsScope is not set', async () => {
      const instance = createInstance({ root: 'content', permissionsScope: undefined })
      const routes = await instance.DEFAULT_ROUTES
      const rootRoute = routes.find(r => r.route === '/')
      assert.ok(rootRoute.permissions.post.includes('write:content'))
      assert.ok(rootRoute.permissions.get.includes('read:content'))
    })

    it('should set validate: false and modifying: false on /query route', async () => {
      const instance = createInstance()
      const routes = await instance.DEFAULT_ROUTES
      const queryRoute = routes.find(r => r.route === '/query')
      assert.equal(queryRoute.validate, false)
      assert.equal(queryRoute.modifying, false)
    })
  })
})
