const express = require('express');
const router = express.Router();

const { validateLogin, validateCustomer, validateCategory, validateProduct, validateDetailProduct, validateCart, validateUpdateCartQty, validateTransaction, validateRental, validateProject, validateClient, validateRepair, validateBank, validateCreateAdmin, validateUpdateAdmin, validateProjectCategory } = require('../utils/validators');
const { handleValidationErrors, verifyToken, upload} = require('../middlewares');

// Import rate limiters
const { generalLimiter, loginLimiter, crudLimiter, publicLimiter, trackingLimiter } = require('../middlewares/rateLimiter');

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
const adminController = require('../controllers/adminController');
const projectCategoryController = require('../controllers/projectCategoryController');

const routes = [

  { 
    method: 'post', 
    path: '/login', 
    middlewares: [loginLimiter, validateLogin, handleValidationErrors], 
    handler: loginController.login 
  },

  // Public Categories (Product)
  {
    method: 'get',
    path: '/public/categories',
    middlewares: [publicLimiter],
    handler: categoryController.publicCategories
  },

  // Public Products
  {
    method: 'get',
    path: '/public/products',
    middlewares: [publicLimiter],
    handler: productController.publicProducts
  },
  {
    method: 'get',
    path: '/public/products/:uuid',
    middlewares: [publicLimiter],
    handler: productController.publicProductDetail
  },

  {
    method: 'get',
    path: '/public/project-categories',
    middlewares: [publicLimiter],
    handler: projectCategoryController.publicProjectCategories
  },

  // Public Projects
  {
    method: 'get',
    path: '/public/projects',
    middlewares: [publicLimiter], 
    handler: projectController.publicProjects
  },

  // Public Clients
  {
    method: 'get',
    path: '/public/clients',
    middlewares: [publicLimiter], 
    handler: clientController.publicClients
  },

  // Tracking endpoints dengan trackingLimiter
  {
    method: 'get',
    path: '/public/tracking/:invoice',
    middlewares: [trackingLimiter],
    handler: transactionController.getTrackingByInvoice
  },
  {
    method: 'get',
    path: '/public/tracking/repair/:invoice',
    middlewares: [trackingLimiter],
    handler: repairController.getRepairTrackingByInvoice
  },
  {
    method: 'get',
    path: '/public/tracking/rental/:invoice',
    middlewares: [trackingLimiter],
    handler: rentalController.getRentalTrackingByInvoice
  },

  
  // Admin Routes
  { 
    method: 'get', 
    path: '/admins', 
    middlewares: [generalLimiter, verifyToken], 
    handler: adminController.findAdmins 
  },
  { 
    method: 'post', 
    path: '/admins', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateCreateAdmin, handleValidationErrors], 
    handler: adminController.createAdmin 
  },
  { 
    method: 'get', 
    path: '/admins/:uuid', 
    middlewares: [generalLimiter, verifyToken], 
    handler: adminController.findAdminById 
  },
  { 
    method: 'put', 
    path: '/admins/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateUpdateAdmin, handleValidationErrors], 
    handler: adminController.updateAdmin 
  },
  { 
    method: 'delete', 
    path: '/admins/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: adminController.deleteAdmin 
  },
  { 
    method: 'get', 
    path: '/admins-all', 
    middlewares: [generalLimiter, verifyToken], 
    handler: adminController.allAdmins 
  },

  // Customers
  { 
    method: 'get', 
    path: '/customers', 
    middlewares: [generalLimiter, verifyToken], 
    handler: customerController.findCustomers 
  },
  { 
    method: 'post', 
    path: '/customers', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateCustomer, handleValidationErrors], 
    handler: customerController.createCustomers 
  },
  { 
    method: 'get', 
    path: '/customers/:uuid', 
    middlewares: [generalLimiter, verifyToken], 
    handler: customerController.findCustomerById 
  },
  { 
    method: 'put', 
    path: '/customers/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateCustomer, handleValidationErrors], 
    handler: customerController.updateCustomer 
  },
  { 
    method: 'delete', 
    path: '/customers/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: customerController.deleteCustomer 
  },
  { 
    method: 'get', 
    path: '/customers-all', 
    middlewares: [generalLimiter, verifyToken], 
    handler: customerController.allCustomers 
  },

  // Category (Product)
  { 
    method: 'get', 
    path: '/categories',
    middlewares: [generalLimiter, verifyToken], 
    handler: categoryController.findCategories 
  },
  { 
    method: 'post', 
    path: '/categories', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, upload.single('image'), validateCategory, handleValidationErrors], 
    handler: categoryController.createCategory 
  },
  { 
    method: 'get', 
    path: '/categories/:uuid', 
    middlewares: [generalLimiter, verifyToken], 
    handler: categoryController.findCategoryById 
  },
  { 
    method: 'put', 
    path: '/categories/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, upload.single('image'), validateCategory, handleValidationErrors],
    handler: categoryController.updateCategory 
  },
  { 
    method: 'delete', 
    path: '/categories/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: categoryController.deleteCategory 
  },
  { 
    method: 'get', 
    path: '/categories-all', 
    middlewares: [generalLimiter, verifyToken], 
    handler: categoryController.allCategories 
  },

  // Product routes
  { 
    method: 'get', 
    path: '/products', 
    middlewares: [generalLimiter, verifyToken], 
    handler: productController.findProducts 
  },
  { 
    method: 'post', 
    path: '/products', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, upload.single('image'), validateProduct, handleValidationErrors], 
    handler: productController.createProduct
  },
  { 
    method: 'get', 
    path: '/products/:uuid', 
    middlewares: [generalLimiter, verifyToken], 
    handler: productController.findProductById 
  },
  { 
    method: 'put', 
    path: '/products/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, upload.single('image'), validateProduct, handleValidationErrors], 
    handler: productController.updateProduct 
  },
  { 
    method: 'delete', 
    path: '/products/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: productController.deleteProduct 
  },
  { 
    method: 'get', 
    path: '/products-by-category/:id', 
    middlewares: [generalLimiter, verifyToken], 
    handler: productController.findProductByCategoryId 
  },
  { 
    method: 'get', 
    path: '/products-all', 
    middlewares: [generalLimiter, verifyToken], 
    handler: productController.allProducts 
  }, 

  // Detail Product
  { 
    method: 'get', 
    path: '/detail-products', 
    middlewares: [generalLimiter, verifyToken], 
    handler: detailProductController.findDetailProducts 
  },
  { 
    method: 'get', 
    path: '/detail-products/:uuid', 
    middlewares: [generalLimiter, verifyToken], 
    handler: detailProductController.findDetailProductById 
  },
  { 
    method: 'post', 
    path: '/detail-products', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateDetailProduct, handleValidationErrors], 
    handler: detailProductController.createDetailProduct 
  },
  { 
    method: 'put', 
    path: '/detail-products/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateDetailProduct, handleValidationErrors], 
    handler: detailProductController.updateDetailProduct 
  },
  { 
    method: 'delete', 
    path: '/detail-products/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: detailProductController.deleteDetailProduct 
  },
  { 
    method: 'get', 
    path: '/detail-products-by-category/:categoryId', 
    middlewares: [generalLimiter, verifyToken], 
    handler: detailProductController.findProductsByCategory 
  },

  // Cart routes
  { 
    method: 'get', 
    path: '/carts',
    middlewares: [generalLimiter, verifyToken], 
    handler: cartController.findCarts 
  },
  { 
    method: 'post', 
    path: '/carts', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateCart, handleValidationErrors], 
    handler: cartController.createCart 
  },
  { 
    method: 'put', 
    path: '/carts/:id', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateUpdateCartQty, handleValidationErrors], 
    handler: cartController.updateCart 
  },
  { 
    method: 'delete', 
    path: '/carts/:id', 
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: cartController.deleteCart 
  },

  // Transactions
  { 
    method: 'get',
    path: '/transactions/invoice/new',
    middlewares: [generalLimiter, verifyToken], 
    handler: transactionController.getNewInvoice 
  },
  {
    method: 'get',
    path: '/transactions/invoice/:invoice',
    middlewares: [generalLimiter, verifyToken],
    handler: transactionController.getTransactionByInvoice
  },
  { 
    method: 'post', 
    path: '/transactions', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateTransaction, handleValidationErrors], 
    handler: transactionController.createTransaction 
  },
  { 
    method: 'get',
    path: '/transactions',
    middlewares: [generalLimiter, verifyToken],
    handler: transactionController.getTransactions 
  },
  { 
    method: 'get',
    path: '/transactions/:uuid',  
    middlewares: [generalLimiter, verifyToken], 
    handler: transactionController.getTransactionById 
  },
  { 
    method: 'put', 
    path: '/transactions/:uuid', 
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateTransaction, handleValidationErrors], 
    handler: transactionController.updateTransaction 
  },
  { 
    method: 'patch', 
    path: '/transactions/:uuid/status',  
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: transactionController.updateStatus 
  },
  { 
    method: "delete", 
    path: "/transactions/:uuid", 
    middlewares: [generalLimiter, crudLimiter, verifyToken], 
    handler: transactionController.deleteTransaction 
  },

  // Rentals
  {
    method: 'post',
    path: '/rentals',
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateRental, handleValidationErrors],
    handler: rentalController.createRental
  },
  {
    method: 'get',
    path: '/rentals',
    middlewares: [generalLimiter, verifyToken],
    handler: rentalController.getRentals
  },
  {
    method: 'get',
    path: '/rentals/invoice/new',  
    middlewares: [generalLimiter, verifyToken],
    handler: rentalController.getNewInvoice
  },
  {
    method: 'get',
    path: '/rentals/invoice/:invoice',  
    middlewares: [generalLimiter, verifyToken],
    handler: rentalController.getRentalByInvoice
  },
  {
    method: 'get',
    path: '/rentals/:uuid',  
    middlewares: [generalLimiter, verifyToken],
    handler: rentalController.getRentalById
  },
  {
    method: 'patch',
    path: '/rentals/:uuid/status',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: rentalController.updateRentalStatus
  },
  {
    method: 'put',
    path: '/rentals/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateRental, handleValidationErrors],
    handler: rentalController.updateRental
  },
  {
    method: 'delete',
    path: '/rentals/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: rentalController.deleteRental
  },

  // project categories
  {
    method: 'get',
    path: '/project-categories',
    middlewares: [generalLimiter, verifyToken],
    handler: projectCategoryController.findProjectCategories
  },
  {
    method: 'post',
    path: '/project-categories',
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateProjectCategory, handleValidationErrors],
    handler: projectCategoryController.createProjectCategory
  },
  {
    method: 'get',
    path: '/project-categories/:uuid',
    middlewares: [generalLimiter, verifyToken],
    handler: projectCategoryController.findProjectCategoryById
  },
  {
    method: 'put',
    path: '/project-categories/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateProjectCategory, handleValidationErrors],
    handler: projectCategoryController.updateProjectCategory
  },
  {
    method: 'delete',
    path: '/project-categories/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: projectCategoryController.deleteProjectCategory
  },
  {
    method: 'get',
    path: '/project-categories-all',
    middlewares: [generalLimiter, verifyToken],
    handler: projectCategoryController.allProjectCategories
  },

  // projects
  {
    method: 'get',
    path: '/projects',
    middlewares: [generalLimiter, verifyToken],
    handler: projectController.findProjects
  },
  {
    method: 'post',
    path: '/projects',
    middlewares: [
      generalLimiter,
      crudLimiter,
      verifyToken,
      upload.single('image'),
      validateProject,
      handleValidationErrors
    ],
    handler: projectController.createproject
  },
  {
    method: 'get',
    path: '/projects/:uuid',
    middlewares: [generalLimiter, verifyToken],
    handler: projectController.findprojectById
  },
  {
    method: 'put',
    path: '/projects/:uuid',
    middlewares: [
      generalLimiter,
      crudLimiter,
      verifyToken,
      upload.single('image'),
      validateProject,
      handleValidationErrors
    ],
    handler: projectController.updateproject
  },
  {
    method: 'delete',
    path: '/projects/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: projectController.deleteProject
  },

  // Client Routes
  {
    method: 'get',
    path: '/clients',
    middlewares: [generalLimiter, verifyToken],
    handler: clientController.findClients
  },
  {
    method: 'post',
    path: '/clients',
    middlewares: [
      generalLimiter,
      crudLimiter,
      verifyToken,
      upload.single('image'),
      validateClient,
      handleValidationErrors
    ],
    handler: clientController.createClient
  },
  {
    method: 'get',
    path: '/clients/:uuid',
    middlewares: [generalLimiter, verifyToken],
    handler: clientController.findClientsById
  },
  {
    method: 'put',
    path: '/clients/:uuid',
    middlewares: [
      generalLimiter,
      crudLimiter,
      verifyToken,
      upload.single('image'),
      validateClient,
      handleValidationErrors
    ],
    handler: clientController.updateClient
  },
  {
    method: 'delete',
    path: '/clients/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: clientController.deleteClient
  },
  
  // REPAIR
  {
    method: 'post',
    path: '/repairs',
    middlewares: [
      generalLimiter,
      crudLimiter,
      verifyToken, 
      upload.single('image'),
      validateRepair, 
      handleValidationErrors
    ],
    handler: repairController.createRepair
  },
  {
    method: 'get',
    path: '/repairs',
    middlewares: [generalLimiter, verifyToken],
    handler: repairController.getRepairs
  },
  {
    method: 'get',
    path: '/repairs/invoice/new',
    middlewares: [generalLimiter, verifyToken],
    handler: repairController.getNewRepairInvoice
  },
  {
    method: 'get',
    path: '/repairs/invoice/:invoice',
    middlewares: [generalLimiter, verifyToken],
    handler: repairController.getRepairByInvoice
  },
  {
    method: 'get',
    path: '/repairs/:uuid',
    middlewares: [generalLimiter, verifyToken],
    handler: repairController.getRepairById
  },
  {
    method: 'patch',
    path: '/repairs/:uuid/status',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: repairController.updateRepairStatus
  },
  {
    method: 'put',
    path: '/repairs/:uuid',
    middlewares: [
      generalLimiter,
      crudLimiter,
      verifyToken, 
      upload.single('image'), 
      validateRepair, 
      handleValidationErrors
    ],
    handler: repairController.updateRepair
  },
  {
    method: 'delete',
    path: '/repairs/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: repairController.deleteRepair
  },

  // Reports
  {
    method: 'get',
    path: '/reports/customer-recap',
    middlewares: [generalLimiter, verifyToken],
    handler: reportController.getCustomerRecap
  },
  {
    method: 'get',
    path: '/reports/transaction-stats',
    middlewares: [generalLimiter, verifyToken],
    handler: reportController.getTransactionStats
  },
  {
    method: 'get',
    path: '/reports/customer-recap/export',
    middlewares: [generalLimiter, verifyToken],
    handler: reportController.exportCustomerRecap
  },
  {
    method: "delete",
    path: "/reports/:id",
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: reportController.deleteCustomerRecap,
  },

  // Profits
  {
    method: 'get',
    path: '/profits/total-revenue',
    middlewares: [generalLimiter, verifyToken],
    handler: profitController.getTotalRevenue
  },
  {
    method: 'get',
    path: '/profits/revenue-stats',
    middlewares: [generalLimiter, verifyToken],
    handler: profitController.getRevenueStats
  },
  {
    method: 'get',
    path: '/profits/revenue-period',
    middlewares: [generalLimiter, verifyToken],
    handler: profitController.getRevenueByPeriod
  },
  {
    method: 'get',
    path: '/profits/monthly-revenue',
    middlewares: [generalLimiter, verifyToken],
    handler: profitController.getMonthlyRevenue
  },
  {
    method: 'get',
    path: '/profits/monthly-revenue-by-source',
    middlewares: [generalLimiter, verifyToken],
    handler: profitController.getMonthlyRevenueBySource
  },
  {
    method: 'get',
    path: '/profits/recent-transactions',
    middlewares: [generalLimiter, verifyToken],
    handler: profitController.getRecentTransactions
  },

  // Bank Routes
  {
    method: 'get',
    path: '/banks',
    middlewares: [generalLimiter, verifyToken],
    handler: bankController.findBanks
  },
  {
    method: 'post',
    path: '/banks',
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateBank, handleValidationErrors],
    handler: bankController.createBank
  },
  {
    method: 'get',
    path: '/banks/:uuid',
    middlewares: [generalLimiter, verifyToken],
    handler: bankController.findBankById
  },
  {
    method: 'put',
    path: '/banks/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken, validateBank, handleValidationErrors],
    handler: bankController.updateBank
  },
  {
    method: 'delete',
    path: '/banks/:uuid',
    middlewares: [generalLimiter, crudLimiter, verifyToken],
    handler: bankController.deleteBank
  },
  {
    method: 'get',
    path: '/banks-all',
    middlewares: [generalLimiter, verifyToken],
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
