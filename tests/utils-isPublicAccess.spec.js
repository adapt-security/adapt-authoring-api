import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isPublicAccess } from '../lib/utils/isPublicAccess.js'

describe('isPublicAccess()', () => {
  const cases = [
    { name: 'true when _access.public is true', resource: { _access: { public: true } }, expected: true },
    { name: 'false when _access.public is false', resource: { _access: { public: false } }, expected: false },
    { name: 'false when _access.public is missing', resource: { _access: {} }, expected: false },
    { name: 'false when _access is missing', resource: {}, expected: false },
    { name: 'false for a truthy non-boolean public value', resource: { _access: { public: 'true' } }, expected: false },
    { name: 'false when resource is undefined', resource: undefined, expected: false },
    { name: 'false when resource is null', resource: null, expected: false }
  ]
  cases.forEach(({ name, resource, expected }) => {
    it(`should return ${expected}: ${name}`, () => {
      assert.equal(isPublicAccess(resource), expected)
    })
  })
})
