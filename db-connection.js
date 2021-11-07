const mongoose = require('mongoose');
const db = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err) {
    console.log('An error has occur when connecting to database');
  } else {
    console.log('Conected to Mongo database');
  }
});

module.exports = db;