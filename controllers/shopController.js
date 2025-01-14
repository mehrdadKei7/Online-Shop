const Product = require("../models/productModel");
const Order = require("../models/order");

exports.getProductsList = (req, res) => {
  Product.find().then((products) => {
    res.render("shop/product-list", {
      prods: products,
      pageTitle: "All Products",
      path: "/products-list",
    });
  });
};

exports.getIndex = (req, res) => {
  Product.find().then((product) => {
    res.render("shop/index", {
      path: "/",
      pageTitle: "Shop",
      prods: product,
    });
  });
};

exports.getDetails = (req, res) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
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
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
    });
};

exports.postCart = (req, res) => {
  const prodId = req.body.productId;

  // if (condition) {

  // }

  Product.findById(prodId).then((product) => {
    req.user.addTocart(product);
    res.redirect("/cart");
  });
};

exports.getCart = async (req, res) => {
  const user = await req.user.populate("cart.items.productId");
  const filteredProducts = user.cart.items.filter(
    (item) => item.productId !== null
  );
  res.render("shop/cart", {
    pageTitle: "Cart",
    path: "/cart",
    products: filteredProducts,
  });
};

exports.postCartDeleteProduct = (req, res) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postOrder = (req, res) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          product: {
            ...i.productId._doc,
          },
        };
      });
      const order = new Order({
        user: {
          name: req.user.lastName,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getOrder = (req, res) => {
  Order.find({
    "user.userId": req.user._id,
  })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
