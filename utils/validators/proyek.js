// Import express validator
const { body, check } = require("express-validator");

const prisma = require('../../prisma/client');

const validateProject = [
  body("project_name").notEmpty().withMessage("Project Name is required"),
  body("location").notEmpty().withMessage("location is required"),
  check("image").custom((value, { req }) => {
    if (req.method === 'POST' && !req.file) {
      throw new Error("Image is required");
    }
    return true;
  }),

];

module.exports = { validateProject };