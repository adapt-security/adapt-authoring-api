# Custom request and response data

This guide documents the custom properties added to the standard Express.js [Request (req)](https://expressjs.com/en/api.html#req.properties) and [Response (res)](https://expressjs.com/en/api.html#res.properties) objects by various Adapt authoring tool modules.

See the [Express.js documentation](https://expressjs.com/en/api.html) for the standard properties.

## Summary

| Property | Added by | Purpose |
| -------- | -------- | ------- |
| `req.auth` | adapt-authoring-auth | Authentication data (user, token, scopes) |
| `req.apiData` | adapt-authoring-api | Pre-processed API request data |
| `req.translate` | adapt-authoring-lang | Translation function |
| `req.routeConfig` | adapt-authoring-server | Route configuration |
| `req.hasBody` | adapt-authoring-server | Whether request has body data |
| `req.hasParams` | adapt-authoring-server | Whether request has route params |
| `req.hasQuery` | adapt-authoring-server | Whether request has query string |
| `res.sendError` | adapt-authoring-server | Send formatted error responses |

## Request object (req)

### req.auth

Added by: `adapt-authoring-auth`

Contains authentication data for the current request. This object is always present but may not contain all the expected data (e.g. in the case of unauthenticated requests).

```javascript
{
  header: {
    type: 'Bearer',           // Auth header type
    value: 'eyJhbGci...'      // The raw token string
  },
  user: {                     // The authenticated user document
    _id: ObjectId('507f1f77bcf86cd799439011'),
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['507f1f77bcf86cd799439012']
  },
  token: {                    // The decoded JWT payload
    type: 'local',
    userId: '507f1f77bcf86cd799439011',
    signature: 'abc123',
    iat: 1609459200,
    exp: 1609545600
  },
  scopes: [                   // Array of permission scopes
    'read:content',
    'write:content'
  ],
  isSuper: false,             // Whether user has super privileges (*:*)
  userSchemaName: 'localauthuser'  // Schema used for the user
}
```

### req.apiData _(AbstractApiModule subclasses only)_

Added by: `adapt-authoring-api` (AbstractApiModule)

Contains pre-processed API request data. This is set by the `processRequestMiddleware` method for routes using `AbstractApiModule`.

```javascript
{
  collectionName: 'content',   // MongoDB collection name
  schemaName: 'course',        // JSON schema name for validation
  config: { ... },             // Route configuration
  data: { ... },               // Request body data (for POST/PUT/PATCH)
  query: { ... },              // Combined params and query string
  modifying: true              // Whether request modifies data (POST/PUT/PATCH/DELETE)
  validate: false,             // Whether data will be validated
}
```

### req.translate

Added by: `adapt-authoring-lang` (LangModule.addTranslationUtils)

A function for translating strings based on the client's accepted language.

**Signature:**

```javascript
req.translate(key: string, data?: object): string
```

**Example usage:**

```javascript
async myHandler (req, res, next) {
  // Simple translation
  const title = req.translate('app.newpagetitle')
  
  // Translation with interpolation
  const message = req.translate('app.welcomemessage', { name: 'John' })
  
  // Translate a response message
  res.json({ message: req.translate('app.success') })
}
```

### req.routeConfig

Added by: `adapt-authoring-server` (ServerUtils.cacheRouteConfig)

Contains the configuration object for the current route.

```javascript
{
  route: '/query',
  internal: false,       // Whether route is internal-only
  handlers: { ... },
  permissions: { ... }
}
```

### req.hasBody, req.hasParams, req.hasQuery

Added by: `adapt-authoring-server` (ServerUtils.addExistenceProps)

Boolean properties indicating whether the request has non-empty body, params, or query data. Useful for quickly checking if data was provided.

> **Note:** Body data is ignored for GET requests — `req.hasBody` will always be `false` for GET.

**Example usage:**

```javascript
async myHandler (req, res, next) {
  if (!req.hasParams) {
    return res.sendError(this.app.errors.MISSING_PARAMS)
  }
  
  if (!req.hasBody) {
    return res.sendError(this.app.errors.MISSING_BODY)
  }
  
  if (req.hasQuery) {
    // Apply query filters
  }
}
```

## Response object (res)

### res.sendError

Added by: `adapt-authoring-server` (ServerUtils.addErrorHandler)

A convenience method for sending error responses. Automatically formats errors, sets the appropriate status code, and translates the error message if `req.translate` is available.

**Signature:**

```javascript
res.sendError(error: AdaptError | Error): void
```

**Example usage:**

```javascript
async myHandler (req, res, next) {
  try {
    const result = await this.doSomething()
    res.json(result)
  } catch (e) {
    // Send a predefined error
    res.sendError(this.app.errors.NOT_FOUND)
    
    // Or send with custom data
    res.sendError(this.app.errors.VALIDATION_FAILED.setData({ 
      field: 'email' 
    }))
    
    // Or pass through an unexpected error (becomes SERVER_ERROR)
    res.sendError(e)
  }
}
```

The error response format:

```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found"
}
```
