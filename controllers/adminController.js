const Product = require("../models/productModel");

exports.getAdminProducts = (req, res) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAddProductPage = (req, res) => {
  res.render("admin/addProduct.ejs", {
    path: "/admin/addProduct",
    pageTitle: "addProduct",
    editing: false,
  });
};

exports.postAddProduct = (req, res) => {
  const title = req.body.title;
  const price = req.body.price;
  const description = req.body.description;
  const imageUrl = req.body.imageUrl;

  if (!title || !price || !description || !imageUrl) {
    return res.render("admin/addProduct.ejs", {
      path: "/admin/addProduct",
      pageTitle: "addProduct",
      editing: false,
      errorMessage: "All fields are required.",
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user._id,
  });

  product.save().then((result) => {
    console.log("product created");
    res.redirect("/");
  });
};

exports.getEditProduct = (req, res) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }

  const prodId = req.params.productId;
  Product.findById(prodId).then((product) => {
    if (!product) {
      return res.redirect("/");
    }

    res.render("admin/addProduct", {
      pageTitle: "Edit Product",
      editing: editMode,
      path: "admin/edit-product",
      product: product,
    });
  });
};

exports.postEditProduct = async (req, res) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

  try {
 const product = Product.findOne({ _id: prodId, userId: req.user._id });

  product.title = updatedTitle;
  product.price = updatedPrice;
  product.imageUrl = updatedImageUrl;
  product.description = updatedDesc;

  await product.save(); // Wait for the save operation to complete
  console.log("Updated Product...");
  res.redirect("/"); } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while updating the product");
  }
};


exports.postDeleteProduct = (req, res) => {
  const prodId = req.body.productId;

  Product.findByIdAndDelete(prodId)
    .then(() => {
      console.log("Product Removed");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
    });
};
