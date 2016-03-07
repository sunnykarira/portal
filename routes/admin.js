var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var moment = require('moment');


var mongo = require('mongodb');
var User = require('../models/user.js');
var db = require('monk')('localhost/portal');

// require passport and local startegy
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

var admin = undefined;

router.get('/', function(req, res, next){
	res.redirect('/admin/login');
});

router.get('/login', function(req, res, next){
	res.render('adminlogin', {
		title: 'Admin Login'
	})
});

router.get('/register', function(req, res, next){
	res.render('adminregister', {
		title: 'Admin Register'
	});
});


router.post('/register', function(req, res, next){


	//Get the form values
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	var password2 = req.body.password2;


	//Form Validation
	// Value and error
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Email not valid').isEmail();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Password do not match').equals(req.body.password);

	//Check for errors
	var errors = req.validationErrors();

	if(errors){
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			password: password,
			password2: password2
		});
	}else{

			var newUser = new User({
			name: name,
			type: 'admin',
			email: email,
			password: password
			});

		// Create User
		User.createUser(newUser, function (err, user){
			if(err) throw err;
			console.log(user);

		});

		//Success Message
		req.flash('success', 'You are now registered and may log in');
		res.location('/admin');
		res.redirect('/admin');
	}
});


//Post login route
router.post('/login', function(req, res, next){
	var users = db.get('users');
	var name = req.body.name;
	var password = req.body.password;

	users.findOne({
		type: 'admin', 
		name: name
	}, function(err, user){
		console.log(user);
		bcrypt.compare(password, user.password, function(err, matched){
			if(err) throw err;
			if(matched){
				admin = user;
				console.log('Auth successful');
				req.flash('success', 'You are logged in as Admin');
				res.location('/admin/adminindex');
				res.redirect('/admin/adminindex');
			}
		});
	});
});

router.get('/adminindex', function(req, res, next){
	res.render('adminindex', {
		title: 'Admin Index'
	});
});


router.get('/adminindex/students', function(req, res, next){
	var users = db.get('users');
	users.find({type: 'normal'}, {}, function(err, users){
		if(err) throw(err);
		console.log(users);
		res.render('adminindex', {
			title: 'Admin Index',
			users: users
		});
	});
});

router.get('/adminindex/semester', function(req, res, next){
		var semesters = db.get('semester');
		semesters.find({},{}, function(err, semesters){
			res.render('adminindex', {
				title: 'Admin Index',
				semesters: semesters 
			});
		});

});

router.post('/adminindex/semester', function(req, res, next){
		var semester = req.body.semester;
		var users = db.get('users');
		users.find({semester: semester}, {} , function(err, users){
			res.render('adminindex', {
				title: 'Admin Index',
				users: users
			});
		});
});


router.get('/logout', function(req, res, next){
	admin = undefined;
	req.logout();
	res.location('/');
	res.redirect('/');
});

module.exports = router;