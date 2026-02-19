import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import DependencyLoader from '../lib/DependencyLoader.js'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('DependencyLoader', () => {
  describe('constructor', () => {
    it('should create an instance with app reference', () => {
      const mockApp = {
        rootDir: '/test'
      }
      const loader = new DependencyLoader(mockApp)

      assert.equal(loader.app, mockApp)
      assert.equal(loader.name, 'dependencyloader')
    })

    it('should initialize empty configs and instances', () => {
      const mockApp = { rootDir: '/test' }
      const loader = new DependencyLoader(mockApp)

      assert.deepEqual(loader.configs, {})
      assert.deepEqual(loader.instances, {})
      assert.deepEqual(loader.peerDependencies, {})
      assert.deepEqual(loader.failedModules, [])
    })

    it('should initialize hooks', () => {
      const mockApp = { rootDir: '/test' }
      const loader = new DependencyLoader(mockApp)

      assert.ok(loader.configsLoadedHook)
      assert.ok(loader.moduleLoadedHook)
      assert.equal(typeof loader.configsLoadedHook.invoke, 'function')
      assert.equal(typeof loader.moduleLoadedHook.invoke, 'function')
    })
  })

  describe('#log()', () => {
    it('should not throw when logger is not available', () => {
      const mockApp = { rootDir: '/test' }
      const loader = new DependencyLoader(mockApp)

      assert.doesNotThrow(() => {
        loader.log('info', 'test message')
      })
    })

    it('should call app.logger when available and ready', () => {
      let logged = false
      const mockApp = {
        rootDir: '/test',
        logger: {
          _isReady: true, // Note: Mock uses private property to simulate ready state
          log: () => { logged = true }
        }
      }
      const loader = new DependencyLoader(mockApp)

      loader.log('info', 'test message')

      assert.equal(logged, true)
    })

    it('should fall back to console.log when logger not ready', () => {
      const mockApp = {
        rootDir: '/test',
        logger: {
          _isReady: false, // Note: Mock uses private property to check ready state
          log: () => {}
        }
      }
      const loader = new DependencyLoader(mockApp)

      assert.doesNotThrow(() => {
        loader.log('info', 'test message')
      })
    })
  })

  describe('#logError()', () => {
    it('should call log with error level', () => {
      let loggedLevel
      const mockApp = {
        rootDir: '/test',
        logger: {
          _isReady: true,
          log: (level) => { loggedLevel = level }
        }
      }
      const loader = new DependencyLoader(mockApp)

      loader.logError('error message')

      assert.equal(loggedLevel, 'error')
    })
  })

  describe('#getConfig()', () => {
    it('should return undefined when config is not ready', () => {
      const mockApp = {
        rootDir: '/test'
      }
      const loader = new DependencyLoader(mockApp)

      const result = loader.getConfig('someKey')

      assert.equal(result, undefined)
    })

    it('should return config value when config is ready', () => {
      const mockApp = {
        rootDir: '/test',
        config: {
          _isReady: true, // Note: Mock uses private property to simulate ready state
          get: (key) => {
            if (key === 'adapt-authoring-core.testKey') return 'testValue'
          }
        }
      }
      const loader = new DependencyLoader(mockApp)

      const result = loader.getConfig('testKey')

      assert.equal(result, 'testValue')
    })
  })

  describe('#loadModuleConfig()', () => {
    let testModuleDir

    before(async () => {
      // Create a temporary test module directory
      testModuleDir = path.join(__dirname, 'data', 'test-module')
      await fs.ensureDir(testModuleDir)

      await fs.writeJson(path.join(testModuleDir, 'package.json'), {
        name: 'test-module',
        version: '1.0.0'
      })

      await fs.writeJson(path.join(testModuleDir, 'adapt-authoring.json'), {
        module: true,
        essentialType: 'api'
      })
    })

    after(async () => {
      // Clean up
      await fs.remove(testModuleDir)
    })

    it('should load and merge package.json and adapt-authoring.json', async () => {
      const mockApp = { rootDir: '/test' }
      const loader = new DependencyLoader(mockApp)

      const config = await loader.loadModuleConfig(testModuleDir)

      assert.equal(config.name, 'test-module')
      assert.equal(config.version, '1.0.0')
      assert.equal(config.module, true)
      assert.equal(config.essentialType, 'api')
      assert.equal(config.rootDir, testModuleDir)
    })
  })

  describe('#logProgress()', () => {
    it('should not throw when called with valid instance', () => {
      const mockApp = { rootDir: '/test' }
      const loader = new DependencyLoader(mockApp)
      loader.configs = {
        'test-module': { name: 'test-module', module: true }
      }
      loader.instances = {
        'test-module': { name: 'test-module', _isReady: true }
      }

      const mockInstance = {
        name: 'test-module',
        initTime: 100
      }

      assert.doesNotThrow(() => {
        loader.logProgress(null, mockInstance)
      })
    })

    it('should handle error parameter', () => {
      const mockApp = { rootDir: '/test' }
      const loader = new DependencyLoader(mockApp)

      assert.doesNotThrow(() => {
        loader.logProgress(new Error('test error'), null)
      })
    })
  })
})
