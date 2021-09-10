const AbstractAPIModule = require('../../lib/AbstractApiModule');

const TestSchema = {
  name: 'test',
  definition: {
    isTest: {
      type: "boolean", default: true
    }
  }
};

class TestApiModule extends AbstractAPIModule {
  static get def() {
    return {
      name: 'test',
      model: 'test',
      schemas: [
        TestSchema,
        { name: 't2' },
        { definition: {} }
      ],
      middleware: [testMiddleware],
      routes: [
        {
          route: '/arrayroute',
          handlers: ['post','get','put','delete'],
          scopes: { post: 'testscope' }
        },
        {
          route: '/objectroute',
          handlers: {
            post: testRouteHandler,
            get: testRouteHandler,
            put: testRouteHandler,
            delete: testRouteHandler
          }
        }
      ]
    };
  }
}

function testMiddleware(req, res, next) {
  console.log('Test middleware called');
}
function testRouteHandler(req, res, next) {
  console.log('Test handler called');
}

module.exports = TestApiModule;
