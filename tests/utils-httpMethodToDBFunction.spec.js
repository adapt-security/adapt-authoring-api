import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { httpMethodToDBFunction } from '../lib/utils/httpMethodToDBFunction.js'

describe('httpMethodToDBFunction()', () => {
  const cases = [
    { method: 'post', expected: 'insert' },
    { method: 'get', expected: 'find' },
    { method: 'put', expected: 'update' },
    { method: 'patch', expected: 'update' },
    { method: 'delete', expected: 'delete' }
  ]

  cases.forEach(({ method, expected }) => {
    it(`should return "${expected}" for ${method.toUpperCase()}`, () => {
      assert.equal(httpMethodToDBFunction(method), expected)
    })
  })

  it('should be case-insensitive', () => {
    assert.equal(httpMethodToDBFunction('POST'), 'insert')
    assert.equal(httpMethodToDBFunction('Get'), 'find')
    assert.equal(httpMethodToDBFunction('DELETE'), 'delete')
  })

  it('should return empty string for unknown methods', () => {
    assert.equal(httpMethodToDBFunction('options'), '')
    assert.equal(httpMethodToDBFunction('head'), '')
  })
})
