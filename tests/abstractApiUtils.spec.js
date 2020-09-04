const should = require('should');

describe('Abstract API utilities', function() {
  describe('#callDbFunction()', function() {
    it('should fail if request parameter doesn\'t specify a type', function() {
      false.should.be.true();
    });
    it('should fail if attempting to call an unknown DB function', function() {
      false.should.be.true();
    });
    it('should return data in response', function() {
      false.should.be.true();
    });
    it('should set response HTTP status', function() {
      false.should.be.true();
    });
  });
  describe('#httpMethodToAction()', function() {
    it('should return a string', function() {
      false.should.be.true();
    });
    it('should return action string for known action', function() {
      false.should.be.true();
    });
    it('should return empty string for unknown action', function() {
      false.should.be.true();
    });
  });
  describe('#validateSchemaDef()', function() {
    it('should fail if def isn\'t an object', function() {
      false.should.be.true();
    });
    it('should fail if def has no name', function() {
      false.should.be.true();
    });
    it('should fail if def has no model', function() {
      false.should.be.true();
    });
    it('should fail if schemas isn\'t an array', function() {
      false.should.be.true();
    });
    it('should fail if def has no routes', function() {
      false.should.be.true();
    });
    it('should validate routes', function() {
      false.should.be.true();
    });
  });
});
