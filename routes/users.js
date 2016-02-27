var express = require('express');
var router = express.Router();

/* GET users listing. */
/*router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});*/

// GET /users/login
router.get('/login', function(req, res){
	res.render('login', {
		title: "Login"
	});
});

// GET /users/register
router.get('/register', function (req, res){
	res.render('register', {
		title: "Register"
	});

});



module.exports = router;
