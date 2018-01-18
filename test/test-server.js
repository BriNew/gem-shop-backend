const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

const should = chai.should();

chai.use(chaiHttp);

describe('tests', function() {
	before(function() {
		return runServer();
  	});

  	after(function() {
		return closeServer();
  	});

	describe('GET endpoint', function() {
		it('should return rocks', function() {
			return chai.request(app)
				.get('/rocks')
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.should.be.a('object');
					res.body.rocks.should.have.length.of.at.least(3);
					res.body.rocks.forEach(function(rock) {
						rock.should.be.a('object');
						rock.should.include.keys('type', 'origin', 'size', 'color');
					});
				});
		});
	});

	describe('POST endpoint', function() {
		it('should add rock on POST', function() {
		const newRock = {type: "test-type", origin: "test-origin", size: "test_size", color: "test-color"};
		return chai.request(app)
			.post('/rocks')
			.send(newRock)
			.then(function(res) {
				res.should.have.status(201);
				res.should.be.json;
				res.should.be.a('object');
				res.body.should.include.keys('type', 'origin', 'size', 'color');
				res.body.type.should.equal(newRock.type);
				res.body.origin.should.equal(newRock.origin);
				res.body.size.should.equal(newRock.size);
				res.body.color.should.equal(newRock.color);
			});
		});
	});

	describe('PUT endpoint', function() {

		it('should update rock on PUT', function() {

			const newRock = {type: "test-type", origin: "test-origin", size: "test_size", color: "test-color"};
			return chai.request(app)
				.post('/rocks')
				.send(newRock)
				.then(function(res) {
					return chai.request(app)
					.put(`/rocks/${res.body.id}`)
					.send({id: res.body.id, color: "blue"});

				})
				.then(function(res) {
					res.should.have.status(204);
				});


		});
	});

	describe('DELETE endpoint', function() {
		it('should delete rock on DELETE', function() {
			const newRock = {type: "test-type", origin: "test-origin", size: "test_size", color: "test-color"};
			return chai.request(app)
				.post('/rocks')
				.send(newRock)
				.then(function(res) {
					return chai.request(app)
						.delete(`/rocks/${res.body.id}`);
				})
				.then(function(res) {
					res.should.have.status(204);
				});
			
		});
	});
});


