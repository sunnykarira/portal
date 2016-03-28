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

function ensureAuthenticated(req, res, next){
	//Passport Authentication API
	if(req.isAuthenticated()){
		return next();
	}	
	res.redirect('/home');
}

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
	var user = req.user;
	res.render('index', { 
		title: 'Express',
		user: user 
	});
  
});


router.get('/home', function(req, res, next){
	res.render('outerindex', {
		title: 'OuterIndex'
	})
});

router.post('/', function (req, res, next){
	//Get the form values
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var branch = req.body.branch;
	var semester = req.body.semester;
	var password = req.body.password;
	var password2 = req.body.password2;


		//Check for image field
	if(req.files.profileimage){
		console.log('Uploading file...');
		//Getting file info
		var profileImageOriginalName = req.files.profileimage.originalname;
		var profileImageName = req.files.profileimage.name;
		var profileImageMime = req.files.profileimage.mimetype;
		var profileImagePath = req.files.profileimage.path;
		var profileImageExt = req.files.profileimage.extension;
		var profileImageSize = req.files.profileimage.size;
	}else{
		//Set a default image
		var profileImageName = 'noImage.png';
	}

	//Form Validation
	// Value and error
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Email not valid').isEmail();
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Password do not match').equals(req.body.password);

	//Check for errors
	var errors = req.validationErrors();

	if(errors){
		res.render('index', {
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		});
	}else{

		var users = db.get('users');
		bcrypt.hash(password, 10, function (err, hash){
		if(err) throw err;
		//Set hashed password
		password = hash;
		users.update({
			username: username

		}, {
			$set: {
				password: password,
				profileimage: profileImageName,
				email: email
			}
		}, function(err, user){
			if(err) throw(err);
			req.flash('success','Profile updated, You may log in');
			res.location('/');
			res.redirect('/');
			
		});

	});
		
		
	}
});


router.get('/feedback', function(req, res, next){
	var user = req.user;
	var semester = req.user.semester;
	var batch = req.user.batch;
	var branch = req.user.branch;

	var courses = db.get('course');
	var teachers = db.get('teacher');
	courses.find({branch: branch,semester: semester, batch: batch}, function(err, courses){

		res.render('feedback', {
				title: 'Feedback',
				courses: courses
			});;
	});
	
});

router.post('/feedback', function(req, res, next){
		//Get the form values
	var username = req.user.username;
	var number = req.body.number;
	var semester = req.body.semester;
	var teacher = req.body.teacher;
	var branch = req.body.branch;
	var help = req.body.help;
	var punctuality = req.body.punctuality;
	var delivery= req.body.delivery;
	var interest = req.body.interest;
	var practical = req.body.practical;
	var quality = req.body.quality;
	var text = req.body.text;


	var feedbacks = db.get('feedback');

	feedbacks.find({'username': username,
		'teacher': teacher,
		'number': number, 'semester': semester}, {}, function(err, feedback){

		if(err) throw err;
		console.log(feedback);
		if(feedback.length != 0){
			req.flash('info', 'Feedback already submitted');
			res.redirect('/feedback');
		}else{
			feedbacks.insert({
				'username': username,
				'number': number,
				'help': help,
				'semester': semester,
				'branch': branch,
				'teacher': teacher,
				'punctuality': punctuality,
				'delivery': delivery,
				'interest': interest,
				'practical': practical,
				'quality': quality,
				'text': text
			}, function(err, feedback){
				if(err) res.send('There was an issue submitting feedback');
				req.flash('success', 'Feedback Submitted');
				res.location('/feedback');
				res.redirect('/feedback');
			});
		}
	});

});



module.exports = router;
