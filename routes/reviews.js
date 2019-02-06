var express = require('express');
var passport = require('passport');
var router = express.Router({mergeParams: true});
var User = require('../models/user');
var Message = require('../models/message');
var Review = require('../models/review');
var Favor = require('../models/favor');
var Notification = require('../models/notification');
var Conversation = require('../models/conversation');
var middleware = require('../middleware');

router.post("/users/:id/reviews", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // lookup user using id
    User.findById(req.params.id).populate("reviews").exec(function (err, user) {
        if (err) {
            console.log(err);
            redirect("/users");
        } else {
            if (user._id.equals(req.user._id)) {
                res.send("Can't do that");
            } else {
                Review.create(req.body.review, async function (err, review) {
                    if (err) {
                        console.log(err);
                    } else {
                        // define newNotification with an username and an reviewID
                        let newNotification = {
                            username: req.user.username,
                            reviewId: review.id
                        }
                        let notification = await Notification.create(newNotification);
                        user.notifications.push(notification);                        
                        review.author.id = req.user._id;
                        review.author.username = req.user.username;
                        review.user = user;
                        review.save();
                        user.reviews.push(review);
                        user.rating = calculateAverage(user.reviews);
                        user.save();
                        req.flash("success", "Review successfully posted.");
                        res.redirect("/users/" + user._id);
                    }
                });
            }
        }
    });
});


// reviews form
router.get("/users/:id/reviews/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // find user by id
    User.findById(req.params.id, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            if (user._id.equals(req.user._id)) {
                req.flash("error", "You do not have permission to do that.");
            } else {
                res.render("reviews/new_review", {
                    user: user
                });
            }
        }
    });
});

// assigned review based on the lookup in the loop session when added a link to an id
router.get("/users/:id/reviews/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, review) {
            res.render("reviews/edit_review", {
                user_id: req.params.id,
                review: review
            });
    });
});

router.put("/users/:id/reviews/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            console.log("yo");
        } else {
            User.findById(req.params.id).populate("reviews").exec(function(err, user){
                if (err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
                user.rating = calculateAverage(user.reviews);
                user.save();
                req.flash("success", "Review successfully edited.");
                res.redirect("/users/" + req.params.id);
            });
        }
    });
});


router.delete("/users/:id/reviews/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            console.log(err);
        } 
        User.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function(err, user){
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            } 
            user.rating = calculateAverage(user.reviews);
            user.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/users/" + req.params.id);
        });
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

module.exports = router;