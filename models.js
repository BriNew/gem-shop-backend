const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const mongoosePaginate = require('mongoose-paginate');
const bcrypt = require('bcrypt');

const rockSchema = mongoose.Schema({
  type:{type: String, required: true},
  origin:{type: String, required: true},
  size:{type: String, required: true},
  color:{type: String, required: true}
});

const usersSchema = mongoose.Schema({
  username:{type: String, required: true, unique: true},
  password:{type: String, required: true}
}) 

const contactSchema = mongoose.Schema({
  name:{type: String, required: true},
  email:{type: String, required: true},
  subject:{type: String, required: true},
  message:{type: String, required: true}
}) 


rockSchema.plugin(uniqueValidator);
rockSchema.plugin(mongoosePaginate);
usersSchema.plugin(mongoosePaginate);
usersSchema.plugin(uniqueValidator);
usersSchema.methods.validPassword = function(plainTextPwd) {
  return bcrypt.compareSync(plainTextPwd, this.password);
}
usersSchema.plugin(uniqueValidator);

rockSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    type: this.type,
    origin: this.origin,
    size: this.size,
    color: this.color  
  };
}

usersSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    username: this.username
  };
}

contactSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    subject: this.subject,
    message: this.message
  };
}


const RocksInventory = mongoose.model('rocks', rockSchema);
const Users = mongoose.model('users', usersSchema);
const Contact = mongoose.model('contact', contactSchema);
module.exports = {RocksInventory, Users, Contact};
