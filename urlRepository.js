require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new Schema({
  original:  { type: String, required: true },
  short: { type: Number, required: true }
});

const URL = mongoose.model("URL", urlSchema);

let counter = 1;

URL.estimatedDocumentCount((err, count) => {
  if (err || !count) {
    return;
  }

  counter += count;
});

const createAndSaveURL = (original, done) => {
  const url = new URL({
    original,
    short: counter++
  });

  url.save(done);
};

const findById = (id, done) => {
  URL.findById(id, done);
};

const findByOriginalURL = (original, done) => {
  URL.findOne({original}, done);
}

const findByShortURL = (short, done) => {
  URL.findOne({short}, done);
};

module.exports = {
  createAndSaveURL,
  findById,
  findByOriginalURL,
  findByShortURL
}