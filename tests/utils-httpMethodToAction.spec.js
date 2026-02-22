import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { httpMethodToAction } from '../lib/utils/httpMethodToAction.js'

describe('httpMethodToAction()', () => {
  it('should return "read" for GET', () => {
    assert.equal(httpMethodToAction('get'), 'read')
  })

  it('should be case-insensitive', () => {
    assert.equal(httpMethodToAction('GET'), 'read')
    assert.equal(httpMethodToAction('Get'), 'read')
  })

  const writeMethods = ['post', 'put', 'patch', 'delete']
  writeMethods.forEach(method => {
    it(`should return "write" for ${method.toUpperCase()}`, () => {
      assert.equal(httpMethodToAction(method), 'write')
      assert.equal(httpMethodToAction(method.toUpperCase()), 'write')
    })
  })

  it('should return empty string for unknown methods', () => {
    assert.equal(httpMethodToAction('options'), '')
    assert.equal(httpMethodToAction('head'), '')
  })
})
