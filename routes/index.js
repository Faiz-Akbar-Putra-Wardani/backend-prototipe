
const express = require('express');

const router = express.Router();

const { validateLogin, validateCustomer, validateCategory, validateProduct, validateDetailProduct, validateCart, validateUpdateCartQty, validateTransaction, validateRental, validateProject, validateClient, validateRepair, validateBank } = require('../utils/validators');
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
const clientController = require('../controllers/KlienController');
const repairController = require('../controllers/RepairController');
const reportController = require('../controllers/reportController');
const profitController = require('../controllers/ProfitController');
const bankController = require('../controllers/BankController');

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
    middlewares: [verifyToken, validateUpdateCartQty, handleValidationErrors], 
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
    method: 'put', 
    path: '/transactions/:id', 
    middlewares: [verifyToken, validateTransaction, handleValidationErrors], 
    handler: transactionController.updateTransaction 
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
    handler: transactionController.deleteTransaction 
  },

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

  {
  method: 'put',
  path: '/rentals/:id',
  middlewares: [verifyToken, validateRental, handleValidationErrors],
  handler: rentalController.updateRental
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

    // Client Routes
  {
    method: 'get',
    path: '/clients',
    middlewares: [verifyToken],
    handler: clientController.findClients
  },
  {
    method: 'post',
    path: '/clients',
    middlewares: [
      verifyToken,
      upload.single('image'),
      validateClient,
      handleValidationErrors
    ],
    handler: clientController.createClient
  },
  {
    method: 'get',
    path: '/clients/:id',
    middlewares: [verifyToken],
    handler: clientController.findClientsById
  },
  {
    method: 'put',
    path: '/clients/:id',
    middlewares: [
      verifyToken,
      upload.single('image'),
      validateClient,
      handleValidationErrors
    ],
    handler: clientController.updateClient
  },
  {
    method: 'delete',
    path: '/clients/:id',
    middlewares: [verifyToken],
    handler: clientController.deleteClient
  },
  {
    method: 'get',
    path: '/clients-all',
    middlewares: [verifyToken],
    handler: clientController.allClients
  },

  // Create Repair
  {
    method: 'post',
    path: '/repairs',
    middlewares: [verifyToken, validateRepair, handleValidationErrors],
    handler: repairController.createRepair
  },
  // Get All Repairs (with pagination + search)
  {
    method: 'get',
    path: '/repairs',
    middlewares: [verifyToken],
    handler: repairController.getRepairs
  },
  // Get New Invoice
  {
    method: 'get',
    path: '/repairs/invoice/new',
    middlewares: [verifyToken],
    handler: repairController.getNewRepairInvoice
  },
  // Get Repair By Invoice
  {
    method: 'get',
    path: '/repairs/invoice/:invoice',
    middlewares: [verifyToken],
    handler: repairController.getRepairByInvoice
  },
  // Get Repair By ID
  {
    method: 'get',
    path: '/repairs/:id',
    middlewares: [verifyToken],
    handler: repairController.getRepairById
  },
  // Update Repair (all data except invoice)
  {
    method: 'put',
    path: '/repairs/:id',
    middlewares: [verifyToken, validateRepair, handleValidationErrors],
    handler: repairController.updateRepair
  },
  // Delete Repair
  {
    method: 'delete',
    path: '/repairs/:id',
    middlewares: [verifyToken],
    handler: repairController.deleteRepair
  },

  {
    method: 'get',
    path: '/reports/customer-recap',
    middlewares: [verifyToken],
    handler: reportController.getCustomerRecap
  },
  {
    method: 'get',
    path: '/reports/transaction-stats',
    middlewares: [verifyToken],
    handler: reportController.getTransactionStats
  },

  {
  method: "delete",
  path: "/reports/:id",
  middlewares: [verifyToken],
  handler: reportController.deleteCustomerRecap,
},
{
    method: 'get',
    path: '/profits/total-revenue',
    middlewares: [verifyToken],
    handler: profitController.getTotalRevenue
  },
  {
    method: 'get',
    path: '/profits/revenue-stats',
    middlewares: [verifyToken],
    handler: profitController.getRevenueStats
  },
  {
    method: 'get',
    path: '/profits/revenue-period',
    middlewares: [verifyToken],
    handler: profitController.getRevenueByPeriod
  },
  {
    method: 'get',
    path: '/profits/monthly-revenue',
    middlewares: [verifyToken],
    handler: profitController.getMonthlyRevenue
  },
  {
    method: 'get',
    path: '/profits/monthly-revenue-by-source',
    middlewares: [verifyToken],
    handler: profitController.getMonthlyRevenueBySource
  },
    {
    method: 'get',
    path: '/profits/recent-transactions',
    middlewares: [verifyToken],
    handler: profitController.getRecentTransactions
  },

   // Bank Routes
  {
    method: 'get',
    path: '/banks',
    middlewares: [verifyToken],
    handler: bankController.findBanks
  },
  {
    method: 'post',
    path: '/banks',
    middlewares: [verifyToken, validateBank, handleValidationErrors],
    handler: bankController.createBank
  },
  {
    method: 'get',
    path: '/banks/:id',
    middlewares: [verifyToken],
    handler: bankController.findBankById
  },
  {
    method: 'put',
    path: '/banks/:id',
    middlewares: [verifyToken, validateBank, handleValidationErrors],
    handler: bankController.updateBank
  },
  {
    method: 'delete',
    path: '/banks/:id',
    middlewares: [verifyToken],
    handler: bankController.deleteBank
  },
  {
    method: 'get',
    path: '/banks-all',
    middlewares: [verifyToken],
    handler: bankController.allBanks
  },

];

const createRoutes = (routes) => {
  routes.forEach(({ method, path, middlewares, handler }) => {
    router[method](path, ...middlewares, handler);
  });
};

createRoutes(routes);

module.exports = router;