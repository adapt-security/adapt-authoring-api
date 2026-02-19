import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Utils from '../lib/Utils.js'

describe('Utils', () => {
  describe('.metadataFileName', () => {
    it('should return the metadata file name', () => {
      assert.equal(Utils.metadataFileName, 'adapt-authoring.json')
    })
  })

  describe('.packageFileName', () => {
    it('should return the package file name', () => {
      assert.equal(Utils.packageFileName, 'package.json')
    })
  })

  describe('.getArgs()', () => {
    it('should return an object with parsed arguments', () => {
      const args = Utils.getArgs()
      assert.equal(typeof args, 'object')
      assert.ok(Array.isArray(args.params))
    })
  })

  describe('.isObject()', () => {
    const validObjects = [
      { value: {}, label: 'empty object' },
      { value: { key: 'value' }, label: 'object with properties' },
      { value: { nested: { key: 'value' } }, label: 'nested object' }
    ]

    validObjects.forEach(({ value, label }) => {
      it(`should return true for ${label}`, () => {
        assert.equal(Utils.isObject(value), true)
      })
    })

    const invalidObjects = [
      { value: null, label: 'null' },
      { value: [], label: 'empty array' },
      { value: [1, 2, 3], label: 'array with values' },
      { value: 'string', label: 'string' },
      { value: 123, label: 'number' },
      { value: true, label: 'boolean' },
      { value: undefined, label: 'undefined' },
      { value: () => {}, label: 'function' }
    ]

    invalidObjects.forEach(({ value, label }) => {
      it(`should return false for ${label}`, () => {
        assert.equal(Utils.isObject(value), false)
      })
    })
  })
})
