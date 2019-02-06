var mongoose = require('mongoose');

var reviewSchema = new mongoose.Schema({
  text: {
    type: String
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "User"
    },
    username: String
  },
  rating: {
    type: Number,
    required: "Please provide a rating (1-5 stars).",
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value."
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "User"
  }, 
},
  {
    timestamps: true
  });

// link/export to app.js
module.exports = mongoose.model("Review", reviewSchema);
