import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { argsFromReq } from '../lib/utils/argsFromReq.js'

describe('argsFromReq()', () => {
  const baseApiData = {
    query: { _id: '123' },
    data: { name: 'test' },
    schemaName: 'testSchema',
    collectionName: 'testCollection'
  }
  const expectedOpts = { schemaName: 'testSchema', collectionName: 'testCollection' }

  it('should return [query, opts] for GET', () => {
    const result = argsFromReq({ method: 'GET', apiData: baseApiData })
    assert.deepEqual(result, [baseApiData.query, expectedOpts])
  })

  it('should return [query, opts] for DELETE', () => {
    const result = argsFromReq({ method: 'DELETE', apiData: baseApiData })
    assert.deepEqual(result, [baseApiData.query, expectedOpts])
  })

  it('should return [data, opts] for POST', () => {
    const result = argsFromReq({ method: 'POST', apiData: baseApiData })
    assert.deepEqual(result, [baseApiData.data, expectedOpts])
  })

  it('should return [query, data, opts] for PUT', () => {
    const result = argsFromReq({ method: 'PUT', apiData: baseApiData })
    assert.deepEqual(result, [baseApiData.query, baseApiData.data, expectedOpts])
  })

  it('should return [query, data, opts] for PATCH', () => {
    const result = argsFromReq({ method: 'PATCH', apiData: baseApiData })
    assert.deepEqual(result, [baseApiData.query, baseApiData.data, expectedOpts])
  })

  it('should return undefined for unknown methods', () => {
    assert.equal(argsFromReq({ method: 'OPTIONS', apiData: baseApiData }), undefined)
  })
})
