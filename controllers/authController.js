const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const crypto = require("crypto");
const transporter = require("../utils/mailer");

function isValidPassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return (
    password.length > minLength && hasUpperCase && hasLowerCase && hasNumber
  );
}

// authController.js
exports.authentication = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/'); // Redirect to home page
  }
  
  next(); // Proceed to the next middleware/route handler if authenticated
};

exports.checkAuth = (req, res, next) => {
    if (!req.session.userId) {
      res.locals.auth = false; // User is not authenticated
    } else {
      res.locals.auth = true; // User is authenticated
    }
    
    next(); // Proceed to the next middleware or route handler
  };




exports.getLoginPage = (req, res) => {
  res.render("auth/login");
};

exports.postLogin = async (req, res) => {
  try {
      const { email, password } = req.body;

      if (!email || !password) {
          return res.render("auth/login", {
              errorMessage: "All fields are required.",
              email,
              password,
          });
      }

      const loginUser = await User.findOne({ email });

      if (!loginUser || !loginUser.isVerifiedEmail || !bcrypt.compareSync(password, loginUser.password)) {
          return res.render("auth/login", { errorMessage: "Invalid credentials or email not verified." });
      }

      req.session.userId = loginUser._id; // Store user ID in session
      return res.redirect("/"); // Redirect to dashboard or home page
  } catch (error) {
      console.error("Error during login:", error);
      res.render("auth/login", { errorMessage: "An error occurred during login." });
  }
};

exports.getForgetPassPage = (req, res) => {
  res.render("auth/forgetPass");
};

exports.postForgetPass = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/forgetPass", {
        errorMessage: "You have never registered with this email before.",
        email,
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save the token and its expiration time
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset link
    const mailOptions = {
      from: '"Your Company Name" <your-email@gmail.com>',
      to: email,
      subject: "Password Reset",
      html: `<p>You requested a password reset. Click the link below to set a new password:</p><a href="http://localhost:3000/login/newPass/${resetToken}">Reset Password</a>`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.render("auth/forgetPass", {
          errorMessage: "Error sending email. Please try again.",
        });
      }

      res.render("auth/success", {
        title: "reset link has sent to your email",
      });
    });
  } catch (error) {
    // Define 'error' here
    console.error(error);
    return res.render("auth/forgetPass", {
      errorMessage:
        "An error occurred while processing your request. Please try again.",
      email,
    });
  }
};

exports.getNewPassPage = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by token and check if it's still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.render("auth/forgetPass", {
        errorMessage: "Password reset token is invalid or has expired.",
      });
    }

    req.session.token = token;

    // Render new password page with user's email
    res.render("auth/newPass");
  } catch (error) {
    console.error(error);
    res.render("auth/forgetPass", {
      errorMessage: "An error occurred while processing your request.",
    });
  }
};

exports.postNewPass = async (req, res) => {
  try {
    const { password, reTypedPass } = req.body; // Get email from body

    // Find user by token and check if it's still valid
    const user = await User.findOne({
      resetPasswordToken: req.session.token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.render("auth/forgetPass", {
        errorMessage: "Password reset token is invalid or has expired.",
      });
    }

    // Check if passwords match
    if (password !== reTypedPass) {
      return res.render("auth/newPass", {
        errorMessage: "Passwords do not match.",
        email: user.email, // Pass email to retain it in the form
      });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return res.render("newPass", {
        errorMessage:
          "Password must be more than 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.",
        email: user.email, // Pass email to retain it in the form
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined; // Clear token
    user.resetPasswordExpires = undefined; // Clear expiration
    await user.save();

    res.send("Your password has been changed successfully.");
  } catch (error) {
    console.error(error);
    return res.render("auth/newPass", {
      errorMessage:
        "An error occurred while updating your password. Please try again.",
      email: req.body.email, // Pass email to retain it in the form
    });
  }
};

exports.getRegisterPage = (req, res) => {
  return res.render("auth/register");
};

exports.postRegisterUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, reTypedPass } = req.body;

    if (!firstName || !lastName || !email || !password || !reTypedPass) {
      // Check for all required fields
      return res.render("auth/register", {
        errorMessage: "All fields are required.",
        firstName,
        lastName,
        email,
      });
    }

    if (
      firstName.length > 50 ||
      lastName.length > 50 ||
      email.length > 254 ||
      password.length > 64 ||
      reTypedPass.length > 64
    ) {
      return res.render("auth/register", {
        errorMessage: "You have exceeded the allowed character limit.",
        firstName,
        lastName,
        email,
      });
    }

    if (await User.findOne({ email })) {
      return res.render("auth/register", {
        errorMessage: "the email is already used",
        firstName,
        lastName,
        email,
      });
    }

    if (password !== reTypedPass) {
      return res.render("auth/register", {
        errorMessage: "passwords are not same",
        firstName,
        lastName,
        email,
      });
    }

    if (!isValidPassword(password)) {
      return res.render("auth/register", {
        errorMessage:
          "Password must be more than 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.",
        firstName,
        lastName,
        email,
      });
    }

    const emailToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = Date.now() + 3600000; // 1 hour
    req.session.tokenExp = tokenExpires;

    const hashedPassword = bcrypt.hashSync(password, 8);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      emailToken,
      tokenExpires: tokenExpires,
    });

    await newUser.save();

    const mailOptions = {
      from: '"mehrdad company" <your-email@gmail.com>',
      to: email,
      subject: "Email Verification",
      html: `<p>Please verify your email by clicking on the following link:</p>
           <a href="http://localhost:3000/verify/${emailToken}">Verify Email</a>`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).send(error.toString());
      }

      res.render("auth/success", { title: "Registration Successful" });
    });
  } catch (error) {
    console.error("Error:", error);
    res.render("auth/register", {
      errorMessage: "An error occurred during register.",
    });
  }
};

exports.validToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailToken: token,
      tokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send("Invalid token or user not found.");
    }

    user.isVerifiedEmail = true;
    user.emailToken = null; // Clear the token after verification
    req.session.userId = user._id;

    await user.save();

    res.redirect("/"); // Redirect to dashboard or success page
  } catch (err) {
    console.error("Error:", error);
    res.render("login", {
      errorMessage: "An error occurred during validation.",
    });
  }
};

exports.dashboardPage = async (req, res) => {
  try {
    const selectedUser = await User.findOne({ _id: req.session.userId });

    if (!selectedUser) {
      return res.redirect("auth//login"); // Redirect if user not found
    }

    const firstName1 = selectedUser.firstName;
    res.send(`Welcome to your dashboard, dear ${firstName1}`);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
};
