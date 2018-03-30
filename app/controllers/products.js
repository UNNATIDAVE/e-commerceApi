// Including all require modules
var express = require('express');
var mongoose = require('mongoose');
var uniqid = require('uniqid');

var productRouter = express.Router();

// Calling mongoose module for user and products
var userModel = mongoose.model('userData');
var productModel = mongoose.model('productData');

// Calling require Library
var resGen = require('./../../library/resGenerator');

module.exports.controller = function(app){

    productRouter.get('/createPage', function(req, res){
        res.render('addProduct');
    });
    productRouter.get('/deletePage', function(req, res){
        res.render('deleteProduct');
    });

    // Create a product
    productRouter.post('/create', function(req,res){

        if(req.body.productName != undefined && req.body.productPrice != undefined && req.body.productDescription != undefined && req.body.sellerName != undefined && req.body.sellerAddress != undefined && req.body.sellerContactNumber != undefined){

            var productDetails = new productModel({
                productId: uniqid(),
                productName: req.body.productName,
                productPrice: req.body.productPrice,
                productDescription: req.body.productDescription
            });

            var sellerDetails = {
                'sellerId': uniqid(),
                'sellerName': req.body.sellerName,
                'sellerAddress': req.body.sellerAddress,
                'sellerContactNumber': req.body.sellerContactNumber
            };

            productDetails.productSeller = sellerDetails;

            var categories = (req.body.productCategory != undefined && req.body.productCategory != null) ? req.body.productCategory.split(',') : '';

            productDetails.productCategory = categories;

            productDetails.save(function(err){
                if(err){
                    var errRes = resGen.generate(true,'Please, Fill the require details.', 500, null);
                    res.render('error',{
                        message: errorResponse.message,
                        status: errorResponse.status
                    });
                }
                else{
                    var successRes = resGen.generate(false, 'Product hase been added successfully.', 200, productDetails);
                    res.send(successRes);
                }
            });

        }
        else{
            var errRes = resGen.generate(true, 'Please, Fill the require details.', 500, null);
            res.send(errRes);
        }
    });

    // view all products

    productRouter.get('/all/items', function(req,res){
        productModel.find({}, function(err, allProducts){
            if(err){
                var errRes = resGen.generate(true, 'Some error occured',500, null);
                res.send(errRes);
            }
            else{
                var successRes = resGen.generate(false, 'All Products are as below', 200 , allProducts);
                res.send(successRes);
            }
        });
    });

    //Find a single product

    productRouter.get('/:productId', function(req,res){
        productModel.findOne({
            'productId': req.params.productId
        },
        function(err, foundProduct){
            if(foundProduct){
                var successRes = resGen.generate(false, 'Product found', 200, foundProduct);
                res.send(successRes);
            }
            else{
                var errRes = resGen.generate(true,'Product not found', 500, null);
                res.send(errRes);
            }
        });
    });

    // Delete Products

    productRouter.post('/delete', function(req, res){
        productModel.findOneAndRemove({
            productId: req.body.id
        }, function(err,success){
            if(success){
                var successRes = resGen.generate(false, 'Product deleted successfully', 200, success);
                res.send(successRes);
            }
            else{
                var errRes = resGen.generate(true, 'Product not found', 500, null);
                res.send(errRes);
            }
        });
    });

    // Find Product's seller details

    productRouter.get('/seller/:sellerId', function(req, res){
        productModel.findOne({
            'productSeller.sellerId': req.params.sellerId
        }, function(err,success){
            if(success){
                var successRes = resGen.generate(false,'Seller found successfully', 200, success);
                res.send(successRes);
            }
            else{
                var errRes = resGen.generate(true, 'Seller not found', 500, null);
                res.send(errRes);
            }
        });
    });

    app.use('/v1/products',productRouter);
}