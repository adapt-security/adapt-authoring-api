import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AbstractApiUtils from '../lib/AbstractApiUtils.js'

describe('AbstractApiUtils', () => {
  describe('.httpMethodToAction()', () => {
    it('should return "read" for GET', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('get'), 'read')
      assert.equal(AbstractApiUtils.httpMethodToAction('GET'), 'read')
    })

    const writeMethods = ['post', 'put', 'patch', 'delete']
    writeMethods.forEach(method => {
      it(`should return "write" for ${method.toUpperCase()}`, () => {
        assert.equal(AbstractApiUtils.httpMethodToAction(method), 'write')
        assert.equal(AbstractApiUtils.httpMethodToAction(method.toUpperCase()), 'write')
      })
    })

    it('should return empty string for unknown methods', () => {
      assert.equal(AbstractApiUtils.httpMethodToAction('options'), '')
      assert.equal(AbstractApiUtils.httpMethodToAction('head'), '')
    })
  })

  describe('.httpMethodToDBFunction()', () => {
    const cases = [
      { method: 'post', expected: 'insert' },
      { method: 'get', expected: 'find' },
      { method: 'put', expected: 'update' },
      { method: 'patch', expected: 'update' },
      { method: 'delete', expected: 'delete' }
    ]
    cases.forEach(({ method, expected }) => {
      it(`should return "${expected}" for ${method.toUpperCase()}`, () => {
        assert.equal(AbstractApiUtils.httpMethodToDBFunction(method), expected)
      })
    })

    it('should be case-insensitive', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('POST'), 'insert')
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('Get'), 'find')
    })

    it('should return empty string for unknown methods', () => {
      assert.equal(AbstractApiUtils.httpMethodToDBFunction('options'), '')
    })
  })

  describe('.argsFromReq()', () => {
    const baseApiData = {
      query: { _id: '123' },
      data: { name: 'test' },
      schemaName: 'testSchema',
      collectionName: 'testCollection'
    }

    it('should return [query, opts] for GET', () => {
      const req = { method: 'GET', apiData: baseApiData }
      const result = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(result[0], baseApiData.query)
      assert.deepEqual(result[1], { schemaName: 'testSchema', collectionName: 'testCollection' })
      assert.equal(result.length, 2)
    })

    it('should return [query, opts] for DELETE', () => {
      const req = { method: 'DELETE', apiData: baseApiData }
      const result = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(result[0], baseApiData.query)
      assert.equal(result.length, 2)
    })

    it('should return [data, opts] for POST', () => {
      const req = { method: 'POST', apiData: baseApiData }
      const result = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(result[0], baseApiData.data)
      assert.equal(result.length, 2)
    })

    it('should return [query, data, opts] for PUT', () => {
      const req = { method: 'PUT', apiData: baseApiData }
      const result = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(result[0], baseApiData.query)
      assert.deepEqual(result[1], baseApiData.data)
      assert.equal(result.length, 3)
    })

    it('should return [query, data, opts] for PATCH', () => {
      const req = { method: 'PATCH', apiData: baseApiData }
      const result = AbstractApiUtils.argsFromReq(req)
      assert.deepEqual(result[0], baseApiData.query)
      assert.deepEqual(result[1], baseApiData.data)
      assert.equal(result.length, 3)
    })

    it('should return undefined for unknown methods', () => {
      const req = { method: 'OPTIONS', apiData: baseApiData }
      assert.equal(AbstractApiUtils.argsFromReq(req), undefined)
    })
  })
})
