import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateApiMetadata } from '../lib/utils/generateApiMetadata.js'

describe('generateApiMetadata()', () => {
  function createInstance (routes) {
    return {
      schemaName: 'TestSchema',
      collectionName: 'testcollection',
      app: {
        config: {
          get: (key) => {
            const map = {
              'adapt-authoring-api.defaultPageSize': 50,
              'adapt-authoring-api.maxPageSize': 200
            }
            return map[key]
          }
        }
      },
      routes: routes || []
    }
  }

  it('should set meta on each route', () => {
    const instance = createInstance([
      { route: '/', handlers: { post: () => {}, get: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.ok(instance.routes[0].meta)
    assert.ok(instance.routes[0].meta.post)
    assert.ok(instance.routes[0].meta.get)
  })

  it('should generate correct summary for POST /', () => {
    const instance = createInstance([
      { route: '/', handlers: { post: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.equal(instance.routes[0].meta.post.summary, 'Insert a new TestSchema document')
  })

  it('should generate correct summary for GET /', () => {
    const instance = createInstance([
      { route: '/', handlers: { get: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.equal(instance.routes[0].meta.get.summary, 'Retrieve all testcollection documents')
  })

  it('should include query parameters for GET /', () => {
    const instance = createInstance([
      { route: '/', handlers: { get: () => {} } }
    ])
    generateApiMetadata(instance)
    const params = instance.routes[0].meta.get.parameters
    assert.ok(Array.isArray(params))
    assert.equal(params.length, 2)
    assert.equal(params[0].name, 'limit')
    assert.equal(params[1].name, 'page')
  })

  it('should generate correct summary for /:_id routes', () => {
    const instance = createInstance([
      { route: '/:_id', handlers: { get: () => {}, put: () => {}, patch: () => {}, delete: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.equal(instance.routes[0].meta.get.summary, 'Retrieve an existing TestSchema document')
    assert.equal(instance.routes[0].meta.put.summary, 'Replace an existing TestSchema document')
    assert.equal(instance.routes[0].meta.patch.summary, 'Update an existing TestSchema document')
    assert.equal(instance.routes[0].meta.delete.summary, 'Delete an existing TestSchema document')
  })

  it('should set 201 response for POST and 204 for DELETE', () => {
    const instance = createInstance([
      { route: '/', handlers: { post: () => {} } },
      { route: '/:_id', handlers: { delete: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.ok(instance.routes[0].meta.post.responses[201])
    assert.ok(instance.routes[1].meta.delete.responses[204])
  })

  it('should generate correct summary for /query route', () => {
    const instance = createInstance([
      { route: '/query', handlers: { post: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.equal(instance.routes[0].meta.post.summary, 'Query all testcollection')
  })

  it('should generate correct summary for /schema route', () => {
    const instance = createInstance([
      { route: '/schema', handlers: { get: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.equal(instance.routes[0].meta.get.summary, 'Retrieve TestSchema schema')
  })

  it('should handle multiple routes', () => {
    const instance = createInstance([
      { route: '/', handlers: { post: () => {}, get: () => {} } },
      { route: '/:_id', handlers: { get: () => {}, delete: () => {} } },
      { route: '/query', handlers: { post: () => {} } },
      { route: '/schema', handlers: { get: () => {} } }
    ])
    generateApiMetadata(instance)
    assert.equal(Object.keys(instance.routes[0].meta).length, 2)
    assert.equal(Object.keys(instance.routes[1].meta).length, 2)
    assert.equal(Object.keys(instance.routes[2].meta).length, 1)
    assert.equal(Object.keys(instance.routes[3].meta).length, 1)
  })
})
