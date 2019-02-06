var mongoose = require('mongoose');

var favorSchema = new mongoose.Schema({
  task: String,
  price: String,
  description: String,
  image: {
    type: String,
    default: "/pics/favor.png"
  },
  imageId: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "User"
    },
    username: String,
    task: String
  }
},
  {
    timestamps: true
  });

module.exports = mongoose.model("Favor", favorSchema);
