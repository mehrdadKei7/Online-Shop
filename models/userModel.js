const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
  firstName: {
    type: String,
    require: true,
    trim: true,
    maxlength: 50,
    minlength: 3,
  },
  lastName: {
    type: String,
    require: true,
    trim: true,
    maxlength: 50,
    minlength: 3,
  },
  email: {
    type: String,
    require: true,
    unique: true,
    trim: true,
    maxlength: 50,
  },
  password: { type: String, require: true },
  isVerifiedEmail: { type: Boolean, default: false },
  emailToken: { type: String },
  tokenExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          require: true,
          ref: "Product",
        },
        quantity: {
          type: Number,
          require: true,
        },
      },
    ],
  },
});

userSchema.methods.addTocart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const updatedcartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedcartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedcartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  const updatedCart = {
    items: updatedcartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedcartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedcartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = {
    items: [],
  };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
