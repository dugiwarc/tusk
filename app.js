var express         = require('express'),
    bodyParser      = require('body-parser'),
    mongoose        = require('mongoose'),
    passport        = require('passport'),
    LocalStrategy   = require('passport-local'),
    methodOverride  = require('method-override'),
    Favor           = require('./models/favor'),
    User            = require('./models/user'),
    Message         = require('./models/message'),
    Review          = require('./models/review'),
    Conversation    = require('./models/conversation'),
    Notification    = require('./models/notification'),
    socket          = require('socket.io'),
    flash           = require('connect-flash');
    keyPublishable  = 'pk_test_K3VJ6ZLvLKdhLaJTglAd65Qk',
    keySecret       = 'sk_test_97z59dQM80mu9pVrQKxwaWyD',
    stripe          = require('stripe')(keySecret),
    mbxGeocoding    = require('@mapbox/mapbox-sdk/services/geocoding'),
    geocodingClient = mbxGeocoding({ accessToken: 'pk.eyJ1IjoiZHVnaXdhcmMiLCJhIjoiY2pydDdmdjFtMGZlNjRhdGNreWQ1aW5mZSJ9.IJrnij1QFJbk2r_618xlUg' });


var userRoutes      = require('./routes/users'),
    favorRoutes     = require('./routes/favors'),
    indexRoutes     = require('./routes/index'),
    messRoutes      = require('./routes/messages'),
    revRoutes       = require('./routes/reviews'),
    miscRoutes      = require('./routes/misc');


var app = express();

mongoose.connect("mongodb://localhost:27017/tusky", {useNewUrlParser:true});

// a line we will see all the time
app.use(bodyParser.urlencoded({extended: true}));
// so that we avoid adding .ejs when rendering a page

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// _method custom up to us
app.use(methodOverride("_method"));
// body parser allows us to use req. in order to take in info from the input 
app.use(require('body-parser').urlencoded({extended: false}));
app.use(flash());
console.log(__dirname);


// passport configuration
app.use(require('express-session')({
  secret: "1234",
  resave: false,
  saveUninitialized: false
}));

app.locals.moment = require('moment');

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// whatever function we pass it, will work on every route
// middleware (instead of passing along rendering pages)
app.use(async function(req, res, next){
  res.locals.currentUser = req.user;
  // if anyone is logged in via passport
  if(req.user) {
    try {
      // get array of unread notifications
      let user = await User.findById(req.user._id).populate('notifications', null, {
        isRead: false
      }).populate('message_notifications', null, {
        isRead: false
      }).populate('interest_notifications', null, {
        isRead: false
      }).exec();
      
      res.locals.notifications = user.notifications.reverse();
      res.locals.message_notifications = user.message_notifications.reverse();
      res.locals.interest_notifications = user.interest_notifications.reverse();
    } catch(err) {
      console.log(err.message);
    }
  }
  res.locals.error       = req.flash("error");
  res.locals.success     = req.flash("success");
  res.locals.note        = req.flash("note");
  next();
});

// final touch to linking routes to the app.js
app.use(indexRoutes);
app.use(userRoutes);
app.use(favorRoutes);
app.use(messRoutes);
app.use(revRoutes);
app.use(miscRoutes);

app.post('/charge', function (req, res) {
  var amount = 500;

  stripe.customers.create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken
    })

    .then(customer =>
      stripe.charges.create({
        amount,
        description: "Sample Charge",
        currency: "usd",
        customer: customer.id
      }))
    .then(charge => res.render('charge'));
});

app.listen(process.env.PORT || 3000, process.env.IP, function(){
  console.log("The Tusk Server has started...");
});
