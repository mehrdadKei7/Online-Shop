const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: { type: String, required: true , trim : true},
  price: { type: Number, required: true , trim : true },
  description: { type: String, required: true , trim : true},
  imageUrl: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Product", productSchema);
