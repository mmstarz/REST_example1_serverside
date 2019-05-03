const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {  
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("not Authenticated");
    error.statusCode = 401;
    throw error;
  }
  // get data from the 'Authorization' header
  // split token from that data and store it in a variable
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    // .decode() method only decodes token
    // .verify() method decodes token and verify data
    // verify takes 2 arguments
    // fist - generated token
    // second - your private secret key that was used to generate token
    decodedToken = jwt.verify(token, "someSuperLongSecretString");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  // if token undefined
  if (!decodedToken) {
    const error = new Error("Not Authenticated");
    error.statusCode = 401;
    throw error;
  }
  // if no auth error occur
  // store user information in a request
  req.userId = decodedToken.userId;
  next();
};
