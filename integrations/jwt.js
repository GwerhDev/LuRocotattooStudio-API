const jwt = require("jsonwebtoken");
const { SECRET } = require("../config");

const createToken = async (data, time) => {
  const expiration = time * 60 * 60;
  const payload = {
    data,
    exp: Math.floor(Date.now() / 1000) + expiration
  };
  const token = jwt.sign(payload, SECRET);
  return token;
};


const decodeToken = async (token) => {
  try {
    const decoded = jwt.verify(token, SECRET);
    return decoded;
  } catch (error) {
    return error;
  }
};

module.exports = {
  createToken,
  decodeToken
};