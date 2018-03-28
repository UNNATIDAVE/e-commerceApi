// calling mongoose model
var mongoose = require('mongoose');

// creating and defining new mongoose schema for products
var Schema = mongoose.Schema;

var productSchema = new Schema({

	productId              :  {type:String,default:'',required:true}, 
	productImage	       :  {type:String,default:''},
    productName            :  {type:String,default:'',required:true},
    productCategory        :  [], 
    productPrice           :  {type:String,default:'',required:true}, 
    productDescription     :  {type:String,default:'',required:true}, 
    productSpecifications  :  {}, 
    productSeller          :  {}

});


mongoose.model('productData',productSchema);
