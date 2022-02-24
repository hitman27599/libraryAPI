const mongoose = require('mongoose');
require('dotenv').config();

const db = mongoose.connect(process.env.ACCESS_MONGO_URI,{
    useNewUrlParser:true
}).then(()=>console.log('database connected successsfully'))
  .catch(()=>console.log('database connection failed'));

module.exports = db;