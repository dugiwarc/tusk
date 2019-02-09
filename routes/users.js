
var mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
var geocodingClient = mbxGeocoding({ accessToken: 'pk.eyJ1IjoiZHVnaXdhcmMiLCJhIjoiY2pydDdmdjFtMGZlNjRhdGNreWQ1aW5mZSJ9.IJrnij1QFJbk2r_618xlUg' });
var express       = require('express');
var multer        = require('multer');
var passport      = require('passport');
var User          = require('../models/user');
var Message       = require('../models/message');
var Review        = require('../models/review');
var Notification  = require('../models/notification');
var Favor         = require('../models/favor');
var Conversation  = require('../models/conversation');
var middleware    = require('../middleware');
var router        = express.Router();

var storage = multer.diskStorage({
  filename: function(req, file, callback){
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function(req, file, cb){
  if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dugiwarc',
  api_key: '266892371552875',
  api_secret: 'KPuc3ggLVjzoQSQMAhgLxEt4p8k'
});

// finds all users and outputs them on the page
router.get("/users", function(req, res){
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    User.find({$or:[{username: regex},{name: regex}, {surname: regex}, {city: regex}]}, function(err, allusers){
      if(err){
        console.log(err);
      } else {
        var noMatch;
        if(allusers.length < 1){
          noMatch = "No user matching that criterion";
        }
        res.render("users/users", {users: allusers, noMatch: noMatch});
      }
    });
  } else {
    User.find({}, function(err, allusers){
      if(err){
        console.log(err);
      } else {
        res.render("users/users",
        {users: allusers});
      }
    });
  }
});


router.post("/users", function(req, res){
  User.create(req.body.user, function(err, newlyCreated){
    if(err){
      console.log(err);
    } else {
      console.log("User created");
      res.redirect("/users");
    }
  });
});

// show edit page
router.get("/users/:id/edit", middleware.checkUserOwnership, function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      res.redirect("/users");
    } else {
      res.render("users/edit", {user: foundUser});
    }
  });
});


// update user profile
router.put("/users/:id", middleware.checkUserOwnership, upload.single('image'),function (req, res) {

  if(req.file){
    cloudinary.uploader.upload(req.file.path, function (result) {
      // add cloudinary url for the image to the campground object under image property
      req.body.user.image = result.secure_url;
      // add author to campground
      User.findById(req.params.id, async function(err, updateUser){
      if(err){
        res.redirect("/users");
      } else {
        let response = await geocodingClient
          .forwardGeocode({
            query: req.body.user.city,
            limit: 1
          })
          .send();
        var coordinates = response.body.features[0].geometry.coordinates;
        updateUser.image = req.body.user.image;
        updateUser.name = req.body.user.name;
        updateUser.surname = req.body.user.surname;
        updateUser.username = req.body.user.username;
        updateUser.city = req.body.user.city;
        updateUser.coordinates = coordinates;
        updateUser.save();
        res.redirect("/users/" + req.params.id);
      }
    });
    });
  } else {
          User.findById(req.params.id,async function (err, updateUser) {
            if (err) {
              res.redirect("/users");
            } else {
              let response = await geocodingClient
                .forwardGeocode({
                  query: req.body.user.city,
                  limit: 1
                })
                .send();
              var coordinates = response.body.features[0].geometry.coordinates;
              updateUser.name = req.body.user.name;
              updateUser.surname = req.body.user.surname;
              updateUser.username = req.body.user.username;  
              updateUser.city = req.body.user.city;
              updateUser.coordinates = coordinates;
              updateUser.save();
              res.redirect("/users/" + req.params.id);
            }
          });
    }
});

// show user profile
router.get("/users/:id",async function(req, res){
  try {
    let user = await User.findById(req.params.id).populate({
      path: 'reviews',
      options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).populate('followers').populate('messages').exec();
    res.render('users/test_show_user', { user });
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

// event: follow_link
router.get('/follow/:id', middleware.isLoggedIn, async function(req, res){
  try {
    let user = await User.findById(req.params.id);
    user.followers.push(req.user._id);
    user.save();
    req.flash('success', 'Successfully followed ' + user.username + '!');
    res.redirect('back');
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// router.get('/follow_city/:id', middleware.isLoggedIn, async function(req, res){
//   try {
//     let city = await City.findBy(req.city._id);

//   }
// });

// view all notifications
router.get('/notifications', middleware.isLoggedIn, async function(req, res){
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: { sort: { "_id": -1 }}
    }).populate({
            path: 'message_notifications',
              options: {
                sort: {
                  "_id": -1
                }
              }
    }).exec();
    let allNotifications = user.notifications;
    let allmessageNotifications = user.message_notifications;
    res.render('notifications/index', { allNotifications, allmessageNotifications });
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// handle notifications
router.get('/notifications/:id', middleware.isLoggedIn, async function(req, res){
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/favors/${notification.favorId}`);
  } catch(err) { 
    req.flash('error', err.message);
    res.redirect('back');
  }
});

router.get('/message_notifications/:id', middleware.isLoggedIn, async function (req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/users/${notification.messageId}/messages`);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

router.get('/interest_notifications/:id', middleware.isLoggedIn, async function (req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/favors/${notification.interestId}`);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});


// user profile delete
router.delete("/users/:id", middleware.checkUserOwnership, function(req, res){
  User.findByIdAndRemove(req.params.id, function(err, user){
    if(err){
      res.redirect("/users");
    } else {
      // deletes all messages associated with the user
      Message.remove({"_id":{$in: user.messages}}, function(err){
        if(err){
          console.log(err);
          return res.redirect("/users");
        }
        Review.remove({"_id": {$in: user.reviews}}, function(err){
          if(err){
            console.log(err);
            return res.redirect("/users");
          }
          user.remove();
          req.flash("success", "User deleted successfully!");
          res.redirect("/favors");
        });
      });
    }
  });   
});

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

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
