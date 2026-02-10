import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AbstractApiModule from '../lib/AbstractApiModule.js'

describe('AbstractApiModule', () => {
  describe('#mapStatusCode()', () => {
    it('should return 201 for POST method', () => {
      const module = new AbstractApiModule()
      assert.equal(module.mapStatusCode('post'), 201)
    })

    it('should return 200 for GET method', () => {
      const module = new AbstractApiModule()
      assert.equal(module.mapStatusCode('get'), 200)
    })

    it('should return 200 for PUT method', () => {
      const module = new AbstractApiModule()
      assert.equal(module.mapStatusCode('put'), 200)
    })

    it('should return 200 for PATCH method', () => {
      const module = new AbstractApiModule()
      assert.equal(module.mapStatusCode('patch'), 200)
    })

    it('should return 204 for DELETE method', () => {
      const module = new AbstractApiModule()
      assert.equal(module.mapStatusCode('delete'), 204)
    })

    it('should return undefined for unknown method', () => {
      const module = new AbstractApiModule()
      assert.equal(module.mapStatusCode('unknown'), undefined)
    })
  })

  describe('#setDefaultOptions()', () => {
    it('should set default options when empty object provided', () => {
      const module = new AbstractApiModule()
      module.schemaName = 'testSchema'
      module.collectionName = 'testCollection'

      const options = {}
      module.setDefaultOptions(options)

      assert.equal(options.schemaName, 'testSchema')
      assert.equal(options.collectionName, 'testCollection')
      assert.equal(options.validate, true)
      assert.equal(options.invokePreHook, true)
      assert.equal(options.invokePostHook, true)
    })

    it('should not override existing options', () => {
      const module = new AbstractApiModule()
      module.schemaName = 'testSchema'
      module.collectionName = 'testCollection'

      const options = {
        schemaName: 'customSchema',
        validate: false,
        invokePreHook: false
      }
      module.setDefaultOptions(options)

      assert.equal(options.schemaName, 'customSchema')
      assert.equal(options.collectionName, 'testCollection')
      assert.equal(options.validate, false)
      assert.equal(options.invokePreHook, false)
      assert.equal(options.invokePostHook, true)
    })

    it('should handle undefined input', () => {
      const module = new AbstractApiModule()
      module.schemaName = 'testSchema'
      module.collectionName = 'testCollection'

      // Should not throw when called with undefined
      const options = module.setDefaultOptions()
      assert.equal(options, undefined)
    })
  })

  describe('DEFAULT_ROUTES', () => {
    it('should return array of default routes', () => {
      const module = new AbstractApiModule()
      module.root = 'testapi'
      module.schemaName = 'test'

      const routes = module.DEFAULT_ROUTES

      assert.ok(Array.isArray(routes))
      assert.ok(routes.length > 0)
    })

    it('should include root route', () => {
      const module = new AbstractApiModule()
      module.root = 'testapi'
      module.schemaName = 'test'

      const routes = module.DEFAULT_ROUTES
      const rootRoute = routes.find(r => r.route === '/')

      assert.ok(rootRoute)
      assert.ok(rootRoute.handlers)
      assert.ok(rootRoute.permissions)
    })

    it('should include :_id route', () => {
      const module = new AbstractApiModule()
      module.root = 'testapi'
      module.schemaName = 'test'

      const routes = module.DEFAULT_ROUTES
      const idRoute = routes.find(r => r.route === '/:_id')

      assert.ok(idRoute)
      assert.ok(idRoute.handlers)
      assert.ok(idRoute.permissions)
    })

    it('should include schema route', () => {
      const module = new AbstractApiModule()
      module.root = 'testapi'
      module.schemaName = 'test'

      const routes = module.DEFAULT_ROUTES
      const schemaRoute = routes.find(r => r.route === '/schema')

      assert.ok(schemaRoute)
      assert.ok(schemaRoute.handlers)
      assert.ok(schemaRoute.permissions)
    })

    it('should include query route', () => {
      const module = new AbstractApiModule()
      module.root = 'testapi'
      module.schemaName = 'test'

      const routes = module.DEFAULT_ROUTES
      const queryRoute = routes.find(r => r.route === '/query')

      assert.ok(queryRoute)
      assert.ok(queryRoute.handlers)
      assert.ok(queryRoute.permissions)
    })
  })
})
