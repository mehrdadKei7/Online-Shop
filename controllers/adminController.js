const Product = require("../models/productModel");
const fs = require("fs");
const path = require("path");

const ITEMS_PER_PAGE = 12;

exports.getAdminProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find({ userId: req.user._id })
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({ userId: req.user._id })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
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

exports.getAddProductPage = (req, res, next) => {
  try {
    res.render("admin/addProduct.ejs", {
      path: "/admin/addProduct",
      pageTitle: "addProduct",
      editing: false,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postAddProduct = (req, res, next) => {
  try {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const image = req.file;

    if (!title || !price || !description || !image) {
      return res.render("admin/addProduct.ejs", {
        path: "/admin/addProduct",
        pageTitle: "addProduct",
        editing: false,
        errorMessage: "All fields are required.",
        title: title,
        price: price,
        description: description,
        image: image,
      });
    }

    const imageUrl = image.path;

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
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getEditProduct = (req, res, next) => {
  try {
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
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImage = req.file;
    const updatedDesc = req.body.description;

    const product = await Product.findOne({
      _id: prodId,
      userId: req.user._id,
    });

    if (!product) {
      return res.redirect("/admin/products");
    }

    if (!updatedTitle || !updatedPrice || !updatedDesc) {
      return res.render("admin/addProduct", {
        path: "admin/edit-product",
        pageTitle: "addProduct",
        editing: true,
        errorMessage: "All fields are required.",
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        product: {
          _id: prodId,
          title: updatedTitle,
          price: updatedPrice,
          description: updatedDesc,
          imageUrl: updatedImage ? updatedImage.path : product.imageUrl,
        },
      });
    }

    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;

    if (updatedImage) {
      const oldImagePath = path.join(__dirname, "..", product.imageUrl);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Failed to delete the old image:", err);
        }
      });

      product.imageUrl = updatedImage.path;
    }

    await product.save(); // Wait for the save operation to complete
    console.log("Updated Product...");
    res.redirect("/");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const user = req.user;
    const product = await Product.findOne({ _id: prodId, userId: user._id });

    if (!product) {
      return res.redirect("/admin/products");
    }

    const imagePath = path.join(__dirname, "..", product.imageUrl);
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Failed to delete the image:", err);
      }
    });

    await Product.findByIdAndDelete(prodId);
    console.log("Product Removed");
    res.redirect("/admin/products");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
