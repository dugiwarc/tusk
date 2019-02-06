var mongoose = require('mongoose');

var enquirySchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String
},{
    timestamps: true
});

module.exports = mongoose.model("Enquiry", enquirySchema);