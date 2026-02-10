import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import DataCache from '../lib/DataCache.js'

describe('DataCache', () => {
  describe('constructor', () => {
    it('should create cache with enabled state', () => {
      const cache = new DataCache({ enable: true, lifespan: 1000 })
      assert.equal(cache.isEnabled, true)
      assert.equal(cache.lifespan, 1000)
    })

    it('should create cache with disabled state', () => {
      const cache = new DataCache({ enable: false, lifespan: 2000 })
      assert.equal(cache.isEnabled, false)
      assert.equal(cache.lifespan, 2000)
    })

    it('should initialize with empty cache object', () => {
      const cache = new DataCache({ enable: true, lifespan: 1000 })
      assert.deepEqual(cache.cache, {})
    })

    it('should handle enable being undefined', () => {
      const cache = new DataCache({ lifespan: 1000 })
      assert.equal(cache.isEnabled, false)
    })
  })

  describe('#prune()', () => {
    it('should not remove fresh cache entries', () => {
      const cache = new DataCache({ enable: true, lifespan: 10000 })
      const now = Date.now()
      cache.cache.test1 = { data: [{ id: 1 }], timestamp: now }
      cache.cache.test2 = { data: [{ id: 2 }], timestamp: now }

      cache.prune()

      assert.equal(Object.keys(cache.cache).length, 2)
    })

    it('should remove expired cache entries', () => {
      const cache = new DataCache({ enable: true, lifespan: 1000 })
      const now = Date.now()
      cache.cache.fresh = { data: [{ id: 1 }], timestamp: now }
      cache.cache.expired = { data: [{ id: 2 }], timestamp: now - 2000 }

      cache.prune()

      assert.ok(cache.cache.fresh)
      assert.equal(cache.cache.expired, undefined)
    })

    it('should handle empty cache', () => {
      const cache = new DataCache({ enable: true, lifespan: 1000 })

      cache.prune()

      assert.deepEqual(cache.cache, {})
    })

    it('should remove all expired entries when multiple exist', () => {
      const cache = new DataCache({ enable: true, lifespan: 1000 })
      const now = Date.now()
      cache.cache.fresh1 = { data: [{ id: 1 }], timestamp: now }
      cache.cache.expired1 = { data: [{ id: 2 }], timestamp: now - 2000 }
      cache.cache.fresh2 = { data: [{ id: 3 }], timestamp: now }
      cache.cache.expired2 = { data: [{ id: 4 }], timestamp: now - 3000 }

      cache.prune()

      assert.equal(Object.keys(cache.cache).length, 2)
      assert.ok(cache.cache.fresh1)
      assert.ok(cache.cache.fresh2)
      assert.equal(cache.cache.expired1, undefined)
      assert.equal(cache.cache.expired2, undefined)
    })

    it('should correctly identify entries at the boundary', () => {
      const cache = new DataCache({ enable: true, lifespan: 1000 })
      const now = Date.now()
      cache.cache.justExpired = { data: [{ id: 1 }], timestamp: now - 1001 }
      cache.cache.justValid = { data: [{ id: 2 }], timestamp: now - 999 }

      cache.prune()

      assert.equal(cache.cache.justExpired, undefined)
      assert.ok(cache.cache.justValid)
    })
  })
})
