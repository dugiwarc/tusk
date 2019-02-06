var Favor = require('../models/favor');
var Review = require('../models/review');
var User = require('../models/user');


var middlewareObj = {};

middlewareObj.checkFavorOwnership = function(req, res, next){
      if (req.isAuthenticated()) {
          Favor.findById(req.params.id, function (err, foundFavor) {
              if (err) {
                  req.flash("error", "Favor not found.")
                  res.redirect("back");
              } else {
                  console.log(foundFavor.author.id);
                  console.log(req.user._id);
                  if (foundFavor.author.id.equals(req.user._id)) {
                      next();
                  } else {
                      req.flash("error", "You do not have permission to do that.");
                      res.redirect("back");
                  }
              }
          });
      } else {
          req.flash("error", "You do not have permission to do that.");
          res.redirect("back");
      }
};

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Review.findById(req.params.review_id, function (err, foundReview) {
            if (err || !foundReview) {
                req.flash("error", "Review not found.")
                res.redirect("back");
            } else {
                if (foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You do not have permission to do that.");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You do not have permission to do that.");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function(req, res, next){
    if(req.isAuthenticated()){
        User.findById(req.params.id).populate("reviews").exec(function (err, foundUser){
            if(err || !foundUser){
                req.flash("error", "User not found");
                res.redirect("back");
            } else {
                var foundUserReview = foundUser.reviews.some(function(review){
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview){
                    req.flash("error", "You can only add one review.");
                    return res.redirect("back");
                }
                next();
            }
        });    
    } else {
        req.flash("error", "You need to login first");
        res.redirect("back");
    }
};

middlewareObj.checkUserOwnership = function(req, res, next){
    if (req.isAuthenticated()) {
        User.findById(req.params.id, function (err, foundUser) {
            if (err) {
                req.flash("error", "User not found");
                res.redirect("back");
            } else {
                if (foundUser._id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You do not have permission to do that.");
                    res.redirect("back");
                  }
              }
          });
      } else {
          req.flash("error", "You do not have permission to do that.");
          res.redirect("back");
      }
};


middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    } else {
        req.flash("error", "Please login first!");
        res.redirect("/login");
    }


};

module.exports = middlewareObj;