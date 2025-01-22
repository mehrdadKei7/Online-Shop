const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const User = require("./models/userModel");
const csrf = require("csurf");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(csrf());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.set("view engine", "ejs");
app.set("views", "views");

const adminRouter = require("./routes/adminRouter");
const shopRouter = require("./routes/shopRouter");
const authRouter = require("./routes/authRouter");

app.use((req, res, next) => {
  if (!req.session.userId) {
    return next();
  }

  User.findById(req.session.userId)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
      next();
    });
});

app.use("/admin", adminRouter);
app.use(shopRouter);
app.use(authRouter);

mongoose
  .connect("mongodb://localhost/Shop")
  .then((result) => {
    app.listen(3000, () => {
      console.log("Listening on port 3000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
