const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');

var _ = require("lodash");
var jwt = require('jsonwebtoken');

var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

mongoose.Promise = global.Promise;

const {PORT, CLIENT_ORIGIN, DATABASE_URL} = require('./config');
const {RocksInventory} = require('./models');
const {Users} = require('./models');
const {Contact} = require('./models');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'))
app.use(cors({
    origin: CLIENT_ORIGIN
}))
app.use(passport.initialize());
app.use(passport.session());

var jwtOptions = {}
jwtOptions.jwtFromRequest =  ExtractJwt.fromAuthHeaderAsBearerToken ();
jwtOptions.secretOrKey = 'tasmanianDevil';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  Users.findOne({ id: jwt_payload._id }, function(err, user) {
  	if (user) {
    next(null, user);
  } else {
    next(null, false);
  }

  })
});

passport.use(strategy);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


app.get('/', (req, res) => {
	res.sendFile(__dirname+'/index.html')
})

app.get('/rocks/:id', (req, res) => {
	RocksInventory
		.findById(req.params.id)
		.then(term => res.json(term.apiRepr()))
		.catch(err => {
			console.error(err);
				res.status(500).json({message: 'Internal server error'})
		});
});


app.get("/rocks", passport.authenticate('jwt', { session: false }), function(req, res){
	const pageNumber = req.query.page || 1;
	const filters = {};
	const queryableFields = ['type', 'origin', 'size', 'color'];
	queryableFields.forEach(field => {
		if (req.query[field]) {
			filters[field] = req.query[field];
		}
	});
	RocksInventory
		.paginate(filters, { page: pageNumber, limit: 16}, function(error, result) {
		res.json({
				rocks: result.docs.map(
					(term) => term.apiRepr())
			});
	})

});

app.get("/users", function(req, res){
	const pageNumber = req.query.page || 1;
	const filters = {};
	const queryableFields = ['username'];
	queryableFields.forEach(field => {
		if (req.query[field]) {
			filters[field] = req.query[field];
		}
	});
	Users
		.paginate(filters, { page: pageNumber, limit: 16}, function(error, result) {
		res.json({
				users: result.docs.map(
					(user) => user.apiRepr())
			});
	})

});



app.post('/rocks', (req, res) => {
	const requiredFields = ['type', 'origin', 'size', 'color'];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`
			console.error(message);
			return res.status(400).send(message);
		}
	}
	RocksInventory
		.create({
			type: req.body.type,
			origin: req.body.origin,
			size: req.body.size,
			color: req.body.color
		})
		.then(
			term => res.status(201).json(term.apiRepr()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

app.post('/contact', (req, res) => {
	let {name, email, subject, message} = req.body;
	const requiredFields = ['name', 'email', 'subject', 'message'];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`
			return res.status(400).send(message);
		}
	}
	Contact
		.create({
			name: req.body.name,
			email: req.body.email,
			subject: req.body.subject,
			message: req.body.message
		})
		.then(
			contact => res.status(201).json(contact.apiRepr()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});
	let transporter = nodemailer.createTransport({
	service: 'gmail',
	port: 25,
	secure: false, 
	auth:{
		user: 'thisIsMyTestEmailForTesting@gmail.com',
		pass: 'thisismytestpass'
	},
	tls: {
		rejectUnauthorized: false
	}
});
	let mailOptions = {
		from: `${name} <${email}>`,
		to: 'thisIsMyTestEmailForTesting@gmail.com',
		subject: `${subject} (from: ${email})`, 
		text: message,
		html: message
	};
	transporter.sendMail(mailOptions, (error, info) => {
	if(error){
		return console.log(error);
	}
})
});



app.post('/users', (req, res) => {
	const requiredFields = ['username', 'password'];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`
			console.error(message);
			return res.status(400).send(message);
		}
	}
	let hashedPwd = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);

	Users
		.create({
			username: req.body.username,
			password: hashedPwd

		})
		.then(
			user => res.status(201).json(user.apiRepr()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

app.post('/signin', (req, res) => {
	let {username, password} = req.body;
	if(username && password) {
		Users.findOne({ username: username }, function(err, user) {
      if (!user) {
        return res.status(401).send('This user does not exist');
      }
      if (user.validPassword(password)) {
      	var payload = {id: user.id};
      	var token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1d' });
      	res.json({token: token})
      }
      else {
      	return res.status(401).send('Incorrect password');
      }
    });
	}
});

passport.use(new LocalStrategy(
  function(id, password, done) {
    Users.findOne({ id: id }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect credentials.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect credentials.' });
      }
      return done(null, user);
    });
  }
));

app.put('/rocks/:id', (req, res) => {
	if (req.params.id !== req.body.id) {
		const message = (
			`Request path id (${req.params.id}) and request body id ` +
      		`(${req.body.id}) must match`);
		console.error(message);
		return res.status(400).json({message: message});
	}
	const updated = {};
	const updateableFields = ['type', 'origin', 'size', 'color'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			updated[field] = req.body[field];
		}
	});
	RocksInventory
		.findByIdAndUpdate(req.params.id, {$set: updated})
		.then(term => res.status(204).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}))
});

app.delete('/rocks/:id', (req, res) => {
  RocksInventory
    .findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/users/:id', (req, res) => {
  Users
    .findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});


let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};


