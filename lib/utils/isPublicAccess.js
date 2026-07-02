/**
 * Predicate determining whether a resource has been granted public access
 * @param {Object} resource The resource to check
 * @return {Boolean}
 * @memberof api
 */
export function isPublicAccess (resource) {
  return resource?._access?.public === true
}
