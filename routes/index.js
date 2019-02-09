require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });



var mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
var geocodingClient = mbxGeocoding({ accessToken: 'pk.eyJ1IjoiZHVnaXdhcmMiLCJhIjoiY2pydDdmdjFtMGZlNjRhdGNreWQ1aW5mZSJ9.IJrnij1QFJbk2r_618xlUg' });
var express       = require('express');
var router        = express.Router();
var passport      = require('passport');
var async         = require('async');
var keyPublishable    = process.env.PUBLISHABLE_KEY;
var Enquiry       = require('../models/enquiry');
var nodemailer    = require('nodemailer');
var User          = require('../models/user');
var crypto        = require('crypto');
var fs            = require('fs');
var cities        = require('all-the-cities');


router.get("/", function(req, res){
  // res.send('this will be the landing page!');
  res.render("landing", {keyPublishable});
});

// authorization routes
router.get("/register", function(req, res){
  res.render("register");
});

router.post("/register",async function(req, res){

      let response = await geocodingClient
        .forwardGeocode({
          query: req.body.location,
          limit: 1
        })
        .send();
  var coordinates = response.body.features[0].geometry.coordinates;
  console.log(coordinates);
  // res.send("Signing you up");
  var newUser = new User({
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    username: req.body.username,
    gender: req.body.gender,
    coordinates: coordinates,
    city: req.body.location
  });
  // if(req.body.adminCode === '1111'){
    //   newUser.isAdmin = true;
    // }
    User.register(newUser, req.body.password,function(err, user){

      if(err){
        req.flash("error", "That didn't work.");
        console.log(err);
      }
      passport.authenticate("local")(req, res, function(){
      req.flash("success", "Welcome to Tusk!");
      res.redirect("/favors");
    });
  });
});

// file storing
router.get('/faq', function(req, res){
  var readStream = fs.createReadStream('./public/pics/natural.png');
  res.writeHead(200, {
    'Content-type': 'image/png'
  });
  readStream.pipe(res);
});   

router.get("/login", function(req, res){
  res.render("login");
});
 
router.post("/login", passport.authenticate("local",
{
  successRedirect: "/favors",
  failureRedirect: "/login"
}), function(req, res){
});

router.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

router.get('/forgot', function (req, res) {
  res.render('forgot');
});

router.get('/chat', function (req, res) {
  res.render('reviews/chat_test');
});

router.post('/chat', function (req, res) {
  Enquiry.create(req.body.enquiry, function(err, enquiry){
    if(err){
      console.log(err);
    } else {
      req.flash('success', 'Message well received.')
      res.redirect('/');
    }
  })
});

router.post('/forgot', function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({
        email: req.body.email
      }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'learntocodeinfo@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'learntocodeinfo@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function (req, res) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      token: req.params.token
    });
  });
});

router.post('/reset/:token', function (req, res) {
  async.waterfall([
    function (done) {
      User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if (req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          })
        } else {
          req.flash("error", "Passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'learntocodeinfo@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'learntocodeinfo@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) {
    res.redirect('/favors');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

function calculateAverage(reviews) {
  if (reviews.length === 0) {
    return 0;
  }
  var sum = 0;
  reviews.forEach(function (element) {
    sum += element.rating;
  });
  return sum / reviews.length;
}

module.exports = router;
