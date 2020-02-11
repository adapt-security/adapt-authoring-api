const { App } = require('adapt-authoring-core');
const should = require('should');
const TestApiModule = require('./data/testApiModule');

describe('Abstract API module', function() {
  before(function(done) {
    const loadModule = (mod, done) => {
      const m = this.app.getModule(mod);
      m.preload (this.app, () => m.boot(this.app, done, done), done);
    };
    this.app = App.instance;

    loadModule('server', () => loadModule('mongodb', done));

    this.tmi = new TestApiModule(this.app, {});
    this.tmi.router.should.not.be.undefined();
  });
  describe('#requestHandler()', function() {
    it('should customise the request object', function() {
      const req = { method: 'GET' };
      TestApiModule.requestHandler()(req, {}, () => {});
      should.exist(req.type);
      should.exist(req.dsquery);
    });
    it('should correctly map HTTP methods to MongoDBModule functions', function() {
      const m1 = this.app.getModule('mongodb');
      const m2 = {
        retrieve: () => {
          return new Promise((resolve, reject) => { correctlyMapped = true; })
        }
      };
      let correctlyMapped = false;
      this.app.dependencyloader.modules['adapt-authoring-mongodb'] = m2;
      TestApiModule.requestHandler()({ method: 'GET' }, {}, () => {});
      this.app.dependencyloader.modules['adapt-authoring-mongodb'] = m1;
      correctlyMapped.should.be.true();
    });
  });
  describe('#preload()', function() {
    it('should create a child Router with the correct route', function(done) {
      this.tmi.preload(this.app, () => {
        this.tmi.router.constructor.name.should.equal('Router');
        done();
      }, done);
    });
  });
  describe('#initSchemas()', function() {
    it('should add specified schemas to the DB', function(done) {
      this.tmi.boot(this.app, () => {
        should.exist(this.app.getModule('mongodb').connection.models.test);
        done();
      }, done);
    });
    it('should ignore badly configured data', function() {
      const mongoModels = this.app.getModule('mongodb').connection.models;
      Object.keys(mongoModels).length.should.equal(1);
    });
  });
  describe('#initMiddleware()', function() {
    it('should add middleware to the API router', function() {
      const middleware = this.tmi.router.middleware;
      middleware.length.should.equal(1);
      middleware[0].name.should.equal('testMiddleware');
    });
  });
  describe('#initRoutes()', function() {
    it('should add routes defined as an object', function() {
      const routes = this.tmi.router.routes.map(r => r.route);
      routes.should.containEql('/objectroute');
    });
    it('should add routes defined as an array', function() {
      const routes = this.tmi.router.routes.map(r => r.route);
      routes.should.containEql('/arrayroute');
    });
    it('should set custom permissions scopes if specified', function() {
      const postScopes = this.app.auth.routes.secure['/api/arrayroute'].post;
      postScopes.should.containEql('testscope');
    });
    it('should set generic permissions scopes if not specified', function() {
      const scopes = this.app.auth.routes.secure['/api/objectroute'];
      scopes.should.not.be.undefined();
    });
  });
});
