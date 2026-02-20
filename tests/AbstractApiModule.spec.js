import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AbstractApiModule from '../lib/AbstractApiModule.js'

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
})
