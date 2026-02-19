import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Hook from '../lib/Hook.js'

describe('Hook', () => {
  describe('.Types', () => {
    it('should expose Parallel type', () => {
      assert.equal(Hook.Types.Parallel, 'parallel')
    })

    it('should expose Series type', () => {
      assert.equal(Hook.Types.Series, 'series')
    })
  })

  describe('constructor', () => {
    it('should create a hook with default options', () => {
      const hook = new Hook()
      assert.ok(hook instanceof Hook)
      assert.equal(hook.hasObservers, false)
    })

    it('should create a hook that supports parallel execution', async () => {
      const hook = new Hook()
      const results = []
      hook.tap(() => results.push(1))
      hook.tap(() => results.push(2))
      await hook.invoke()
      assert.equal(results.length, 2)
    })

    it('should create a series hook when mutable option is true', async () => {
      const hook = new Hook({ mutable: true })
      const obj = { value: 0 }
      hook.tap((arg) => { arg.value += 1 })
      hook.tap((arg) => { arg.value += 1 })
      await hook.invoke(obj)
      assert.equal(obj.value, 2)
    })

    it('should respect type option for series execution', async () => {
      const hook = new Hook({ type: Hook.Types.Series })
      const order = []
      hook.tap(async () => {
        order.push('start-1')
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push('end-1')
      })
      hook.tap(() => {
        order.push('start-2')
        order.push('end-2')
      })
      await hook.invoke()
      assert.deepEqual(order, ['start-1', 'end-1', 'start-2', 'end-2'])
    })
  })

  describe('#hasObservers', () => {
    it('should return false when no observers', () => {
      const hook = new Hook()
      assert.equal(hook.hasObservers, false)
    })

    it('should return true when observers are added', () => {
      const hook = new Hook()
      hook.tap(() => {})
      assert.equal(hook.hasObservers, true)
    })
  })

  describe('#tap()', () => {
    it('should add an observer function', () => {
      const hook = new Hook()
      hook.tap(() => {})
      assert.equal(hook.hasObservers, true)
    })

    it('should add multiple observers', async () => {
      const hook = new Hook()
      let count = 0
      hook.tap(() => count++)
      hook.tap(() => count++)
      await hook.invoke()
      assert.equal(count, 2)
    })

    it('should bind observer to provided scope', () => {
      const hook = new Hook()
      const scope = { value: 42 }
      let capturedScope
      hook.tap(function () {
        capturedScope = this
      }, scope)
      hook.invoke()
      assert.equal(capturedScope, scope)
    })
  })

  describe('#untap()', () => {
    it('should not error when removing non-existent observer', () => {
      const hook = new Hook()
      hook.untap(() => {})
      assert.equal(hook.hasObservers, false)
    })
  })

  describe('#invoke()', () => {
    describe('parallel hooks', () => {
      it('should invoke all observers', async () => {
        const hook = new Hook()
        let count = 0
        hook.tap(() => count++)
        hook.tap(() => count++)
        await hook.invoke()
        assert.equal(count, 2)
      })

      it('should pass arguments to observers', async () => {
        const hook = new Hook()
        let receivedArg
        hook.tap((arg) => { receivedArg = arg })
        await hook.invoke('test')
        assert.equal(receivedArg, 'test')
      })

      it('should return array of observer results', async () => {
        const hook = new Hook()
        hook.tap(() => 'first')
        hook.tap(() => 'second')
        const results = await hook.invoke()
        assert.deepEqual(results, ['first', 'second'])
      })

      it('should invoke observers in parallel', async () => {
        const hook = new Hook()
        const order = []
        hook.tap(async () => {
          order.push('start-1')
          await new Promise(resolve => setTimeout(resolve, 10))
          order.push('end-1')
        })
        hook.tap(async () => {
          order.push('start-2')
          order.push('end-2')
        })
        await hook.invoke()
        assert.equal(order[0], 'start-1')
        assert.equal(order[1], 'start-2')
      })

      it('should throw error if any observer throws', async () => {
        const hook = new Hook()
        hook.tap(() => { throw new Error('test error') })
        await assert.rejects(hook.invoke(), { message: 'test error' })
      })
    })

    describe('series hooks', () => {
      it('should invoke observers in series', async () => {
        const hook = new Hook({ type: Hook.Types.Series })
        const order = []
        hook.tap(async () => {
          order.push('start-1')
          await new Promise(resolve => setTimeout(resolve, 10))
          order.push('end-1')
        })
        hook.tap(async () => {
          order.push('start-2')
          order.push('end-2')
        })
        await hook.invoke()
        assert.deepEqual(order, ['start-1', 'end-1', 'start-2', 'end-2'])
      })

      it('should return last observer result', async () => {
        const hook = new Hook({ type: Hook.Types.Series })
        hook.tap(() => 'first')
        hook.tap(() => 'second')
        const result = await hook.invoke()
        assert.equal(result, 'second')
      })
    })

    describe('mutable hooks', () => {
      it('should pass mutable arguments to observers', async () => {
        const hook = new Hook({ mutable: true })
        const obj = { value: 1 }
        hook.tap((arg) => { arg.value = 2 })
        hook.tap((arg) => { arg.value = 3 })
        await hook.invoke(obj)
        assert.equal(obj.value, 3)
      })
    })
  })

  describe('#onInvoke()', () => {
    it('should return a promise', () => {
      const hook = new Hook()
      const result = hook.onInvoke()
      assert.ok(result instanceof Promise)
    })
  })
})
