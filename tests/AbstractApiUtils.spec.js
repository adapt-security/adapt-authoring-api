import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AbstractApiUtils from '../lib/AbstractApiUtils.js'

describe('AbstractApiUtils', () => {
  describe('#httpMethodToAction()', () => {
    it('should return "read" for GET method', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('get'), 'read')
      assert.equal(AbstractApiUtils.httpMethodToAction('GET'), 'read')
    })

    it('should return "write" for POST method', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('post'), 'write')
      assert.equal(AbstractApiUtils.httpMethodToAction('POST'), 'write')
    })

    it('should return "write" for PUT method', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('put'), 'write')
      assert.equal(AbstractApiUtils.httpMethodToAction('PUT'), 'write')
    })

    it('should return "write" for PATCH method', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('patch'), 'write')
      assert.equal(AbstractApiUtils.httpMethodToAction('PATCH'), 'write')
    })

    it('should return "write" for DELETE method', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('delete'), 'write')
      assert.equal(AbstractApiUtils.httpMethodToAction('DELETE'), 'write')
    })

    it('should return empty string for unknown method', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('unknown'), '')
      assert.equal(AbstractApiUtils.httpMethodToAction('OPTIONS'), '')
    })
  })

  describe('#httpMethodToDBFunction()', () => {
    it('should return "insert" for POST method', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('post'), 'insert')
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('POST'), 'insert')
    })

    it('should return "find" for GET method', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('get'), 'find')
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('GET'), 'find')
    })

    it('should return "update" for PUT method', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('put'), 'update')
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('PUT'), 'update')
    })

    it('should return "update" for PATCH method', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('patch'), 'update')
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('PATCH'), 'update')
    })

    it('should return "delete" for DELETE method', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('delete'), 'delete')
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('DELETE'), 'delete')
    })

    it('should return empty string for unknown method', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('unknown'), '')
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('OPTIONS'), '')
    })
  })

  describe('#argsFromReq()', () => {
    it('should return query and options for GET request', () => {
      const req = {
        method: 'GET',
        apiData: {
          query: { _id: '123' },
          schemaName: 'test',
          collectionName: 'tests'
        }
      }
      const args = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(args, [
        { _id: '123' },
        { schemaName: 'test', collectionName: 'tests' }
      ])
    })

    it('should return query and options for DELETE request', () => {
      const req = {
        method: 'DELETE',
        apiData: {
          query: { _id: '456' },
          schemaName: 'user',
          collectionName: 'users'
        }
      }
      const args = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(args, [
        { _id: '456' },
        { schemaName: 'user', collectionName: 'users' }
      ])
    })

    it('should return data and options for POST request', () => {
      const req = {
        method: 'POST',
        apiData: {
          data: { name: 'John' },
          schemaName: 'user',
          collectionName: 'users'
        }
      }
      const args = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(args, [
        { name: 'John' },
        { schemaName: 'user', collectionName: 'users' }
      ])
    })

    it('should return query, data and options for PUT request', () => {
      const req = {
        method: 'PUT',
        apiData: {
          query: { _id: '789' },
          data: { name: 'Jane' },
          schemaName: 'user',
          collectionName: 'users'
        }
      }
      const args = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(args, [
        { _id: '789' },
        { name: 'Jane' },
        { schemaName: 'user', collectionName: 'users' }
      ])
    })

    it('should return query, data and options for PATCH request', () => {
      const req = {
        method: 'PATCH',
        apiData: {
          query: { _id: '101' },
          data: { email: 'test@example.com' },
          schemaName: 'user',
          collectionName: 'users'
        }
      }
      const args = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(args, [
        { _id: '101' },
        { email: 'test@example.com' },
        { schemaName: 'user', collectionName: 'users' }
      ])
    })
  })

  describe('#stringifyValues()', () => {
    it('should return the same object for simple values', () => {
      const data = { name: 'test', count: 5, active: true }
      const result = AbstractApiUtils.stringifyValues(data)
      assert.deepEqual(result, data)
    })

    it('should convert Date objects to strings', () => {
      const date = new Date('2024-01-01')
      const data = { createdAt: date }
      const result = AbstractApiUtils.stringifyValues(data)
      assert.equal(result.createdAt, date.toString())
      assert.equal(typeof result.createdAt, 'string')
    })

    it('should handle nested objects', () => {
      const data = {
        name: 'test',
        meta: {
          count: 10,
          active: true
        }
      }
      const result = AbstractApiUtils.stringifyValues(data)
      assert.deepEqual(result, data)
    })

    it('should handle arrays', () => {
      const data = { tags: ['tag1', 'tag2', 'tag3'] }
      const result = AbstractApiUtils.stringifyValues(data)
      assert.deepEqual(result, data)
      assert.ok(Array.isArray(result.tags))
    })

    it('should handle empty objects', () => {
      const data = {}
      const result = AbstractApiUtils.stringifyValues(data)
      assert.deepEqual(result, {})
    })

    it('should handle empty arrays', () => {
      const data = []
      const result = AbstractApiUtils.stringifyValues(data)
      assert.deepEqual(result, [])
      assert.ok(Array.isArray(result))
    })
  })
})
