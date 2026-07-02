const accessGroups = new WeakMap()

/**
 * OR-merges an access-control clause into a mongo query, mutating it in place. Repeated calls on the
 * same query accumulate clauses into a single shared `$or` group (additive grants), AND-combined with
 * any pre-existing query — an existing user-driven `$or` (e.g. search) is lifted into `$and` so it
 * isn't widened by the grants.
 * @param {Object} query The mongo query to mutate
 * @param {Object} clause The access clause to grant (e.g. `{ '_access.public': true }`)
 * @return {Object} The mutated query
 * @memberof api
 */
export function addAccessClause (query, clause) {
  let group = accessGroups.get(query)
  if (!group) {
    group = []
    accessGroups.set(query, group)
    if (query.$or) {
      query.$and = [...(query.$and ?? []), { $or: query.$or }, { $or: group }]
      delete query.$or
    } else if (query.$and) {
      query.$and.push({ $or: group })
    } else {
      query.$or = group
    }
  }
  group.push(clause)
  return query
}
