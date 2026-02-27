# Writing an API module

This guide explains how to create a REST API module by extending `AbstractApiModule`. This is the recommended approach for any module that needs to expose HTTP endpoints for CRUD operations on database collections. 

By extending `AbstractApiModule`, your module automatically gets:

- REST endpoints for CRUD operations (POST, GET, PUT, PATCH, DELETE)
- Request validation against JSON schemas
- Database interaction via the MongoDB module
- Permission-based route security
- Pagination support for list queries
- Data caching
- Hooks for customising behaviour at key points


## Quick navigation

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Module configuration](#module-configuration)
- [Custom routes](#custom-routes)
- [Requests](#requests)
- [Database operations](#database-operations)
- [Hooks](#hooks)
- [Overriding methods](#overriding-methods)
- [Permissions](#permissions)
- [Caching](#caching)
- [Error handling](#error-handling)
- [Writing documentation](#writing-documentation)

## Prerequisites

Before creating an API module, you should understand:
- [How to write a basic module](../adapt-authoring-core/writing-a-module.md)
- [How schemas work](../adapt-authoring-jsonschema/defining-schemas.md)

## Quick start

Here's a minimal API module:

```javascript
import AbstractApiModule from 'adapt-authoring-api'

class NotesModule extends AbstractApiModule {
  async setValues () {
    await super.setValues()
    this.collectionName = 'notes'
    this.schemaName = 'note'
  }
}

export default NotesModule
```

With a `routes.json` in the module root:

```json
{
  "root": "notes"
}
```

And a schema at `schema/note.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$anchor": "note",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Note title"
    },
    "content": {
      "type": "string",
      "description": "Note content"
    }
  },
  "required": ["title"]
}
```

This creates the following endpoints:

| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes` | List all notes |
| GET | `/api/notes/:_id` | Get a single note |
| PUT | `/api/notes/:_id` | Replace a note |
| PATCH | `/api/notes/:_id` | Update a note |
| DELETE | `/api/notes/:_id` | Delete a note |
| GET | `/api/notes/schema` | Get the JSON schema |
| POST | `/api/notes/query` | Advanced query with pagination |

## Module configuration

### Required values

Override `setValues()` to configure your module. Always call `await super.setValues()` first — this loads route configuration from `routes.json` (if present) and applies the default CRUD routes.

```javascript
async setValues () {
  await super.setValues()
  this.collectionName = 'notes' // MongoDB collection name
  this.schemaName = 'note'      // Default schema for validation
}
```

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| `root` | String | Yes* | URL path for the API (e.g., `notes` → `/api/notes`). Set via `routes.json`. |
| `router` | Router | Yes* | Router instance (created automatically if `root` is set) |
| `routes` | Array | Yes | Route definitions. Loaded from `routes.json` and `default-routes.json`. |
| `collectionName` | String | Yes | MongoDB collection name |
| `schemaName` | String | No | Default schema name for validation |
| `permissionsScope` | String | No | Override the scope used for permissions (defaults to `root`). Can be set in `routes.json`. |

*Either `root` or `router` must be set.

### Route configuration with routes.json

Create a `routes.json` file in your module's root directory. At minimum, you need to specify the `root` path:

```json
{
  "root": "notes"
}
```

When `super.setValues()` is called, this file is loaded and merged with the default CRUD routes from `default-routes.json`. The default routes provide:

| Method | Route | Handler | Permissions |
| ------ | ----- | ------- | ----------- |
| POST | `/` | `requestHandler` | `write:${scope}` |
| GET | `/` | `queryHandler` | `read:${scope}` |
| GET | `/schema` | `serveSchema` | `read:schema` |
| PUT | `/:_id` | `requestHandler` | `write:${scope}` |
| GET | `/:_id` | `requestHandler` | `read:${scope}` |
| PATCH | `/:_id` | `requestHandler` | `write:${scope}` |
| DELETE | `/:_id` | `requestHandler` | `write:${scope}` |
| POST | `/query` | `queryHandler` | `read:${scope}` |

The `${scope}` placeholder is replaced with `permissionsScope` (if set) or `root`.

## Custom routes

Custom routes are defined in your module's `routes.json` file alongside the default CRUD routes.

### Adding routes via routes.json

Add a `routes` array to your `routes.json`. These are merged with the default CRUD routes:

```json
{
  "root": "notes",
  "routes": [
    {
      "route": "/archive/:_id",
      "handlers": { "post": "archiveHandler" },
      "permissions": { "post": ["write:${scope}"] }
    }
  ]
}
```

Handler values are method names on your module class — they are resolved automatically.

### Adding routes programmatically

You can also add routes in `setValues()` after calling `super.setValues()`:

```javascript
async setValues () {
  await super.setValues()
  this.collectionName = 'notes'
  this.schemaName = 'note'
  this.routes.push({
    route: '/archive/:_id',
    handlers: { post: this.archiveHandler.bind(this) },
    permissions: { post: ['write:notes'] }
  })
}
```

### Fully custom routes

To bypass the default CRUD routes entirely, override `this.routes` after `super.setValues()`:

```javascript
async setValues () {
  await super.setValues()
  this.collectionName = 'notes'
  this.schemaName = 'note'
  this.routes = [
    {
      route: '/',
      handlers: {
        get: this.listHandler.bind(this),
        post: this.createHandler.bind(this)
      },
      permissions: {
        get: ['read:notes'],
        post: ['write:notes']
      }
    },
    {
      route: '/:_id',
      handlers: {
        get: this.getHandler.bind(this),
        delete: this.deleteHandler.bind(this)
      },
      permissions: {
        get: ['read:notes'],
        delete: ['write:notes']
      }
    }
  ]
}
```

### Route configuration options

| Property | Type | Description |
| -------- | ---- | ----------- |
| `route` | String | URL path (supports Express route params like `/:_id`) |
| `handlers` | Object | Map of HTTP method to handler function(s) |
| `permissions` | Object | Map of HTTP method to required permission scopes |
| `modifying` | Boolean | Whether the route modifies data (affects `req.apiData.modifying`) |
| `validate` | Boolean | Whether to validate request data (default: `true`) |
| `collectionName` | String | Override the default collection for this route |
| `schemaName` | String | Override the default schema for this route |
| `meta` | Object | OpenAPI metadata for documentation |
| `internal` | Boolean | Restrict route to internal requests only (i.e. `localhost`) |

### Route-level middleware

You can add middleware to specific routes by passing an array of handlers:

```javascript
{
  route: '/secure',
  handlers: {
    post: [this.validateInput.bind(this), this.secureHandler.bind(this)]
  }
}
```

## Requests

### How requests are handled

When using the default route configuration, `AbstractApiModule` provides two built-in handlers:

#### requestHandler 
Handles standard CRUD operations (POST, GET, PUT, PATCH, DELETE). It automatically:
1. Invokes the `requestHook` for any pre-processing
2. Checks access permissions (before the operation for PUT/PATCH/DELETE, after for GET)
3. Calls the appropriate database method based on the HTTP method
4. Sanitises the response data to remove internal fields
5. Returns the result with the appropriate status code (201 for POST, 200 for GET/PUT/PATCH, 204 for DELETE)

#### queryHandler 
Handles advanced queries via POST to `/query`. It supports:
1. MongoDB query operators in the request body (e.g., `$or`, `$gt`, `$regex`)
2. Pagination via `page` and `limit` query parameters
3. Sorting via a `sort` query parameter (e.g., `{"createdAt": -1}`)
4. Skipping results via a `skip` query parameter

#### Pagination

When querying collections, the response includes pagination headers:

| Header | Description |
| ------ | ----------- |
| `X-Adapt-Page` | Current page number |
| `X-Adapt-PageSize` | Number of items per page |
| `X-Adapt-PageTotal` | Total number of pages |
| `Link` | Navigation links (first, prev, next, last) |

Configure default pagination in `adapt-authoring-api` config:

```json
{
  "defaultPageSize": 100,
  "maxPageSize": 250
}
```

### Writing request handlers

Request handlers follow the Express middleware pattern:

```javascript
async myHandler (req, res, next) {
  try {
    // Handle request
    res.json(result)
  } catch (e) {
    next(e)
  }
}
```

### Accessing request data

The `req.apiData` object contains various properties specific to your API which may come in useful when handling requests. [See this guide](request-response) for a full list of properties available on the `req`/`res` objects, including `apiData`.


## Database operations

> For more information on interacting with the database, please [see this guide](using-mongodb?id=using-abstractapimodule)

`AbstractApiModule` provides the following methods for database operations:

- `find`
- `findOne`
- `insert`
- `update`
- `updateMany`
- `delete`
- `deleteMany`

These methods provide automatic data validation, caching, and lifecycle hooks in addition to the actual database operations without needing to duplicate that logic in every call.

## Hooks

> For more detailed information on Hooks, [see this guide](hooks).

`AbstractApiModule` provides several useful hooks for customising behaviour both inside and outside of the API module. These hooks are automatically invoked by the `AbstractApiModule` code, so need no extra action. They provide a quick and easy way to interact with various important API activities, and are often the best way to extend your API with custom behaviours.

See the table below for a list of hooks provided by the `AbstractApiModule` class:

| Hook | When it fires | Mutable |
| ---- | ------------- | ------- |
| `requestHook` | When an API request is received | Yes |
| `preInsertHook` | Before inserting a document | Yes |
| `postInsertHook` | After inserting a document | No |
| `preUpdateHook` | Before updating a document | Yes |
| `postUpdateHook` | After updating a document | No |
| `preDeleteHook` | Before deleting a document | No |
| `postDeleteHook` | After deleting a document | No |
| `accessCheckHook` | When checking access to a resource | No |

### Using hooks

```javascript
import { Hook } from 'adapt-authoring-core'
import AbstractApiModule from 'adapt-authoring-api'

class NotesModule extends AbstractApiModule {
  async init () {
    await super.init()
    
    /**
     * Custom hook fired when a note is archived
     * @type {Hook}
     */
    this.archivedHook = new Hook()
    
    // Add timestamps when creating documents
    this.preInsertHook.tap(data => {
      data.createdAt = new Date().toISOString()
    })
  }
  
  async archive () {
    // Do some archiving...

    // Invoke custom hook, passing the archived note to any observers
    await this.archivedHook.invoke(note)
  }
}
```

### Access control with accessCheckHook

Use `accessCheckHook` to implement custom access control:

```javascript
this.accessCheckHook.tap(async (req, doc) => {
  // Return true to allow access, false or undefined to deny
  return doc.createdBy === req.auth.user._id.toString()
})
```

## Overriding methods

You can override database methods to customise behaviour:

```javascript
async insert (...args) {
  // Custom logic before insert
  const result = await super.insert(...args)
  // Custom logic after insert
  return result
}
```

Note in the above example we call `super.insert`, which will preserve the original function's behaviour. We strongly recommend calling the super class' function like in your override, as you may encounter unexpected issues if you completely replace the existing functionality with your own.

### Overriding getSchemaName

A common candidate for override is `getSchemaName()`, as there are cases where you may need to dynamically select a schema based on the request data:

```javascript
async getSchemaName (data) {
  if (data._type === 'special') {
    return 'specialnote'
  }
  return this.schemaName
}
```

## Permissions

Routes are secured using permission scopes. The default routes use `read:<root>` and `write:<root>` scopes, which are perfectly acceptable and recommended in most cases. We would suggest choosing a different scope when your API endpoint(s) perform non-standard actions, and so using a custom scope would be more descriptive - e.g. `build:myfeature` for a build tool API, or `debug` for debugging functionality.

> For more information on permissions, see [this guide](auth-permissions)

### Custom permission scope

Set `permissionsScope` in your `routes.json` or in `setValues()`:

```json
{
  "root": "notes",
  "permissionsScope": "content"
}
```

Or programmatically:

```javascript
async setValues () {
  await super.setValues()
  this.permissionsScope = 'content'  // Uses read:content, write:content
}
```

### Per-route permissions

Define permissions per route and HTTP method:

```javascript
{
  route: '/admin',
  handlers: { get: this.adminHandler.bind(this) },
  permissions: { get: ['read:admin', 'read:notes'] }  // Requires both scopes
}
```

## Caching

`AbstractApiModule` includes a data cache to reduce database calls. Configure it in `conf/config.schema.json`:

```json
{
  "enableCache": {
    "type": "boolean",
    "default": true
  },
  "cacheLifespan": {
    "type": "number",
    "default": 60000
  }
}
```

The cache is used automatically by the `find()` method.

## Error handling

Use the application's error system for consistent error responses:

```javascript
async myHandler (req, res, next) {
  try {
    const doc = await this.findOne({ _id: req.apiData.query._id })
    if (doc.archived) {
      return next(this.app.errors.UNAUTHORISED.setData({
        reason: 'Cannot modify archived notes'
      }))
    }
    // Continue processing
  } catch (e) {
    next(e)
  }
}
```

Common errors from the API module:

| Error | Description |
| ----- | ----------- |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORISED` | Access denied |
| `TOO_MANY_RESULTS` | Query returned multiple results when one was expected |
| `HTTP_METHOD_NOT_SUPPORTED` | HTTP method not supported for this route |

## Writing documentation

If you plan on making your module available to others, it is vital that you provide good quality documentation to explain how it works. The Adapt authoring tool documentation covers three areas: the code, the REST API, and custom user manual pages. See the links below for more information on each:

- [JSDoc style guide](jsdoc-guide)
- [API documentation guide](rest-api-guide)
- [Developer manual](writing-documentation?id=developer-manual)
