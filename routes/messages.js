var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../models/user');
var Message = require('../models/message');
var Review = require('../models/review');
var Favor = require('../models/favor');
var Notification = require('../models/notification');
var Conversation = require('../models/conversation');
var middleware = require('../middleware');

// test
router.get("/convo", function(req, res){
    res.render("messages/new_convo");
});



// POST A MESSAGE AND SAVE TO AUTHOR AND USER
router.post("/users/:id/messages", function (req, res) {
    // lookup user using idea
    User.findById(req.params.id, function (err, user) {
        if (err) {
            console.log(err);
            redirect("/users");
        } else {
            Message.create(req.body.message, async function (err, message) {
                if (err) {
                    console.log(err);
                } else {
                    let newNotification = {
                        username: req.user.username,
                        messageId: req.user.id
                    }
                    let notification = await Notification.create(newNotification);
                    user.message_notifications.push(notification);
                    message.sender.id = req.user._id;
                    message.receiver.id = user._id;
                    message.sender.username = req.user.username;
                    message.receiver.username = user.username;
                    message.messages = req.body.text;
                    req.user.sent_messages.push(message);
                    console.log(req.user);
                    user.received_messages.push(message);
                    message.save();
                    user.messages.push(message);
                    user.save();
                    res.redirect("/users/" + req.params.id + "/messages/new");
                }
            });
            // Conversation.create()
        }
    });
});                     

// SHOW  User's Messages
router.get("/users/:id/messages", middleware.isLoggedIn, function (req, res) {

    // find user by id
    Message.find({}, function (err, message) {
    if (err) {
        console.log(err);
    } else {
        User.findById(req.params.id, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                User.find({}, function (err, allusers){
                    if(err){
                        console.log(err);
                    } else {
                        res.render("messages/show_messages", {
                            user: user,
                            message: message,
                            allusers: allusers
                        });
                    }
                })
            }
        });
    }
    });
    });

// messages form
router.get("/users/:id/messages/new", middleware.isLoggedIn, function (req, res) {
    // find user by id
    Message.find({}, function (err, message) {
        if (err) {
            console.log(err);
        } else {
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("messages/new_message", {
                        user: user,
                        message: message
                    });
                }
            });
        }
    });
});

// router.get('/chat', function(req, res){
//     res.render('../public/chat');
// });

router.get("/users/:id/conversation/:conversation_id", function (req, res) {
    Message.find({}, function (err, message) {
        if (err) {
            console.log(err);
        } else {
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("messages/convo", {
                        user: user,
                        message: message
                    });
                }
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

module.exports = router;