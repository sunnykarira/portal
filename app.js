var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

//Custom
var expressValidator = require('express-validator');
//


var cookieParser = require('cookie-parser');

//Custom
var session = require('express-session');
//

var bodyParser = require('body-parser');

//Custom
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');
var multer = require('multer');
var flash = require('connect-flash');
//

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.locals.moment = require('moment');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//Custom
//Handle File Uploads and Multipart Data
app.use(multer({dest: './public/images/uploads'}));
//

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


//Custom
//Express Session
// If a production application do not use secret
app.use(session({
  secret: 'secret',
  saveUnitialized: true,
  resave: true
}));

//Express validator
// so that we have nice and pretty messages
app.use(expressValidator({

  errorFormattor: function(param, msg, value){
    var namespace = param.split('.'),
    root = namespace.shift(),
    formParam = root;

    while(namespace.length){
      formParam+= '[' + namespace.shift() + ']';
    }

    return{
      param: formParam,
      msg: msg,
      value: value
    };
  }
}));
//


app.use(express.static(path.join(__dirname, 'public')));

//Custom
//Connect Flash so that we get a message over a session
app.use(flash());
app.use(function (req, res, next){
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//User available at all pages
app.get('/*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

//Make db accesible to our router
app.use(function(req, res, next){
  req.db = db;
  next();
});

//



app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
