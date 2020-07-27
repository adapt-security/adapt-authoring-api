# Writing an API

_**Note:** before using this functionality, it is worth having an understanding of how to write basic custom modules first. See [this page](`adapt-authoring-api` module) for more._

The `adapt-authoring-api` module makes defining custom APIs simple by providing abstract classes and utilities you can use in your own modules to replace the common boilerplate code required when writing an API.

By extending the [AbstractAPIModule](../class/adapt_authoring_restructure/adapt-authoring-api/lib/module.js~AbstractApiModule.html) class, you get the following as standard:
- Boiler-plate code for defining router and endpoints
- Default handlers for incoming HTTP requests (with support for querying)
- Support for custom middleware
- Auto-loading of database schemas
- Automated (and overridable) database interaction
- Default permissions

## Defining your API

To define an API, all you need to do is override the `setValues` function, making sure to change the values as appropriate.

See the below table for all values:

| Attribute | Type | Description | Optional |
| --------- | ---- | ----------- | -------- |
| `root` | `String` | This value will be used as the route for any URLs (e.g. `/api/mymodule`). For APIs which deal with collections of data, the general rule is to use the plural form (ie. `/api/items`). | `false` |
| `router` | `Router` | The Router instance used for HTTP requests. If not defined, a new router will be created using the `root` value. | `true` |
| `routes` | `Array<ApiRoute>` | Definitions for any routes to be added to the API router. | `false` |
| `collectionName` | `String` | Default DB collection to store data to (can be overridden by individual handlers). | `false` |

### Defining routes

Before your API can handle HTTP requests, you must define which routes the router should respond to. If your module extends AbstractApiModule, this is simply a case of setting the [`routes`](../class/node_modules/adapt-authoring-api/lib/abstractApiModule.js~AbstractApiModule.html#instance-member-routes) instance variable:

```js
this.routes = [
  // route config here
]
```

#### General tips
The Adapt server module maps to Express functionality as closely as possible, and as such adopts the same middleware/handler concepts (with a few minor changes). It is therefore very useful to have some understanding of how the Express stack works, particularly with regards to the execution order of middleware and handlers. For more details on route handling, see the [official Express documentation](https://expressjs.com/en/guide/routing.html).

Here are a few useful notes/tips:

- The `route` attribute of each route definition is very powerful, and handles params/queries/etc. in the same way as Express (see [the Express docs](https://expressjs.com/en/guide/routing.html) for more).
- Use the API's middleware to perform any tasks which are common to all routes, such as checking and formatting the request data
- You only need to specify route handlers for the routes/HTTP methods you want to enable, access will be blocked to any route/HTTP method combinations you haven't defined
- You can run route-specific middleware by adding it as a handler to the route config (see example 2. below)

#### Using the default route configuration
Instead of defining each route yourself, the AbstractApiModule class also gives you a set of default routes which you can use if you wish:
```js
[
  // POST, no params
  {
    route: '/',
    modifying: true,
    handlers: {
      post: this.requestHandler()
    }
  },
  // GET, optional _id param
  {
    route: '/:_id?',
    handlers: {
      get: this.requestHandler()
    }
  },
  // PUT/DELETE, mandatory _id param
  {
    route: '/:_id',
    modifying: true,
    handlers: {
      put: this.requestHandler(),
      delete: this.requestHandler()
    }
  },
  // POST custom query handler
  {
    route: '/query',
    validate: false,
    handlers: {
      post: this.queryHandler()
    }
  }
];
```
To use the above configuration, you simply need to call the `useDefaultRouteConfig` function:
```js
async setValues() {
  this.useDefaultRouteConfig();
}
```

### Example configurations
```js
/**
* Basic configuration
*/
async setValues() {
  const server = await this.app.waitForModule('server');
  this.root = 'myapi';
  this.collectionName = 'mycollection';
  this.router = server.api.createChildRouter('myapi'); // optional
  this.router.addMiddleware(this.myMiddleware);
  this.routes = [
    {
      route: '/',
      handlers: { // if you need reference to 'this' in your handler, remember to bind
        get: this.myRequestHandler.bind(this)
      }
    },
    {
      route: '/two',
      handlers: { // example of route-level middleware
        post: [ this.myOtherMiddleware, this.myPostHandler ]
      }
    }
  ];
}
/**
* Custom route configuration
*/
async setValues() {
  // @note other values omitted for brevity
  this.routes = [
    {
      route: '/',
      schemaName: 'myschema', // can specify custom schema/collection like this
      collectionName: 'myothercollection',
      handlers: {
        get: this.myRequestHandler.bind(this)
      }
    }
  ];
}
```
