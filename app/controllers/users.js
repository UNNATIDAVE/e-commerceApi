// calling require modules

var mongoose = require('mongoose');
var express = require('express');
var uniqid = require('uniqid');
var events = require('events');

// Initializing modules
var eventEmitter = new events.EventEmitter();
var userRouter = express.Router();
var userModel = mongoose.model('userData');
var productModel = mongoose.model('productData');
var nodemailer = require('nodemailer');

//Cerate nodemailer to send welcome mail
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth :{
        user: 'testecommerce98@gmail.com',
        pass: 'support@123'
    }
});

// calling libraries and middlewares
var resGen = require('./../../library/resGenerator');
var myMiddlewares = require('./../../middlewares/myMiddleware');

module.exports.controller = function(app){

    // Redirect Login Page
    userRouter.get('/', function(req,res){
        res.redirect('/v1/users/loginPage');
    });

    // Login Page Code 

    userRouter.get('/loginPage', myMiddlewares.isLoggedIn, function(req, res){
        res.render('login'); // redirect to login.ejs page
    });

    // access data from login.ejs
    userRouter.post('/login', function(req, res){
        userModel.findOne({
            $and: [{
                'email' : req.body.email
            }, {
                'password': req.body.password
            }]
        }, function(err, foundUser){
            if(err){
                var errRes = resGen.generate(true, 'Error occured', 500, null);
                res.send(errRes);
            }
            else if(foundUser == undefined || foundUser.email == undefined || foundUser.password == undefined){

                var errRes= resGen.generate(true,'user data not found', 500, null);
                res.render('error',{
                    message: errRes.message,
                    status: errRes.status
                });
            }
            else{
                req.session.user = foundUser;
                delete req.session.user.password;
                res.redirect('/v1/users/dashboard');
            }
        });
    });         
    // End login Page

    // Signup page Code
    userRouter.get('/signupPage', myMiddlewares.isLoggedIn, function(req, res){
        res.render('signup');   // Redirect to signup.ejs page
    });

    // code to send email
    eventEmitter.on('welcomeMessage', function(message){
        var mailOptions = {
            from: 'testecommerce98@gmail.com',
            to: message.description.email,
            subject: 'Welcome User',
            html: '<h2>Hi'+message.description.firstName +',</h2><h2> Thank you for choosing us.</h2> <h4> Your Email ID : </h4>' + message.description.email + ' <h4> Your Password : </h4>' + message.description.password
        };

        transporter.sendMail(mailOptions, function(err, info){
            if(err){
                console.log(err);
            }
            else{
                res.redirect('/v1/users/dashboard');
            }
        });
    });

    // access data from signup.ejs
    userRouter.post('/signup', function(req,res){

        if(req.body.firstName != undefined && req.body.lastName != undefined && req.body.email != undefined && req.body.password != undefined){
            var userDetails = new userModel({
                userId: uniqid(),
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password
            });

            var phoneNo = {
                'primaryMobileNo':req.body.primaryPhone,
                'secondaryMobileNo': req.body.secondaryPhone
            };

            userDetails.mobileNumbers = phoneNo;

            var securityQues={
                'securityQuestion': req.body.securityQuestion,
                'securityAnswer': req.body.securityAnswer
            };

            userDetails.recoveryDetails = securityQues;

            //check for user's email address exist or not
            userModel.findOne({
                'email': req.body.email
            }, function(err, result){
                if(result){
                    var errRes = resGen.generate(true, 'Email ID is already Exist', 500, null);
                    res.send(errRes);
                }
                else{
                    userDetails.save(function(err){

                        if(err){
                            var errRes = resGen.generate(true, 'Some Error occured. Your Email ID is not exist', 500, null);
                            res.send(errRes);
                        }

                        else{
                            req.session.user = userDetails;
                            delete req.session.user.password;
                            // send mail to user
                            eventEmitter.emit('welcomeMessage', {
                                description: req.session.user
                            });
                            res.redirect('/v1/users/dashboard');
                        }
                    });
                }
            });
        }
        else{
            var errRes = resGen.generate(true,'Please fill the required field.', 500, null);
            res.render('error',{
                message: errRes.message,
                status: errRes.status
            });
        }
    });
    // End Signup page

    // Delete page code

    userRouter.get('/delete', function(req, res){
        res.render('userDelete'); //Redirect to userDelete.ejs page
    });

    // access data from userDelete.ejs page
    userRouter.post('/deleteUser', function(req, res){
        userModel.findOneAndRemove({
            userId: req.body.userId
        }, function(err, success){
            if(success){
                var successRes = resGen.generate(false, 'User deleted successfully', 200, success);
                res.send(successRes);
            }
            else{
                var errRes = resGen.generate(true, 'User not Found', 500, null);
                res.send(errRes);
            }
        });
    });
    // End Delete page

    // code for Dashboard
    userRouter.get('/dashboard', myMiddlewares.checkLogin, function(req,res){
        res.render('home',{
            user: req.session.user
        });
    });

    // code for add to cart 
    userRouter.get('/addToCart', myMiddlewares.checkLogin, function(req,  res){
        res.render('addToCart'); //Redirect to addToCart.ejs page
    });

     // code for remove from cart
    userRouter.get('/removeFromCart', myMiddlewares.checkLogin, function(req,  res){
        res.render('removeFromCart'); // Redirect to removeFromCart.ejs page
    });

    //Log Out page
    userRouter.get('/logout', function(req, res){
        req.session.destroy(function(err){
            res.redirect('/v1/users/loginPage');
        });
    });
 
    // code for password change
    userRouter.get('/changePassword', myMiddlewares.checkLogin, function(req, res){
        res.render('changePass'); //Redirect to changePass.ejs page
    });

    // Access data from changePass.ejs
    userRouter.post('/passwordPage',function(req, res){
        if(req.body.newPassword != req.body.reNewPassword){
            var successRes = resGen.generate(true,'Password does not match. Please enter correct password.',500, null);
            res.send(successRes);
        }
        else{
            var newPass = req.body.newPassword;
            userModel.findOneAndUpdate({
                $and: [{
                    'email': req.session.user.email
                },
                {
                    'password': req.body.oldPassword
                }]
            },{
                $set:{
                    password: newPass
                }
            },{
                new: true
            }, function(err, foundUser){
                if(err){
                    var errRes = resGen.generate(true, 'Some error occured',500, null);
                    res.send(errRes);
                }
                else if(foundUser == undefined || foundUser.email == undefined || foundUser.password == undefined){
                    var errRes = resGen.generate(true, 'check your password', 500, null);
                    res.render('error',{
                        message: errRes.message,
                        status: errRes.status
                    });
                }
                else{
                    req.session.user = foundUser;
                    delete req.session.user.password;

                    var mailOptions = {
                        from: 'testecommerce98@gmail.com',
                        to: req.session.user.email,
                        subject: 'Your account info has changed',
                        html: '<h4>The password for your account has been changed.</h4><h4> If you did NOT make this change, please sign in, change your password and contact us.</h4><h3> Your new Password is :' + foundUser.password + '</h3>'
                    };

                    transporter.sendMail(mailOptions, function(err, info){
                        if(err){
                            console.log(err);
                        }
                    });

                    var successRes = resGen.generate(true, 'Password change successfully', 500, foundUser);
                    res.send(successRes);
                }
            });
        }
    });


    // to get cart info
    userRouter.get('/cart', myMiddlewares.checkLogin, function(req, res){
        userModel.find({
            'email': req.session.user.email
        }, function(error, allProducts){
            if(error){
                var errRes = resGen.generate(true, 'Your cart is empty', 204, null);
                res.send(errRes);
            }
            else if(allProducts[0].cart){
                var successRes = resGen.generate(false, 'All products', 200, allProducts[0].cart);
                res.send(successRes);
            }
            else{
                var errRes = resGen.generate(true, 'Your cart is empty',204, null);
                res.send(errRes);
            }
        });
    });

    //code to get all Users informations
    userRouter.get('/allInfo', function(req, res){
        userModel.find({}, function(err, allUsers){
            if(err){
                var errRes = resGen.generate(true, 'some error occured', 500, null);
                res.send(errRes);
            }
            else{
                var successRes = resGen.generate(false, 'All Users', 200, allUsers);
                res.send(successRes);
            }
        });
    });

    //Get perticuler user detail
    userRouter.get('/:userId', function(req, res){
        userModel.findOne({
            'userId' : req.params.userId
        }, function(err, foundUser){
            if(foundUser){
                var successRes = resGen.generate(false, 'user found', 200, foundUser);
                res.send(successRes);
            }
            else{
                var errRes = resGen.generate(true,'user not found', 500, null);
                res.send(errRes);
            }
        });
    });

    // forgot password screen

    userRouter.get('/forgot/password', function(req, res){
        res.render('forgot');    //Redirect to forgot.ejs page
    }); 

    // Access data from forgot.ejs
    userRouter.post('/recoverPass', function(req, res){
       userModel.findOne({
        'email': req.body.email
       }, function(err, foundUser){
        if(err){
            var errRes = resGen.generate(true, 'email not found', 500, null);
            res.send(errRes);
        }

        else if(foundUser == undefined || foundUser.email == undefined){
            var errRes = resGen.generate(true, 'email not found', 500, null);
            res.render('error', {
                message: errRes.message,
                status: errRes.status
            });
        }

        else{
            var mailOptions = {
                to: req.body.email,
                subject: 'Password recovery Request',
                html: '<h2> A request was recieved to reset you password, Please contact us if you didnot request the reset your password. </h2></br> <h4> Your Password is : </h4>' + foundUser.password
                };

                transporter.sendMail(mailOptions, function(err,info){
                    if(err){
                        console.log(err);
                    }
                    else{
                        res.redirect('/v1/users/loginPage');
                    }
                });
            }
       }); 
    });
    // End forgot password page

    
    // Access data from addToCart.ejs page
    userRouter.post('/cart/add', function(req, res){
        var productId = req.body.productId;

        productModel.findOne({
            'productId': productId
        }, function(err,productFound){
            if(productFound){
                userModel.findOne({
                    $and: [{
                        'email': req.session.user.email
                    }, {
                        'cart.productId': productId
                    }]
                }, function(err,productFoundInCart){
                    if(productFoundInCart){
                        var errRes = resGen.generate(true, 'Product already added to your cart',200,null);
                        res.send(errRes);
                    }
                    else{
                        var createCart ={
                            'cart': productFound
                        };
                        userModel.findOneAndUpdate({
                            'email': req.session.user.email
                        }, {
                            $push: createCart
                        },
                        function(err,success){
                            if(err){
                                var errRes = resGen.generate(true, 'some Error occured', 500, null);
                                res.send(errRes);
                            }
                            else{
                                var successRes = resGen.generate(false, 'Product has been added to the cart', 200, success);
                                res.send(successRes);
                            }
                        });
                    }
                });
            }
            else{
                var errRes = resGen.generate(true, 'Product ID not found', 500, null);
                res.send(errRes);
            }
        });
    });
    // End Add to cart page


   

    // Access data from removeFromCart.ejs page
    userRouter.post('/cart/remove', function(req, res){
        var productsId = req.body.productId;

        productModel.findOne({
            'productId': productsId
        }, function(err, productFound){
            if(productFound){
                var removeCart = {
                    'cart': {
                        'productId': productsId
                    }
                };

                userModel.findOne({
                    $and:[{
                        'email': req.session.user.email
                    }, {
                        'cart.productId': productsId
                    }]
                }, function(err, productFoundInCart){
                    if(productFoundInCart){
                        userModel.update({
                            'email': req.session.user.email
                        }, {
                            $pull: removeCart
                        }, function(err, success){
                            if(success){
                                var successRes = resGen.generate(false, 'Product successfully removed from your cart', 200, success);
                                res.send(successRes);
                            }
                        });
                    }else {
                        var errRes = resGen.generate(true, 'This Product is not in you cart', 500, null);
                        res.send(errRes);
                    }
                });
            }
            else{
                var errRes = resGenerator.generate(true, 'Product ID does not exist', 500, null);
                res.send(errRes);
            }
        });
    });
    // End Remove form cart page
    app.use('/v1/users', userRouter);
}