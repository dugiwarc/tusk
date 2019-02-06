var mongoose              = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var bcrypt                = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
  isAdmin: {
    type: Boolean,
    default: false
  },
  email: String,
  coordinates: Array,
  image: String,
  city: String,
  interested_city: String,
  imageId: String,
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }
  ],
  interest_notifications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  message_notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification'
      }],
      followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
  name: String,
  qualifications: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  phone_number: String,
  gender: String,
  username: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  surname: String,
  password: String,
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref : "Review"
    }
  ],
  rating: {
    type: Number,
    default: 0
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }],
    sent_messages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }],
      received_messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
      }],

  favors : [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favor"
    }
  ],

  posted_favors : [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favor"
    }
  ],
  
    interests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favor"
    }],

      active_favors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Favor"
      }]

});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
