const Product = require("../models/productModel");
const Order = require("../models/order");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const ITEMS_PER_PAGE = 8;

exports.getProductsList = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products-list",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
      .countDocuments()
      .then((numProducts) => {
        totalItems = numProducts;
        return Product.find()
          .skip((page - 1) * ITEMS_PER_PAGE)
          .limit(ITEMS_PER_PAGE);
      })
      .then((products) => {
        res.render("shop/index", {
          path: "/",
          pageTitle: "Shop",
          prods: products,
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
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

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("-----------------------");
      pdfDoc.fontSize(14).text("Order ID: " + order._id);
      pdfDoc.text("Name: " + order.user.name);
      pdfDoc.text("Date: " + new Date().toLocaleDateString());
      pdfDoc.text("-----------------------");

      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              "$" +
              prod.product.price
          );
      });
      pdfDoc.text("-----------------------");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

      pdfDoc.end();
    })
    .catch((err) => next(err));
};
