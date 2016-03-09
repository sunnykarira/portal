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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

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
		var branch = req.body.branch;
		var users = db.get('users');

		if(!branch){
			users.find({semester: semester}, {} , function(err, users){
				res.render('adminindex', {
					title: 'Admin Index',
					users: users
				});
			});
		}else{
			users.find({semester: semester, branch: branch}, {} , function(err, users){
				res.render('adminindex', {
					title: 'Admin Index',
					users: users,
					branch: branch
				});
			});
		}
});


router.get('/adminindex/teacher', function(req, res, next){
	var teachers = db.get('teacher');
	teachers.find({}, {}, function(err, teachers){
		//console.log(teachers);
		res.render('adminaddteacher', {
		title: 'Admin AddTeacher',
		teachers: teachers

		});
	});

});


router.post('/adminindex/teacher', function(req, res, next){
	var title = req.body.title;
	var branch = req.body.branch;
	console.log(title + '   ' + branch);
	req.checkBody('title', 'Title Field is required').notEmpty();
	req.checkBody('branch', 'Branch Field is required').notEmpty();
	var errors = req.validationErrors();

	var teachers;
	
	if(errors){
		res.render('adminaddteacher', {
			"errors": errors,
			"title": title
		});
	}else{
		teachers = db.get('teacher');
	}

	title = title.toLowerCase();
	title = capitalizeFirstLetter(title);

	teachers.find({'title': title, 'branch': branch}, {}, function(err, teacher){
			if(err) throw err;
			if(teacher.length != 0){
				req.flash('info', 'Teacher already exists, try submitting another teacher');
				res.redirect('/admin/adminindex/teacher');
			}else{
				//Submit to db
				teachers.insert({
				"title": title,
				"branch": branch
				}, function (err, teacher){
				if(err){
					res.send('There was an issue adding the teacher');
				}else{
				req.flash('success','Teacher submitted');
				res.location('/admin/adminindex/teacher');
				res.redirect('/admin/adminindex/teacher');
				}
				});
			}
	});

});


router.get('/adminindex/course', function(req, res, next){
	var courses = db.get('course');
	var teachers = db.get('teacher');
	courses.find({}, {}, function(err, courses){
		//console.log(teachers);
		teachers.find({}, {}, function(err, teachers){
			res.render('adminaddcourse', {
			title: 'Admin AddCourse',
			courses: courses,
			teachers: teachers

			});
		});
		
	});

});

router.post('/adminindex/course', function(req, res, next){
	var number = req.body.number;
	var title = req.body.title;
	var teacher = req.body.teacher;
	var branch = req.body.branch;
	//console.log(title + '   ' + branch);
	req.checkBody('title', 'Title Field is required').notEmpty();
	req.checkBody('branch', 'Branch Field is required').notEmpty();
	req.checkBody('teacher', 'Title Field is required').notEmpty();
	req.checkBody('number', 'Branch Field is required').notEmpty();

	var errors = req.validationErrors();

	var courses;
	
	if(errors){
		res.render('adminaddteacher', {
			"errors": errors,
			"title": title,
			"number": number
		});
	}else{
		courses = db.get('course');
	}

	title = title.toLowerCase();
	title = capitalizeFirstLetter(title);

	courses.find({'title': title, 'number': number, 'branch': branch}, {}, function(err, course){
			if(err) throw err;
			if(course.length != 0){
				req.flash('info', 'Course already exists, try submitting another course');
				res.redirect('/admin/adminindex/course');
			}else{
				//Submit to db
				courses.insert({
				"title": title,
				"branch": branch,
				"teacher": teacher,
				"number": number
				}, function (err, course){
				if(err){
					res.send('There was an issue adding the course');
				}else{
				req.flash('success','Course submitted');
				res.location('/admin/adminindex/course');
				res.redirect('/admin/adminindex/course');
				}
				});
			}
	});

});


router.get('/logout', function(req, res, next){
	admin = undefined;
	req.logout();
	res.location('/');
	res.redirect('/');
});

module.exports = router;