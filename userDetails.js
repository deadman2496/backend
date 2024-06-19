const mongoose = require('mongoose');

// Define the schema
const UserSchema = new mongoose.Schema({
    userName: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    confirmpassword: {type: String, required: true}
});

// Pre-save middleware to convert email to lowercase
UserSchema.pre('save', function(next) {
    this.email = this.email.toLowerCase();
    next();
});

// Create a case-insensitive index for the email field
UserSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const UserModel = mongoose.model('users', UserSchema);

module.exports = UserModel;