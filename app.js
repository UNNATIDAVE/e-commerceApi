// Including all the require modules and intializing it
var express = require('express');
var app = express();

var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var logger = require('morgan');
var path = require('path');

app.use(logger('dev'));

app.use(bodyParser.json({
    limit: '10mb',
    extended: true
}));
app.use(bodyParser.urlencoded({
    limit: '10mb',
    extended: true
}));

app.use(cookieParser());

// cookies detail
app.use(expressSession({
	name : "user_cookies",
	secret : "user_secret",
	httpOnly : true,
	resave: true,
	saveUninitialized : true,
	cookie : {
		secure: false
	}
}));

app.set('view engine','ejs'); // for Tempalating engine
app.set('views', path.join(__dirname + '/app/views'));

var dbPath = "mongodb://localhost/eCommerce";
var db = mongoose.connect(dbPath);

mongoose.connection.once('open', function(){
	console.log("Database connected successfull.");
});

var fs = require('fs');

fs.readdirSync('./app/models').forEach(function(file){
	if(file.indexOf('.js')){
		require('./app/models/' + file);
	}
});

fs.readdirSync('./app/controllers').forEach(function(file){
	if(file.indexOf('.js')){
		var route = require('./app/controllers/' +file);
		route.controller(app);
	}
});

var auth = require('./middlewares/myMiddleware');
var userModel = mongoose.model('userData');

app.use(function(request,response,next){
	if(request.session && request.session.user){
		userModel.findOne({
			'email' : request.session.user.email
		}, 
		function(error, user){
			if(user){
				request.user = user;
				delete request.user.password;
				request.session.user = user;
				next();
			}
			else{
				console.log(error);
			}
		});
	}
	else{
		next();
	}
});

app.get('/', function(request, response){
	response.redirect('/v1/user/loginPage');
});

// Error handler
app.get('*', function(request, response, next) {

    response.status = 404;
    next("Page not found. Please enter a valid URL");
});

//Error handling and app level middleware 
app.use(function(error, request, response, next) {

    console.log("Error handler used");
    console.log(error);

    if (response.status == 404) {
        response.send("Please, Check your Path. Refer documentation for API Info");
    } else {
        response.send(error);
    }
});

app.listen(3000, function() {
    console.log('E-commerce API listening on port 3000!');
});