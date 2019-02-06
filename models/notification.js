var mongoose = require('mongoose');

var notificationSchema = new mongoose.Schema({
    username: String,
    messageId: String,
    reviewId: String,
    favorId: String,
    interestId: String,
    isRead: {
        type: Boolean,
        default: false
    }
},
  {
      timestamps: true
  });

module.exports = mongoose.model('Notification', notificationSchema);