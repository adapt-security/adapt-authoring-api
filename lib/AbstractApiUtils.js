import { argsFromReq } from './utils/argsFromReq.js'
import { generateApiMetadata } from './utils/generateApiMetadata.js'
import { httpMethodToAction } from './utils/httpMethodToAction.js'
import { httpMethodToDBFunction } from './utils/httpMethodToDBFunction.js'
import { stringifyValues } from 'adapt-authoring-core'

/**
 * Utilities for APIs
 * @memberof api
 * @deprecated Use named imports from 'adapt-authoring-api' instead
 */
class AbstractApiUtils {
  /** @deprecated Use httpMethodToAction() directly */
  static httpMethodToAction (method) { return httpMethodToAction(method) }
  /** @deprecated Use httpMethodToDBFunction() directly */
  static httpMethodToDBFunction (method) { return httpMethodToDBFunction(method) }
  /** @deprecated Use argsFromReq() directly */
  static argsFromReq (req) { return argsFromReq(req) }
  /** @deprecated Use generateApiMetadata() directly */
  static generateApiMetadata (instance) { return generateApiMetadata(instance) }
  /** @deprecated Use stringifyValues() directly */
  static stringifyValues (data) { return stringifyValues(data) }
}

export default AbstractApiUtils
