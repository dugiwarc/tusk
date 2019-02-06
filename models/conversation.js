var mongoose = require('mongoose');

var conversationSchema = new mongoose.Schema({
  author : {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "User"
        },
    username: String
  },
  users: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  messages: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "Message"
  }
});

module.exports = mongoose.model("Conversation", conversationSchema);
