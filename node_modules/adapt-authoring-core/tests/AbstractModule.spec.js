import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AbstractModule from '../lib/AbstractModule.js'

describe('AbstractModule', () => {
  describe('.MODULE_READY', () => {
    it('should return MODULE_READY constant', () => {
      assert.equal(AbstractModule.MODULE_READY, 'MODULE_READY')
    })
  })

  describe('constructor', () => {
    it('should create an instance with app and pkg', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const pkg = { name: 'test-module', rootDir: '/test' }
      const module = new AbstractModule(mockApp, pkg)

      await module.onReady().catch(() => {}) // Wait for init

      assert.equal(module.app, mockApp)
      assert.equal(module.pkg, pkg)
      assert.equal(module.name, 'test-module')
      assert.equal(module.rootDir, '/test')
    })

    it('should use constructor name if pkg.name is not provided', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, {})

      await module.onReady().catch(() => {})

      assert.equal(module.name, 'AbstractModule')
    })

    it('should initialize readyHook for lifecycle management', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })

      await module.onReady().catch(() => {})

      // readyHook should be initialized and usable
      assert.ok(module.readyHook)
      let hookCalled = false
      module.readyHook.tap(() => { hookCalled = true })
      await module.readyHook.invoke()
      assert.equal(hookCalled, true)
    })
  })

  describe('#init()', () => {
    it('should be called automatically during construction', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      let initCalled = false

      class TestModule extends AbstractModule {
        async init () {
          initCalled = true
        }
      }

      const module = new TestModule(mockApp, { name: 'test' })
      await module.onReady()

      assert.equal(initCalled, true)
    })

    it('should handle errors thrown in init', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }

      class TestModule extends AbstractModule {
        async init () {
          throw new Error('init error')
        }
      }

      const module = new TestModule(mockApp, { name: 'test' })
      await assert.rejects(module.onReady(), { message: 'init error' })
    })
  })

  describe('#setReady()', () => {
    it('should set _isReady to true when no error', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })

      await module.onReady()

      assert.equal(module._isReady, true)
    })

    it('should not set _isReady when error is passed', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }

      class TestModule extends AbstractModule {
        async init () {
          throw new Error('test error')
        }
      }

      const module = new TestModule(mockApp, { name: 'test' })

      try {
        await module.onReady()
      } catch (e) {
        // Expected
      }

      assert.equal(module._isReady, false)
    })

    it('should calculate initTime', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })

      await module.onReady()

      assert.equal(typeof module.initTime, 'number')
      assert.ok(module.initTime >= 0)
    })

    it('should not call setReady multiple times', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })

      await module.onReady()
      const firstInitTime = module.initTime

      await module.setReady()

      assert.equal(module.initTime, firstInitTime)
    })
  })

  describe('#onReady()', () => {
    it('should return a promise', () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })
      const result = module.onReady()

      assert.ok(result instanceof Promise)
    })

    it('should resolve when module is ready', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })

      const resolvedModule = await module.onReady()

      assert.equal(resolvedModule, module)
    })

    it('should reject when module initialization fails', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }

      class TestModule extends AbstractModule {
        async init () {
          throw new Error('init failed')
        }
      }

      const module = new TestModule(mockApp, { name: 'test' })

      await assert.rejects(module.onReady(), { message: 'init failed' })
    })

    it('should resolve immediately if already ready', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })

      await module.onReady()

      const resolvedModule = await module.onReady()

      assert.equal(resolvedModule, module)
    })
  })

  describe('#getConfig()', () => {
    it('should return undefined when app.config is not available', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test-module' })

      await module.onReady()

      const result = module.getConfig('someKey')

      assert.equal(result, undefined)
    })

    it('should return config value when available', async () => {
      const mockApp = {
        config: {
          get: (key) => {
            if (key === 'test-module.testKey') return 'testValue'
          }
        },
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test-module' })

      await module.onReady()

      const result = module.getConfig('testKey')

      assert.equal(result, 'testValue')
    })

    it('should return undefined if config.get throws', async () => {
      const mockApp = {
        config: {
          get: () => {
            throw new Error('config error')
          }
        },
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test-module' })

      await module.onReady()

      const result = module.getConfig('someKey')

      assert.equal(result, undefined)
    })
  })

  describe('#log()', () => {
    it('should not throw when logger is not available', async () => {
      const mockApp = {
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'test' })

      await module.onReady()

      assert.doesNotThrow(() => {
        module.log('info', 'test message')
      })
    })

    it('should call logger when available', async () => {
      let loggedMessage
      const mockApp = {
        logger: {
          name: 'logger',
          log: (level, moduleName, ...args) => {
            loggedMessage = { level, moduleName, args }
          }
        },
        dependencyloader: {
          moduleLoadedHook: {
            tap: () => {},
            untap: () => {}
          }
        }
      }
      const module = new AbstractModule(mockApp, { name: 'adapt-authoring-test' })

      await module.onReady()

      module.log('info', 'test message')

      assert.equal(loggedMessage.level, 'info')
      assert.equal(loggedMessage.moduleName, 'test')
      assert.deepEqual(loggedMessage.args, ['test message'])
    })
  })
})
