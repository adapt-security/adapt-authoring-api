# Hooks

Hooks allow modules to react to events and extend functionality without modifying core code. They're the primary mechanism for inter-module communication in the Adapt authoring tool.

## How hooks work

A hook is a point in the code where external observers can run their own functions. When a hook is invoked, all registered observers are called with the same arguments.

All hook observers must complete before the operation continues. For example, a document won't be inserted until all `preInsertHook` observers have finished executing.

### Mutable vs. non-mutable

Hooks can be either **mutable** or **immutable**:

- **Immutable**: the _default_ behaviour, observers receive a deep copy of any arguments to ensure that the original data is read-only and prevent unintended modifications. By default, observers are run in parallel (at the same time).
- **Mutable**: hooks allow modification of param data, and run observers in series (one after another) to ensure modifications are applied in order.

## Basic usage

### Creating hooks

```javascript
import { Hook } from 'adapt-authoring-core'

class MyModule extends AbstractModule {
  async init () {
    // param data will be read only, observers will be run in parallel
    this.myBasicHook = new Hook()

    // allows param data to be modified, observers run in series
    this.myMutableHook = new Hook({ mutable: true })

    // force observers to run in series
    this.mySeriesHook = new Hook({ type: Hook.Types.Series })
  }

  async doSomething () {
    // Invoke the hook, passing any relevant data
    await this.myBasicHook.invoke(someData)
  }
}
```

### Listening to a hook

Use `tap()` to register an observer function. 

Listeners can be `async`, and a second `scope` parameter can be passed to bind `this`:

```javascript
const content = await this.app.waitForModule('content')

content.preInsertHook.tap(async data => {
  data.createdAt = new Date()
}, this)
```

### Removing an observer

Use `untap()` to remove an observer:

```javascript
const observer = data => console.log(data)
content.preInsertHook.tap(observer)

// Later...
content.preInsertHook.untap(observer)
```

### Waiting for a hook

Use `onInvoke()` to get a promise that resolves when the hook is next invoked:

```javascript
await server.listeningHook.onInvoke()
console.log('Server is now listening')
```

### Error handling

If an observer throws an error, the hook stops executing and the error propagates to the caller. For mutable hooks running in series, any observers after the failing one won't be called.

```javascript
content.preInsertHook.tap(data => {
  if (!data.title) {
    throw new Error('Title is required')
  }
})

try {
  await content.insert({ body: 'No title here' })
} catch (e) {
  console.log(e.message) // 'Title is required'
}
```

## Best practices

1. **Keep observers focused** — Each observer should do one thing well
2. **Handle errors gracefully** — Don't let one observer break the entire flow (unless intended)
3. **Avoid side effects in non-mutable hooks** — They receive copies of data, so modifications won't persist
4. **Use descriptive names** — Try to name your hooks clearly, and try to follow established patterns (see below for examples)
6. **Consider execution order** — For mutable hooks, observers run in the order they were registered. Keep this in mind both as the hook creator, and as the hook observer.

## Common hooks

Below are some commonly used hooks, which you may find useful.

| Module | Hook | Description | Parameters | Mutable |
| ------ | ---- | ----------- | ---------- | :-----: |
| AbstractModule | `readyHook` | Module has initialised | | No |
| AbstractApiModule | `requestHook` | API request received | `(req)` | Yes |
| AbstractApiModule | `preInsertHook` | Before document insert | `(data, options, mongoOptions)` | Yes |
| AbstractApiModule | `postInsertHook` | After document insert | `(doc)` | No |
| AbstractApiModule | `preUpdateHook` | Before document update | `(originalDoc, newData, options, mongoOptions)` | Yes |
| AbstractApiModule | `postUpdateHook` | After document update | `(originalDoc, updatedDoc)` | No |
| AbstractApiModule | `preDeleteHook` | Before document delete | `(doc, options, mongoOptions)` | No |
| AbstractApiModule | `postDeleteHook` | After document delete | `(doc)` | No |
| AbstractApiModule | `accessCheckHook` | Check document access | `(req, doc)` | No |
| AdaptFrameworkBuild | `preBuildHook` | Before course build starts | | Yes |
| AdaptFrameworkBuild | `postBuildHook` | After course build completes | | Yes |
| AdaptFrameworkImport | `preImportHook` | Before course import starts | | No |
| AdaptFrameworkImport | `postImportHook` | After course import completes | | No |

## Practical examples

### Adding timestamps

```javascript
async init () {
  await super.init()
  const content = await this.app.waitForModule('content')

  content.preInsertHook.tap(data => {
    data.createdAt = new Date()
  })

  content.preUpdateHook.tap((original, newData) => {
    newData.updatedAt = new Date()
  })
}
```

### Enforcing data format

```javascript
async init () {
  await super.init()

  this.preInsertHook.tap(this.forceLowerCaseEmail)
  this.preUpdateHook.tap(this.forceLowerCaseEmail)
}

forceLowerCaseEmail (data) {
  if (data.email) {
    data.email = data.email.toLowerCase()
  }
}
```

### Access control

```javascript
async init () {
  await super.init()
  const content = await this.app.waitForModule('content')

  content.accessCheckHook.tap((req, doc) => {
    // Only allow access to own documents
    if (doc.createdBy !== req.auth.user._id.toString()) {
      throw this.app.errors.UNAUTHORISED
    }
  })
}
```

### Cascading deletes

```javascript
async init () {
  await super.init()
  const assets = await this.app.waitForModule('assets')

  assets.preDeleteHook.tap(async doc => {
    // Remove all references to this asset
    await this.removeAssetReferences(doc._id)
  })
}
```

### Registering schemas

```javascript
async init () {
  await super.init()
  const jsonschema = await this.app.waitForModule('jsonschema')

  jsonschema.registerSchemasHook.tap(async () => {
    await jsonschema.registerSchema('/path/to/schema.json')
  })
}
```

### Waiting for server startup

```javascript
async init () {
  await super.init()
  const server = await this.app.waitForModule('server')

  await server.listeningHook.onInvoke()
  this.log('info', 'Server is ready, starting background tasks')
}
```
