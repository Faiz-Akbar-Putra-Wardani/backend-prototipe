const { validateLogin} = require("./auth");
const { validateCustomer } = require("./customer");
const { validateCategory } = require("./category");
const { validateProduct } = require("./product");
const { validateDetailProduct } = require("./detail-product");
const { validateCart } = require("./cart");
const { validateTransaction } = require("./transaction");
const { validateRental } = require("./rental");
const { validateProject } = require("./proyek");
const { validateClient } = require("./klien");

module.exports = { validateLogin, validateCustomer, validateCategory, validateProduct, validateDetailProduct, validateCart, validateTransaction, validateRental,validateProject, validateClient };