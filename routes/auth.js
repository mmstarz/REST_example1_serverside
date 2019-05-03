const express = require("express");
const { body } = require("express-validator/check");

const router = express.Router();

const authController = require("../controllers/auth.js");
const User = require("../models/user");
const isAuth = require("../middleware/is-auth");

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDocument => {
          if (userDocument) {
            return Promise.reject("Email already exist");
          }
        });
      })
      .normalizeEmail(),
    body("name")
      .trim()
      .not()
      .isEmpty(),
    body("password")
      .trim()
      .isLength({ min: 4 })
  ],
  authController.signup
);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.status);

router.put("/status", isAuth, authController.updateStatus);

module.exports = router;
