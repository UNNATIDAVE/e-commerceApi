// calling mongoose model
var mongoose = require('mongoose');

// creating and defining new mongoose schema for users
var Schema = mongoose.Schema;

var userSchema = new Schema({
	userId          : {type:String, default:'',required:true, unique:true}, 
    firstName       : {type:String,default:'',required:true}, 
    lastName        : {type:String,default:'',required:true}, 
    email           : {type:String,required:true}, 
    password        : {type:String,default:'',required:true}, 
    mobileNumbers   : {},  
    recoveryDetails : {},  
    walletInfo      : {},  
    savedAddress    : {}, 
    savedCards      : {},
    cart            : {},
});

mongoose.model('userData', userSchema);