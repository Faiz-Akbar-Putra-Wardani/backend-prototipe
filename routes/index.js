
const express = require('express');

const router = express.Router();

const { validateLogin, validateCustomer, validateCategory, validateProduct, validateDetailProduct, validateCart, validateTransaction, validateRental, validateProject } = require('../utils/validators');
const { handleValidationErrors, verifyToken, upload} = require('../middlewares');

const loginController = require('../controllers/LoginController');
const customerController = require('../controllers/CustomerController');
const categoryController = require('../controllers/CategoryController');
const productController = require('../controllers/ProductController');
const detailProductController = require('../controllers/DetailProductController');
const cartController = require('../controllers/CartController');
const transactionController = require('../controllers/TransactionController');
const rentalController = require('../controllers/RentalController');
const projectController = require('../controllers/ProyekController');

const routes = [
  // Login 
  { method: 'post', 
    path: '/login', 
    middlewares: [validateLogin, handleValidationErrors], 
    handler: loginController.login 
  },

  //customers
  { method: 'get', 
    path: '/customers', 
    middlewares: [verifyToken], 
    handler: customerController.findCustomers 
  },
  { method: 'post', 
    path: '/customers', 
    middlewares: [verifyToken, validateCustomer, handleValidationErrors], 
    handler: customerController.createCustomers 
  },
  { method: 'get', 
    path: '/customers/:id', 
    middlewares: [verifyToken], 
    handler: customerController.findCustomerById 
  },
  { method: 'put', 
    path: '/customers/:id', 
    middlewares: [verifyToken, validateCustomer, handleValidationErrors], 
    handler: customerController.updateCustomer 
  },
  { method: 'delete', 
    path: '/customers/:id', 
    middlewares: [verifyToken], 
    handler: customerController.deleteCustomer 
  },
  { method: 'get', 
    path: '/customers-all', 
    middlewares: [verifyToken], 
    handler: customerController.allCustomers 
  },

  // Category 
  { method: 'get', 
    path: '/categories',
    middlewares: [verifyToken], 
    handler: categoryController.findCategories 
  },
  { method: 'post', 
    path: '/categories', 
    middlewares: [verifyToken, upload.single('image'), validateCategory, handleValidationErrors], 
    handler: categoryController.createCategory 
  },
  { method: 'get', 
    path: '/categories/:id', 
    middlewares: [verifyToken], 
    handler: categoryController.findCategoryById 
  },
  { method: 'put', 
    path: '/categories/:id', 
    middlewares: [verifyToken, upload.single('image'), validateCategory, handleValidationErrors],
    handler: categoryController.updateCategory 
  },
  { method: 'delete', 
    path: '/categories/:id', 
    middlewares: [verifyToken], 
    handler: categoryController.deleteCategory 
  },
  { method: 'get', 
    path: '/categories-all', 
    middlewares: [verifyToken], 
    handler: categoryController.allCategories 
  },

  // Product routes
  { method: 'get', 
    path: '/products', middlewares: [verifyToken], 
    handler: productController.findProducts 
  },
  { method: 'post', 
    path: '/products', 
    middlewares: [verifyToken, upload.single('image'), validateProduct, 
    handleValidationErrors], handler: productController.createProduct
   },
  { method: 'get', 
    path: '/products/:id', 
    middlewares: [verifyToken], 
    handler: productController.findProductById 
  },
  { method: 'put', 
    path: '/products/:id', 
    middlewares: [verifyToken, upload.single('image'), validateProduct, handleValidationErrors], 
    handler: productController.updateProduct 
  },
  { method: 'delete', 
    path: '/products/:id', 
    middlewares: [verifyToken], 
    handler: productController.deleteProduct 
  },
  { method: 'get', 
    path: '/products-by-category/:id', 
    middlewares: [verifyToken], 
    handler: productController.findProductByCategoryId 
  },
  { method: 'get', 
    path: '/products-all', 
    middlewares: [verifyToken], 
    handler: productController.allProducts 
  }, 

  // Detail Product
  { method: 'get', 
    path: '/detail-products', 
    middlewares: [verifyToken], 
    handler: detailProductController.findDetailProducts 
  },
  { method: 'get', 
    path: '/detail-products/:id', 
    middlewares: [verifyToken], 
    handler: detailProductController.findDetailProductById 
  },
  { method: 'post', 
    path: '/detail-products', 
    middlewares: [verifyToken, validateDetailProduct, handleValidationErrors], 
    handler: detailProductController.createDetailProduct 
  },
  { method: 'put', 
    path: '/detail-products/:id', 
    middlewares: [verifyToken, validateDetailProduct, handleValidationErrors], 
    handler: detailProductController.updateDetailProduct 
  },
  { method: 'delete', 
    path: '/detail-products/:id', 
    middlewares: [verifyToken], 
    handler: detailProductController.deleteDetailProduct 
  },
  { method: 'get', 
    path: '/detail-products-by-category/:categoryId', 
    middlewares: [verifyToken], 
    handler: detailProductController.findProductsByCategory 
  },

   // Cart routes
  { method: 'get', 
    path: '/carts',
     middlewares: [verifyToken], 
     handler: cartController.findCarts 
  },
  { method: 'post', 
    path: '/carts', 
    middlewares: [verifyToken, validateCart, handleValidationErrors], 
    handler: cartController.createCart 
  },
   { method: 'put', 
    path: '/carts/:id', 
    middlewares: [verifyToken, validateCart, handleValidationErrors], 
    handler: cartController.updateCart 
  },
  { method: 'delete', 
    path: '/carts/:id', 
    middlewares: [verifyToken], 
    handler: cartController.deleteCart 
  },

  // Transaction routes
  { 
    method: 'post', 
    path: '/transactions', 
    middlewares: [verifyToken, validateTransaction, handleValidationErrors], 
    handler: transactionController.createTransaction 
  },
  { 
    method: 'get',
    path: '/transactions',
    middlewares: [verifyToken],
    handler: transactionController.getTransactions 
  },
  { 
    method: 'get',
    path: '/transactions/invoice',
    middlewares: [verifyToken], 
    handler: transactionController.getNewInvoice 
  },
  {
    method: 'get',
    path: '/transactions/by-invoice/:invoice',
    middlewares: [verifyToken],
    handler: transactionController.getTransactionByInvoice
  },
  { method: 'put', 
    path: '/transactions/status', 
    middlewares: [verifyToken], 
    handler: transactionController.updateStatus 
  },

  { 
    method: 'get',
    path: '/transactions/:id',
    middlewares: [verifyToken], 
    handler: transactionController.getTransactionById 
  },
  { method: "delete", 
    path: "/transactions/:id", 
    middlewares: [verifyToken], 
    handler: transactionController.deleteTransaction },

 {
    method: 'post',
    path: '/rentals',
    middlewares: [verifyToken, validateRental, handleValidationErrors],
    handler: rentalController.createRental
  },

  // Get All Rentals (with pagination + search)
  {
    method: 'get',
    path: '/rentals',
    middlewares: [verifyToken],
    handler: rentalController.getRentals
  },

  // Get Rental By ID
  {
    method: 'get',
    path: '/rentals/:id',
    middlewares: [verifyToken],
    handler: rentalController.getRentalById
  },

   // Get New Invoice
  {
    method: 'get',
    path: '/rentals/invoice/new',
    middlewares: [verifyToken],
    handler: rentalController.getNewInvoice
  },

  // Get Rental By Invoice
  {
    method: 'get',
    path: '/rentals/invoice/:invoice',
    middlewares: [verifyToken],
    handler: rentalController.getRentalByInvoice
  },

  // Update Rental Status
  {
    method: 'put',
    path: '/rentals/status',
    middlewares: [verifyToken],
    handler: rentalController.updateRentalStatus
  },

  // Delete Rental
  {
    method: 'delete',
    path: '/rentals/:id',
    middlewares: [verifyToken],
    handler: rentalController.deleteRental
  },

    // Project Routes
  {
    method: 'get',
    path: '/projects',
    middlewares: [verifyToken],
    handler: projectController.findProjects
  },
  {
    method: 'post',
    path: '/projects',
    middlewares: [
      verifyToken,
      upload.single('image'),
      validateProject,
      handleValidationErrors
    ],
    handler: projectController.createproject
  },
  {
    method: 'get',
    path: '/projects/:id',
    middlewares: [verifyToken],
    handler: projectController.findprojectById
  },
  {
    method: 'put',
    path: '/projects/:id',
    middlewares: [
      verifyToken,
      upload.single('image'),
      validateProject,
      handleValidationErrors
    ],
    handler: projectController.updateproject
  },
  {
    method: 'delete',
    path: '/projects/:id',
    middlewares: [verifyToken],
    handler: projectController.deleteProject
  },
  {
    method: 'get',
    path: '/projects-all',
    middlewares: [verifyToken],
    handler: projectController.allProjects
  },



];


const createRoutes = (routes) => {
  routes.forEach(({ method, path, middlewares, handler }) => {
    router[method](path, ...middlewares, handler);
  });
};

createRoutes(routes);

module.exports = router;