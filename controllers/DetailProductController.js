const prisma = require("../prisma/client");

// Ambil semua detail produk (pagination + search)
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
      select: {
        uuid: true,
        brand: true,
        model: true,
        cylinder: true,
        piston_displ: true,
        rated_speed: true,
        bore_stroke: true,
        governor: true,
        aspiration: true,
        oil_capacity: true,
        fuel_capacity: true,
        cooling_system: true,
        load_100: true,
        load_75: true,
        load_50: true,
        prime_power: true,
        standby_power: true,
        voltage: true,
        alternator: true,
        dimension_open: true,
        weight_open: true,
        dimension_silent: true,
        weight_silent: true,
        created_at: true,
        updated_at: true,
        product: {
          select: {
            uuid: true,
            title: true,
            category: {
              select: {
                uuid: true,
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
    console.error("Error in findDetailProducts:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};

// Ambil detail produk by UUID
const findDetailProductById = async (req, res) => {
  try {
    const { uuid } = req.params; 

    console.log("Fetching detail product with UUID:", uuid);

    const spec = await prisma.productSpecification.findUnique({
      where: { uuid },  
      select: {
        uuid: true,
        product_id: true,
        brand: true,
        model: true,
        cylinder: true,
        piston_displ: true,
        rated_speed: true,
        bore_stroke: true,
        governor: true,
        aspiration: true,
        oil_capacity: true,
        fuel_capacity: true,
        cooling_system: true,
        load_100: true,
        load_75: true,
        load_50: true,
        prime_power: true,
        standby_power: true,
        voltage: true,
        alternator: true,
        dimension_open: true,
        weight_open: true,
        dimension_silent: true,
        weight_silent: true,
        created_at: true,
        updated_at: true,
        product: {
          select: {
            uuid: true,
            title: true,
            category: {
              select: { uuid: true, name: true },
            },
          },
        },
      },
    });

    if (!spec) {
      return res.status(404).json({
        meta: { success: false, message: `Detail produk dengan UUID ${uuid} tidak ditemukan` },
      });
    }

    console.log("Detail product found:", spec);

    res.status(200).json({
      meta: { success: true, message: "Berhasil mendapatkan detail produk" },
      data: spec,
    });
  } catch (error) {
    console.error("Error in findDetailProductById:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};

// Buat detail produk baru
const createDetailProduct = async (req, res) => {
  try {
    const data = req.body;

    // Validasi product_id
    const productId = parseInt(data.product_id);
    if (isNaN(productId)) {
      return res.status(422).json({
        success: false,
        message: "Product ID tidak valid",
        errors: [{ msg: "Product ID harus berupa angka", path: "product_id" }],
      });
    }

    // Cek apakah produk ada
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        meta: { success: false, message: "Produk tidak ditemukan" },
      });
    }

    // Validasi numeric fields
    const load100 = parseFloat(data.load_100);
    const load75 = parseFloat(data.load_75);
    const load50 = parseFloat(data.load_50);

    if (isNaN(load100) || isNaN(load75) || isNaN(load50)) {
      return res.status(422).json({
        success: false,
        message: "Load values harus berupa angka",
        errors: [{ msg: "Load 100, 75, dan 50 harus berupa angka", path: "load" }],
      });
    }

    const newSpec = await prisma.productSpecification.create({
      data: {
        product_id: productId,
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
        load_100: load100,
        load_75: load75,
        load_50: load50,
        prime_power: data.prime_power,
        standby_power: data.standby_power,
        voltage: data.voltage,
        alternator: data.alternator,
        dimension_open: data.dimension_open,
        weight_open: data.weight_open,
        dimension_silent: data.dimension_silent,
        weight_silent: data.weight_silent,
      },
      select: {
        uuid: true,
        brand: true,
        model: true,
        created_at: true,
        updated_at: true,
        product: {
          select: {
            uuid: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json({
      meta: { success: true, message: "Detail produk berhasil dibuat" },
      data: newSpec,
    });
  } catch (error) {
    console.error("Error creating detail product:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};

// Update detail produk by UUID
const updateDetailProduct = async (req, res) => {
  try {
    const { uuid } = req.params;  
    const data = req.body;

    console.log("Updating detail product with UUID:", uuid);

    // Cek apakah spec ada
    const spec = await prisma.productSpecification.findUnique({
      where: { uuid },  
    });

    if (!spec) {
      return res.status(404).json({
        meta: { success: false, message: "Detail produk tidak ditemukan" },
      });
    }

    // Validasi numeric fields
    const load100 = parseFloat(data.load_100);
    const load75 = parseFloat(data.load_75);
    const load50 = parseFloat(data.load_50);

    if (isNaN(load100) || isNaN(load75) || isNaN(load50)) {
      return res.status(422).json({
        success: false,
        message: "Load values harus berupa angka",
        errors: [{ msg: "Load 100, 75, dan 50 harus berupa angka", path: "load" }],
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
      load_100: load100,
      load_75: load75,
      load_50: load50,
      prime_power: data.prime_power,
      standby_power: data.standby_power,
      voltage: data.voltage,
      alternator: data.alternator,
      dimension_open: data.dimension_open,
      weight_open: data.weight_open,
      dimension_silent: data.dimension_silent,
      weight_silent: data.weight_silent,
    };

    // Update product_id jika disediakan
    if (data.product_id) {
      const productId = parseInt(data.product_id);
      if (!isNaN(productId)) {
        updateData.product_id = productId;
      }
    }

    const updatedSpec = await prisma.productSpecification.update({
      where: { uuid },  
      data: updateData,
      select: {
        uuid: true,
        brand: true,
        model: true,
        created_at: true,
        updated_at: true,
        product: {
          select: {
            uuid: true,
            title: true,
          },
        },
      },
    });

    res.status(200).json({
      meta: { success: true, message: "Detail produk berhasil diperbarui" },
      data: updatedSpec,
    });
  } catch (error) {
    console.error("Error updating detail product:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};

// Hapus detail produk by UUID
const deleteDetailProduct = async (req, res) => {
  try {
    const { uuid } = req.params;  

    console.log("Deleting detail product with UUID:", uuid);

    const spec = await prisma.productSpecification.findUnique({
      where: { uuid },  
    });

    if (!spec) {
      return res.status(404).json({
        meta: { success: false, message: "Detail produk tidak ditemukan" },
      });
    }

    await prisma.productSpecification.delete({
      where: { uuid },  
    });

    res.status(200).json({
      meta: { success: true, message: "Detail produk berhasil dihapus" },
    });
  } catch (error) {
    console.error("Error deleting detail product:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};

// Ambil produk berdasarkan kategori (untuk dropdown)
const findProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await prisma.product.findMany({
      where: { category_id: Number(categoryId) },
      select: { 
        id: true,
        uuid: true,
        title: true 
      },
      orderBy: { title: "asc" },
    });

    res.status(200).json({
      meta: { success: true, message: "Berhasil mendapatkan produk berdasarkan kategori" },
      data: products,
    });
  } catch (error) {
    console.error("Error in findProductsByCategory:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan di server" },
      errors: [{ msg: error.message, path: "general" }],
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
