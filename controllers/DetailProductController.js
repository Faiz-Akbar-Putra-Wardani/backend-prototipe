const prisma = require("../prisma/client");
const fs = require("fs");
const findDetailProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const specs = await prisma.productSpecification.findMany({
      where: {
        OR: [
          { brand: { contains: search } },
          { model: { contains: search } },
        ],
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.productSpecification.count({
      where: {
        OR: [
          { brand: { contains: search } },
          { model: { contains: search } },
        ],
      },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Berhasil mendapatkan semua detail produk",
      },
      data: specs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: error.message,
    });
  }
};
const findDetailProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const spec = await prisma.productSpecification.findUnique({
      where: { id: Number(id) },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!spec) {
      return res.status(404).json({
        meta: { success: false, message: `Detail produk ID ${id} tidak ditemukan` },
      });
    }

    res.status(200).json({
      meta: { success: true, message: "Berhasil mendapatkan detail produk" },
      data: spec,
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: error.message,
    });
  }
};

const createDetailProduct = async (req, res) => {
  try {
    const data = req.body;

    const product = await prisma.product.findUnique({
      where: { id: Number(data.product_id) },
    });

    if (!product) {
      return res.status(404).json({
        meta: { success: false, message: "Produk tidak ditemukan" },
      });
    }

    const newSpec = await prisma.productSpecification.create({
      data: {
        product_id: Number(data.product_id),
        brand: data.brand,
        model: data.model,
        cylinder: data.cylinder,
        piston_displ: data.piston_displ,
        rated_speed: data.rated_speed,
        bore_stroke: data.bore_stroke,
        governor: data.governor,
        aspiration: data.aspiration,
        oil_capacity: data.oil_capacity,
        fuel_capacity: data.fuel_capacity,
        cooling_system: data.cooling_system,
        load_100: parseFloat(data.load_100),
        load_75: parseFloat(data.load_75),
        load_50: parseFloat(data.load_50),
        prime_power: data.prime_power,
        standby_power: data.standby_power,
        voltage: data.voltage,
        alternator: data.alternator,
        dimension_open: data.dimension_open,
        weight_open: data.weight_open,
        dimension_silent: data.dimension_silent,
        weight_silent: data.weight_silent,
      },
    });

    res.status(201).json({
      meta: { success: true, message: "Detail produk berhasil dibuat" },
      data: newSpec,
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: error.message,
    });
  }
};

const updateDetailProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const spec = await prisma.productSpecification.findUnique({
      where: { id: Number(id) },
    });

    if (!spec) {
      return res.status(404).json({
        meta: { success: false, message: "Detail produk tidak ditemukan" },
      });
    }
    
    const updateData = {
      brand: data.brand,
      model: data.model,
      cylinder: data.cylinder,
      piston_displ: data.piston_displ,
      rated_speed: data.rated_speed,
      bore_stroke: data.bore_stroke,
      governor: data.governor,
      aspiration: data.aspiration,
      oil_capacity: data.oil_capacity,
      fuel_capacity: data.fuel_capacity,
      cooling_system: data.cooling_system,
      load_100: parseFloat(data.load_100),
      load_75: parseFloat(data.load_75),
      load_50: parseFloat(data.load_50),
      prime_power: data.prime_power,
      standby_power: data.standby_power,
      voltage: data.voltage,
      alternator: data.alternator,
      dimension_open: data.dimension_open,
      weight_open: data.weight_open,
      dimension_silent: data.dimension_silent,
      weight_silent: data.weight_silent,
      updated_at: new Date(),
    };

    if (data.product_id) {
      updateData.product = {
        connect: { id: Number(data.product_id) },
      };
    }

    const updatedSpec = await prisma.productSpecification.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.status(200).json({
      meta: { success: true, message: "Detail produk berhasil diperbarui" },
      data: updatedSpec,
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: error.message,
    });
  }
};

const deleteDetailProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const spec = await prisma.productSpecification.findUnique({
      where: { id: Number(id) },
    });

    if (!spec) {
      return res.status(404).json({
        meta: { success: false, message: "Detail produk tidak ditemukan" },
      });
    }

    await prisma.productSpecification.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      meta: { success: true, message: "Detail produk berhasil dihapus" },
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: error.message,
    });
  }
};

const findProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await prisma.product.findMany({
      where: { category_id: Number(categoryId) },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    res.status(200).json({
      meta: { success: true, message: "Berhasil mendapatkan produk berdasarkan kategori" },
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: error.message,
    });
  }
};

module.exports = {
  findDetailProducts,
  findDetailProductById,
  createDetailProduct,
  updateDetailProduct,
  deleteDetailProduct,
  findProductsByCategory,
};
