import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { addAccessClause } from '../lib/utils/addAccessClause.js'

describe('addAccessClause()', () => {
  it('should add the clause as a top-level $or on an empty query', () => {
    const query = {}
    addAccessClause(query, { '_access.public': true })
    assert.deepEqual(query, { $or: [{ '_access.public': true }] })
  })

  it('should preserve non-$or top-level fields', () => {
    const query = { _type: 'course' }
    addAccessClause(query, { '_access.public': true })
    assert.deepEqual(query, { _type: 'course', $or: [{ '_access.public': true }] })
  })

  it('should accumulate multiple grants into one shared $or group', () => {
    const query = {}
    addAccessClause(query, { '_access.public': true })
    addAccessClause(query, { createdBy: 'abc' })
    addAccessClause(query, { '_access.groups': { $in: ['g1'] } })
    assert.deepEqual(query, {
      $or: [
        { '_access.public': true },
        { createdBy: 'abc' },
        { '_access.groups': { $in: ['g1'] } }
      ]
    })
  })

  it('should lift a pre-existing user $or into $and so grants do not widen it', () => {
    const query = { $or: [{ title: 'a' }, { title: 'b' }] }
    addAccessClause(query, { '_access.public': true })
    addAccessClause(query, { createdBy: 'abc' })
    assert.deepEqual(query, {
      $and: [
        { $or: [{ title: 'a' }, { title: 'b' }] },
        { $or: [{ '_access.public': true }, { createdBy: 'abc' }] }
      ]
    })
    assert.ok(!('$or' in query))
  })

  it('should append the grant group to a pre-existing $and', () => {
    const query = { $and: [{ x: 1 }] }
    addAccessClause(query, { '_access.public': true })
    assert.deepEqual(query, {
      $and: [{ x: 1 }, { $or: [{ '_access.public': true }] }]
    })
  })

  it('should return the mutated query', () => {
    const query = {}
    assert.equal(addAccessClause(query, { '_access.public': true }), query)
  })

  it('should track grant groups per query object', () => {
    const a = {}
    const b = {}
    addAccessClause(a, { '_access.public': true })
    addAccessClause(b, { createdBy: 'x' })
    assert.deepEqual(a, { $or: [{ '_access.public': true }] })
    assert.deepEqual(b, { $or: [{ createdBy: 'x' }] })
  })
})
