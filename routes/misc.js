var express             = require('express'),
    router              = express.Router(),
    User                = require('../models/user'),
    Favor               = require('../models/favor'),
    Notification        = require('../models/notification');


router.get("/drum_kit", function(req, res){
    res.render("misc/drum_kit");
});

router.get("/web_cam_fun", function (req, res) {
    res.render("misc/web_cam_fun");
});

router.get("/favors/:id/interests", function(req, res){
    Favor.findById(req.params.id, function(err, favor){
        if(err){
            console.log(err);
        } else {
            User.findById(favor.author.id, async function(err, user){
                if(err){
                    console.log(err)
                } else {
                    let newNotification = {
                        username: req.user.username,
                        interestId: favor.id
                    }
                    let notification = await Notification.create(newNotification);
                    user.interest_notifications.push(notification);
                    user.save();
                    req.user.interests.push(favor);
                    req.flash('success', 'Interest registered. Await contact from the author.');
                    res.redirect('back');
                }
            });
        }
    });
});

router.get("/negotiations", function(req, res){
    res.send("The author has been notified of your request.");
});
module.exports = router;