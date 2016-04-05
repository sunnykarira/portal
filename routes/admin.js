var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var moment = require('moment');

var mongo = require('mongodb');
var User = require('../models/user.js');
var db = require('monk')('localhost/portal');
var jsonparsesafe = require('json-parse-safe');

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

router.get('/adminindex',  function(req, res, next){
	res.render('adminindex', {
		title: 'Admin Index',
		user: admin.name
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
	var semesters = db.get('semester');
	var batches = db.get('batch');
	courses.find({}, {}, function(err, courses){
		//console.log(teachers);
		teachers.find({}, {}, function(err, teachers){
			
			semesters.find({}, {}, function(err, semesters){

				batches.find({}, {}, function(err, batches){
						res.render('adminaddcourse', {
						title: 'Admin AddCourse',
						courses: courses,
						teachers: teachers,
						semesters: semesters,
						batches: batches

						});

				});
				
			});
		});
		
	});

});

router.post('/adminindex/course', function(req, res, next){
	var number = req.body.number;
	var title = req.body.title;
	var batch = req.body.batch;
	var teacher = req.body.teacher;
	var branch = req.body.branch;
	var semester = req.body.semester;
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

	courses.find({'number': number, 'branch': branch, 'semester': semester, 'batch': batch}, {}, function(err, course){
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
				"number": number,
				"batch": batch,
				"semester": semester
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


router.get('/adminindex/report', function(req, res, next){
	var teachers = db.get('teacher');
	teachers.find({}, {}, function(err, teachers){
		res.render('adminfeedbackreport', {
			teachers: teachers
		});
	});
});

router.post('/adminindex/report', function(req, res, next){
	var teacher = req.body.teacher;
	//console.log(teacher);
	var feedbacks = db.get('feedback');
	var teachers = db.get('teacher');

	var punctuality = 0;
	var delivery =0;
	var interest=0;
	var help=0;
	var practical=0;
	var quality=0;

	feedbacks.find({teacher: teacher}, {}, function(err, feedbacks){
		var students = feedbacks.length;
		//console.log(feedbacks);
		for(i=0; i < feedbacks.length; i++){
			
			var object = feedbacks[i];
			punctuality+= Number(object.punctuality);
			delivery+= Number(object.delivery);
			interest+= Number(object.interest);
			help+=Number(object.help);
			practical+= Number(object.practical);
			quality+= Number(object.quality);

		}

		var total = 6*5*students;
		var feedbacktotal = punctuality+delivery+interest+help+practical+quality;
		var percentage = Math.ceil((feedbacktotal/total) * 100);
		//console.log(percentage);
		//return;

		teachers.find({}, {}, function(err, teachers){

				res.render('adminfeedbackreport', {
					teachers: teachers,
					count: students,
					punctuality: punctuality,
					delivery: delivery,
					interest: interest,
					help: help,
					practical: practical,
					quality: quality,
					percentage: percentage
				});
		});



		
		
	});
});


router.get('/adminindex/bucket1', function(req, res, next){

		var courses = db.get('bucket1');
		courses.find({}, {}, function(err, courses){

			res.render('adminbucket1', {
				courses: courses
			});
		});
		
});

router.post('/adminindex/bucket1', function(req, res, next){

	var title = req.body.title;
	var number = req.body.number;
	var branch = req.body.branch;
	var semester = req.body.semester;

	req.checkBody('title', 'Title Field is required').notEmpty();
	req.checkBody('branch', 'Branch Field is required').notEmpty();
	req.checkBody('number', 'Number Field is required').notEmpty();
	req.checkBody('semester', 'semester Field is required').notEmpty();

	var errors = req.validationErrors();

	var courses = db.get('bucket1');
	if(errors){
		res.render('adminbucket1', {
			number: number,
			title: title
		});
	}else{

		courses.find({ number: number}, {}, function(err, course){

			if(course.length != 0){
				req.flash('error', 'Course already submitted');
				res.redirect('/admin/adminindex/bucket1');
			}else{

				courses.insert({
					title: title,
					number: number,
					branch: branch,
					semester: semester
				});

				req.flash('success', 'Course submitted');
				res.location('/admin/adminindex/bucket1');
				res.redirect('/admin/adminindex/bucket1');
			}
		})

	}
});


router.get('/adminindex/bucket2', function(req, res, next){

		var courses = db.get('bucket2');
		courses.find({}, {}, function(err, courses){

			res.render('adminbucket2', {
				courses: courses
			});
		});
		
});

router.post('/adminindex/bucket2', function(req, res, next){

	var title = req.body.title;
	var number = req.body.number;
	var branch = req.body.branch;
	var semester = req.body.semester;

	req.checkBody('title', 'Title Field is required').notEmpty();
	req.checkBody('branch', 'Branch Field is required').notEmpty();
	req.checkBody('number', 'Branch Field is required').notEmpty();

	var errors = req.validationErrors();
	var courses = db.get('bucket2');
	if(errors){
		res.render('adminbucket2', {
			number: number,
			title: title
		});
	}else{

		courses.find({number: number}, {}, function(err, course){

			if(course.length != 0){
				req.flash('error', 'Course already submitted');
				res.redirect('/admin/adminindex/bucket2');
			}else{

				courses.insert({
					title: title,
					number: number,
					branch: branch,
					semester: semester
				});

				req.flash('success', 'Course submitted');
				res.location('/admin/adminindex/bucket2');
				res.redirect('/admin/adminindex/bucket2');
			}
		})

	}
});

var courseselect = [];

router.get('/adminindex/show/:id', function(req, res, next){
	var userid = req.params.id;

	var bucket1 = db.get('selectionbucket1');
	var bucket2 = db.get('selectionbucket2');
	var i;
	var yo;
	bucket1.find({_id: userid} , {}, function(err, bucket1details){
		if(bucket1details.length==0){
			req.flash('info', 'User already approved');
			res.redirect('/admin/adminindex/approve');
		}else{
			var priority = bucket1details[0].priority;
			i = priority.indexOf('1');
			yo = bucket1details[0].course[i].toString();
			courseselect.push({title: yo});

			bucket2.find({_id: userid}, {}, function(err, bucket2details){
					priority = bucket2details[0].priority;
					i = priority.indexOf('1');
					yo = bucket2details[0].course[i].toString();
					courseselect.push({title: yo});
					

					res.render('show', {
						courses: courseselect
					});
			});

		}
		
	});
});

router.get('/adminindex/approve/:id', function(req, res, next){
	var userid = req.params.id;
	var users = db.get('users');

	var bucket1 = db.get('selectionbucket1');
	bucket1.find({_id: userid} , {}, function(err, bucket1details){
		if(bucket1details.length==0){
			req.flash('info', 'User already approved');
			res.redirect('/admin/adminindex/approve');
		}else{


		 for(i=0; i<courseselect.length; i++){

			users.update({
				_id: userid
			}, {
				$push: {
					'course': courseselect[i]
				}
			});

		}

			delete courseselect;
			var bucket1 = db.get('selectionbucket1');
			var bucket2 = db.get('selectionbucket2');
			bucket1.remove({_id: userid});
			bucket2.remove({_id: userid});

			

			req.flash('success', 'Course Approved');
			res.location('/admin/adminindex/approve');
			res.redirect('/admin/adminindex/approve');


		}
})


});


router.get('/adminindex/disapprove/:id', function(req, res, next){
	var userid = req.params.id;
	var users = db.get('users');

	var bucket1 = db.get('selectionbucket1');
	bucket1.find({_id: userid} , {}, function(err, bucket1details){
		if(bucket1details.length==0){
			req.flash('info', 'User already disapproved');
			res.redirect('/admin/adminindex/approve');
		}else{


			var bucket1 = db.get('selectionbucket1');
			var bucket2 = db.get('selectionbucket2');
			bucket1.remove({_id: userid});
			bucket2.remove({_id: userid});

			

			req.flash('success', 'Course Approved');
			res.location('/admin/adminindex/approve');
			res.redirect('/admin/adminindex/approve');


		}
})


});

router.get('/adminindex/approve', function(req, res, next){

	var selectionbucket1 = db.get('selectionbucket1');
	var selectionbucket2 = db.get('selectionbucket2');
	var users = db.get('users');
	var object;
	users.find({type:'normal', semester: '6'}, {}, function(err, users){
		res.render('adminapprove', {
			title: 'Approve',
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