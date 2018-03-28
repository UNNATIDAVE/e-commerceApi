exports.checkLogin = function(request, response, next){
	if(!request.session.user){
		response.redirect('/v1/users/loginPage');
	}
	else{
		next();
	}
}

exports.isLoggedIn = function(request, response, next) {
	if(request.session.user){
		response.redirect('/v1/users/dashboard');
	}  

	else {
		next();
	}
}