exports.generate = function(error, message, status, data){
	
	var myRes = {

		error	: error,
		message	: message,
		status	: status,
		data	: data
	};
	return myRes;
}