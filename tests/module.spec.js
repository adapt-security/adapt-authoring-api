const should = require('should');

describe('API module', function() {
  before(function() {
  });
  describe('#requestHandler()', function() {
    it('should customise the request object', function() {
      false.should.be.true();
    });
    it('should correctly map HTTP methods to MongoDBModule functions', function() {
      false.should.be.true();
    });
  });
  describe('#preload()', function() {
    it('should create a child Router with the correct route', function() {
      false.should.be.true();
    });
  });
  describe('#initSchemas()', function() {
    it('should add specified schemas to the DB', function() {
      false.should.be.true();
    });
    it('should ignore badly configured data', function() {
      false.should.be.true();
    });
  });
  describe('#initMiddleware()', function() {
    it('should add middleware to the API router', function() {
      false.should.be.true();
    });
  });
  describe('#initRoutes()', function() {
    it('should add routes defined as an object', function() {
      false.should.be.true();
    });
    it('should add routes defined as an array', function() {
      false.should.be.true();
    });
    it('should set custom permissions scopes if specified', function() {
      false.should.be.true();
    });
    it('should set generic permissions scopes if not specified', function() {
      false.should.be.true();
    });
  });
});
