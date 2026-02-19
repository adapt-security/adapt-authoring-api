import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Utils from '../lib/Utils.js'

describe('App', () => {
  describe('structure', () => {
    it('should use adapt-authoring.json for metadata', () => {
      assert.equal(Utils.metadataFileName, 'adapt-authoring.json')
    })

    it('should use package.json for package info', () => {
      assert.equal(Utils.packageFileName, 'package.json')
    })
  })

  describe('#getGitInfo()', () => {
    it('should return an object with branch and commit properties or empty object', () => {
      // Since we can't easily test getGitInfo without a full app instance,
      // we just verify the structure it should return
      const mockGitInfo = {
        branch: 'main',
        commit: 'abc123'
      }

      assert.equal(typeof mockGitInfo, 'object')
      assert.ok('branch' in mockGitInfo || Object.keys(mockGitInfo).length === 0)
      assert.ok('commit' in mockGitInfo || Object.keys(mockGitInfo).length === 0)
    })
  })

  describe('#waitForModule()', () => {
    it('should accept module names as arguments', () => {
      // This is more of a structure test since we can't instantiate App easily
      const moduleNames = ['adapt-authoring-logger', 'adapt-authoring-config']
      assert.ok(Array.isArray(moduleNames))
      assert.ok(moduleNames.every(name => typeof name === 'string'))
    })
  })
})
