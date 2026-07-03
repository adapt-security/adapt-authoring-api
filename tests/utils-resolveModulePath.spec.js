import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveModulePath } from '../lib/utils/resolveModulePath.js'

describe('resolveModulePath()', () => {
  it('should resolve a relative path against a module URL', () => {
    const result = resolveModulePath('../default-routes.json', 'file:///opt/app/lib/AbstractApiModule.js')
    assert.equal(result, '/opt/app/default-routes.json')
  })

  it('should decode percent-encoded characters that URL.pathname would leave escaped', () => {
    const base = 'file:///opt/my%20app/lib/AbstractApiModule.js'
    assert.equal(resolveModulePath('../default-routes.json', base), '/opt/my app/default-routes.json')
    assert.notEqual(resolveModulePath('../default-routes.json', base), new URL('../default-routes.json', base).pathname)
  })

  it('should resolve a real file that can be read from disk', async () => {
    const { readFile } = await import('node:fs/promises')
    const path = resolveModulePath('../package.json', import.meta.url)
    const pkg = JSON.parse(await readFile(path, 'utf8'))
    assert.equal(pkg.name, 'adapt-authoring-api')
  })
})
