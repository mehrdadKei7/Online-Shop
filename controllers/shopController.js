const Product = require("../models/productModel");
const Order = require("../models/order");

exports.getProductsList = (req, res, next) => {
  try {
    Product.find().then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products-list",
      });
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getIndex = (req, res, next) => {
  try {
    Product.find().then((product) => {
      res.render("shop/index", {
        path: "/",
        pageTitle: "Shop",
        prods: product,
      });
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getDetails = (req, res, next) => {
  try {
    const prodId = req.params.productId;
    Product.findById(prodId).then((product) => {
      if (!product) {
        // Handle the case where the product is not found
        return res.status(404).render("404", {
          pageTitle: "Product Not Found",
          path: "/products",
        });
      }

      res.render("shop/product-details", {
        product: product,
        pageTitle: product.title, // Use title instead of pageTitle
        path: "/products",
      });
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCart = (req, res, next) => {
  try {
    const prodId = req.body.productId;

    Product.findById(prodId).then((product) => {
      req.user.addTocart(product);
      res.redirect("/cart");
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate("cart.items.productId");
    const filteredProducts = user.cart.items.filter(
      (item) => item.productId !== null
    );
    res.render("shop/cart", {
      pageTitle: "Cart",
      path: "/cart",
      products: filteredProducts,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCartDeleteProduct = (req, res, next) => {
  try {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId).then((result) => {
      res.redirect("/cart");
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    // Populate cart items with product data
    const user = await req.user.populate("cart.items.productId");

    // Extract products from cart items
    const products = user.cart.items.map((i) => {
      if (!i.productId) {
        // Handle missing product (e.g., log an error, remove the item from the cart)
        console.error("Product not found in cart:", i._id);
        return null; // Or skip this item
      }
      return {
        quantity: i.quantity,
        product: {
          ...i.productId._doc,
        },
      };
    });

    // Filter out any null products (if handling missing products)
    const filteredProducts = products.filter((product) => product !== null);

    // Create a new order
    const order = new Order({
      user: {
        name: req.user.lastName,
        userId: req.user,
      },
      products: filteredProducts,
    });

    // Save the order
    await order.save();

    // Clear user's cart
    await req.user.clearCart();

    // Redirect to orders page
    res.redirect("/orders");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getOrder = (req, res, next) => {
  try {
    Order.find({
      "user.userId": req.user._id,
    }).then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
      });
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
