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
	//var number = req.body.number;
	var semester = req.body.semester;
	var teacher = req.body.number;
	var branch = req.body.branch;
	var batch = req.body.batch;
	var help = req.body.help;
	var punctuality = req.body.punctuality;
	var delivery= req.body.delivery;
	var interest = req.body.interest;
	var practical = req.body.practical;
	var quality = req.body.quality;
	var text = req.body.text;


	var feedbacks = db.get('feedback');

	feedbacks.find({'username': username,
		'teacher': teacher, 'semester': semester}, {}, function(err, feedback){

		if(err) throw err;
		console.log(feedback);
		if(feedback.length != 0){
			req.flash('info', 'Feedback already submitted');
			res.redirect('/feedback');
		}else{
			feedbacks.insert({
				'username': username,
				'help': help,
				'semester': semester,
				'branch': branch,
				'batch': batch,
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


router.get('/electivebucket1', function(req, res, next){

	var bucket1 = db.get('bucket1');
	bucket1.find({}, {}, function(err, courses){
		var length = courses.length;
		var array = [];
		for(i=1; i<=length ;i++){
			array.push({
				title: i
					});
		}
		console.log(array);
			res.render('electivebucket1', {
			title: 'Bucket 1',
			courses: courses,
			length: array
			});
	});
	
});



router.post('/electivebucket1', function(req, res, next){
	var count = 0;
	var user = req.user;
	var course = req.body.course;
	var priority = req.body.priority;

	for(i=0; i<priority.length; i++){
		for(j=i+1; j<priority.length; j++){
			if(priority[i] == priority[j]){
				count++;
				break;
			}
		}
	}

	if(count > 0){
		res.redirect('/electivebucket1');

	}else{

		var selectionbucket1 = db.get('selectionbucket1');
		selectionbucket1.find({_id: user._id}, {}, function(err, bucky){
			if(bucky.length != 0){
				req.flash('error', 'Priorities Already Submitted');
				res.location('/');		
				res.redirect('/');
			}else{
				selectionbucket1.insert({
				_id: user._id,
				course: course,
				priority: priority
				});
				req.flash('success', 'Priorities Submitted to admin');
				res.location('/');
				res.redirect('/');
			}
		});


	}

	

});





router.get('/electivebucket2', function(req, res, next){

	var bucket1 = db.get('bucket2');
	bucket1.find({}, {}, function(err, courses){
		var length = courses.length;
		var array = [];
		for(i=1; i<=length ;i++){
			array.push({
				title: i
					});
		}
		console.log(array);
			res.render('electivebucket2', {
			title: 'Bucket 2',
			courses: courses,
			length: array
			});
	});
	
});


router.post('/electivebucket2', function(req, res, next){
	var count = 0;
	var user = req.user;
	var course = req.body.course;
	var priority = req.body.priority;

	for(i=0; i<priority.length; i++){
		for(j=i+1; j<priority.length; j++){
			if(priority[i] == priority[j]){
				count++;
				break;
			}
		}
	}

	if(count > 0){
		res.redirect('/electivebucket2');

	}else{

		var selectionbucket2 = db.get('selectionbucket2');
		selectionbucket2.find({_id: user._id}, {}, function(err, bucky){
			if(bucky.length != 0){
				req.flash('error', 'Priorities Already Submitted');
				res.location('/');		
				res.redirect('/');
			}else{
				selectionbucket2.insert({
				_id: user._id,
				course: course,
				priority: priority
				});
				req.flash('success', 'Priorities Submitted to admin');
				res.location('/');
				res.redirect('/');
			}
		});


	}	

});

router.get('/course', function(req, res, next){

	var course = req.user;
	console.log(course);
	return;
});





module.exports = router;
