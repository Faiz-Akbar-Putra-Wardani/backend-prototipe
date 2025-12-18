const { body } = require("express-validator");
const prisma = require("../../prisma/client");

const validateDetailProduct = [
  body("product_id")
    .notEmpty().withMessage("Product ID is required")
    .bail()
    .custom(async (value) => {
      const product = await prisma.product.findUnique({
        where: { id: Number(value) },
      });
      if (!product) {
        throw new Error("Product not found");
      }
      return true;
    }),

  body("brand").notEmpty().withMessage("Brand is required"),
  body("model").notEmpty().withMessage("Model is required"),
  body("cylinder").notEmpty().withMessage("Cylinder is required"),
  body("piston_displ").notEmpty().withMessage("Piston displacement is required"),
  body("rated_speed").notEmpty().withMessage("Rated speed is required"),
  body("bore_stroke").notEmpty().withMessage("Bore stroke is required"),
  body("governor").notEmpty().withMessage("Governor is required"),
  body("aspiration").notEmpty().withMessage("Aspiration is required"),
  body("oil_capacity").notEmpty().withMessage("Oil capacity is required"),
  body("fuel_capacity").notEmpty().withMessage("Fuel capacity is required"),
  body("cooling_system").notEmpty().withMessage("Cooling system is required"),
  body("prime_power").notEmpty().withMessage("Prime power is required"),
  body("standby_power").notEmpty().withMessage("Standby power is required"),
  body("voltage").notEmpty().withMessage("Voltage is required"),
  body("alternator").notEmpty().withMessage("Alternator is required"),
  body("dimension_open").notEmpty().withMessage("Dimension (open) is required"),
  body("weight_open").notEmpty().withMessage("Weight (open) is required"),
  body("dimension_silent").notEmpty().withMessage("Dimension (silent) is required"),
  body("weight_silent").notEmpty().withMessage("Weight (silent) is required"),

  body("load_100")
    .notEmpty().withMessage("Load 100% is required"),

  body("load_75")
    .notEmpty().withMessage("Load 75% is required"),

  body("load_50")
    .notEmpty().withMessage("Load 50% is required"),
];

module.exports = { validateDetailProduct };
