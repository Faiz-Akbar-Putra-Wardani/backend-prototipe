const { validateLogin} = require("./auth");
const { validateCustomer } = require("./customer");
const { validateCategory } = require("./category");
const { validateProduct } = require("./product");
const { validateDetailProduct } = require("./detail-product");
const { validateCart, validateUpdateCartQty} = require("./cart");
const { validateTransaction } = require("./transaction");
const { validateRental } = require("./rental");
const { validateProject } = require("./proyek");
const { validateClient } = require("./klien");
const { validateRepair } = require("./repair");


module.exports = { validateLogin, validateCustomer, validateCategory, validateProduct, validateDetailProduct, validateCart, validateUpdateCartQty, validateTransaction, validateRental,validateProject, validateClient, validateRepair };