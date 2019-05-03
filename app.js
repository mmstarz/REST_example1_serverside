const path = require("path");
// const https = require("https");
const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer"); // import multer
const helmet = require("helmet"); // secure headers package
const compression = require("compression"); // compression package
const morgan = require("morgan"); // logging package

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();

// console.log(process.env.NODE_ENV);
// console.log(process.env.MONGO_USER);
// console.log(process.env.MONGO_PASSWORD);
// console.log(process.env.MONGO_DEFAULT_DATABASE);
// console.log(process.env.ITEMS_PER_PAGE);

// mongoDB entry point:
// 'mongodb+srv://username:password@cluster0-annvu.mongodb.net/messages?retryWrites=true'
// const MONGODB_URI =
//   "mongodb+srv://username:password@cluster0-annvu.mongodb.net/messages?retryWrites=true";
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${
  process.env.MONGO_PASSWORD
}@cluster0-annvu.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true`;

// init filestorage configuration
// .diskStorage() multer method that takes 2 params destination & filename
// new Date().toISOString() - is used  here for unique name definition
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const uniqueKey = new Date().toISOString().split(".");
    // new Date().toISOString().replace(/:/g, '-')
    // cb(null, uniqueKey + '-' + file.originalname);
    cb(null, `${uniqueKey[1]}_${file.originalname}`);
  }
});

// init filefilter config
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// flags: 'a' - means append new logs to the end of the file, not rewrite existing.
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
// headers secure middleware
app.use(helmet());
// compression middleware
app.use(compression());
// logging middleware
app.use(morgan("combined", { stream: accessLogStream }));

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

// register multer middleware
// .single() multer method if we expect one file. it takes input field name as argument.
// .array() for array of files
// multer({dest: 'images'}) - sets destination folder for file upload
// multer({ storage: fileStorage }) - storage configuration
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// images files handling
app.use("/images", express.static(path.join(__dirname, "images")));

// CORS error handling
app.use((req, res, next) => {
  // res.setHeader('Access-Control-Allow-Origin', 'codepen.io'); // for certain domain
  // res.setHeader('Access-Control-Allow-Origin', 'name1, name2,...'); // for special domains
  res.setHeader("Access-Control-Allow-Origin", "*"); // for any client access
  // also need to setup list of methods to allow access
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  // setup header to access
  // res.setHeader('Access-Control-Allow-Headers', '*'); // for any headers
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // allow preflight
  // if (req.method === 'OPTIONS') {
  //   res.sendStatus(200);
  // } else {
  //   next();
  // }
  next();
});
// Routes init
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);


// error handling
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data
  });
});

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(result => {
    const server = app.listen(process.env.PORT || 8080);
    // const server = https.createServer(app).listen(process.env.PORT || 8080);
    const io = require("./socket").init(server);
    io.on("connection", socket => {
      // console.log("Client connected");
    });
  })
  .catch(err => console.log(err));
