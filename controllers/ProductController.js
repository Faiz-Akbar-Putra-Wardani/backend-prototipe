const prisma = require("../prisma/client");
const fs = require("fs");

// Ambil semua produk (pagination + search)
const findProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const products = await prisma.product.findMany({
            where: { title: { contains: search } },
            select: {
                uuid: true,
                title: true,
                description: true,
                sell_price: true,
                rent_price: true,
                stock: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { id: "desc" },
            skip,
            take: limit,
        });

        const total = await prisma.product.count({
            where: { title: { contains: search } },
        });

        res.status(200).send({
            meta: { success: true, message: "Berhasil mengambil semua produk" },
            data: products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                perPage: limit,
                total,
            },
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: error.message,
        });
    }
};

// Tambah produk baru
const createProduct = async (req, res) => {
    try {
        // Safe parsing dengan validasi
        const categoryId = parseInt(req.body.category_id);
        const sellPrice = parseFloat(req.body.sell_price);
        const stock = parseInt(req.body.stock);
        
        // Double check jika ada yang NaN (seharusnya sudah tertangkap validator)
        if (isNaN(categoryId) || isNaN(sellPrice) || isNaN(stock)) {
            return res.status(422).send({
                success: false,
                message: "Invalid input data",
                errors: [
                    { msg: "Category, sell price, and stock must be valid numbers", path: "general" }
                ]
            });
        }

        // Parse rent_price (optional)
        let rentPrice = null;
        if (req.body.rent_price && req.body.rent_price !== "") {
            rentPrice = parseFloat(req.body.rent_price);
            if (isNaN(rentPrice)) {
                rentPrice = null;
            }
        }

        const product = await prisma.product.create({
            data: {
                title: req.body.title,
                description: req.body.description || null,
                sell_price: sellPrice,
                rent_price: rentPrice,
                stock: stock,
                image: req.file ? req.file.path : null,
                category_id: categoryId,
            },
            select: {
                uuid: true,
                title: true,
                description: true,
                sell_price: true,
                rent_price: true,
                stock: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: { select: { uuid: true, name: true } },
            }
        });

        res.status(201).send({
            meta: { success: true, message: "Produk berhasil dibuat" },
            data: product,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).send({
            meta: { success: false, message: "Kesalahan server saat membuat produk" },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};


// Ambil produk by UUID
const findProductById = async (req, res) => {
    const { uuid } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                title: true,
                description: true,
                sell_price: true,
                rent_price: true,
                stock: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!product) {
            return res.status(404).send({
                meta: { success: false, message: `Produk dengan UUID ${uuid} tidak ditemukan` },
            });
        }

        res.status(200).send({
            meta: { success: true, message: "Berhasil mengambil produk" },
            data: product,
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: error.message,
        });
    }
};

// Update produk by UUID
const updateProduct = async (req, res) => {
    const { uuid } = req.params;

    try {
        const existing = await prisma.product.findUnique({ where: { uuid } });
        if (!existing) {
            return res.status(404).send({
                meta: { success: false, message: `Produk dengan UUID ${uuid} tidak ditemukan` },
            });
        }

        let dataProduct = {
            title: req.body.title,
            description: req.body.description || null,
            sell_price: parseFloat(req.body.sell_price),
            rent_price: req.body.rent_price ? parseFloat(req.body.rent_price) : null,
            stock: parseInt(req.body.stock),
            category_id: parseInt(req.body.category_id),
        };

        if (req.file) {
            dataProduct.image = req.file.path;

            if (existing.image && fs.existsSync(existing.image)) {
                fs.unlinkSync(existing.image);
            }
        }

        const product = await prisma.product.update({
            where: { uuid },
            data: dataProduct,
            select: {
                uuid: true,
                title: true,
                description: true,
                sell_price: true,
                rent_price: true,
                stock: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: { select: { id: true, name: true } },
            }
        });

        res.status(200).send({
            meta: { success: true, message: "Produk berhasil diperbarui" },
            data: product,
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: error.message,
        });
    }
};

// Hapus produk by UUID
const deleteProduct = async (req, res) => {
    const { uuid } = req.params;

    try {
        const product = await prisma.product.findUnique({ where: { uuid } });

        if (!product) {
            return res.status(404).send({
                meta: { success: false, message: `Produk dengan UUID ${uuid} tidak ditemukan` },
            });
        }

        await prisma.product.delete({ where: { uuid } });

        if (product.image && fs.existsSync(product.image)) {
            fs.unlinkSync(product.image);
        }

        res.status(200).send({
            meta: { success: true, message: "Produk berhasil dihapus" },
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: error.message,
        });
    }
};

// Produk by kategori
const findProductByCategoryId = async (req, res) => {
    const { id } = req.params;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const products = await prisma.product.findMany({
            where: { category_id: Number(id) },
            select: {
                uuid: true,
                title: true,
                description: true,
                sell_price: true,
                rent_price: true,
                stock: true,
                image: true,
            },
            orderBy: { id: "desc" },
            skip,
            take: limit,
        });

        const total = await prisma.product.count({
            where: { category_id: Number(id) },
        });

        res.status(200).send({
            meta: { success: true, message: "Berhasil mengambil produk berdasarkan kategori" },
            data: products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                perPage: limit,
                total,
            },
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: error.message,
        });
    }
};

// Semua produk (dropdown)
const allProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                uuid: true,
                title: true,
                sell_price: true,
                rent_price: true,
                image: true,
                stock: true,
                category: { select: { id: true, name: true } },
                _count: {
                    select: { specifications: true }
                }
            },
            orderBy: { id: "desc" },
        });

        const productsWithFlag = products.map(p => ({
            ...p,
            hasDetailProduct: p._count.specifications > 0
        }));

        res.status(200).send({
            meta: { success: true, message: "Berhasil mengambil semua produk" },
            data: productsWithFlag, 
        });
    } catch (error) {
        console.error("Error in allProducts:", error);  
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: [{ msg: error.message, path: "general" }],  
        });
    }
};


const publicProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const categoryUuid = req.query.category;
        const search = req.query.search || ""; 

        // Build where condition
        let whereCondition = {};
        
        if (categoryUuid) {
            const category = await prisma.category.findUnique({
                where: { uuid: categoryUuid },
                select: { id: true }
            });
            
            if (category) {
                whereCondition.category_id = category.id;
            }
        }

        if (search && search.trim()) {
            whereCondition.OR = [
                // Search di title product
                {
                    title: {
                        contains: search,
                    }
                },
                // Search di specifications (brand)
                {
                    specifications: {
                        some: {
                            brand: {
                                contains: search,
                             
                            }
                        }
                    }
                },
                // Search di specifications (model)
                {
                    specifications: {
                        some: {
                            model: {
                                contains: search,
                              
                            }
                        }
                    }
                },
                // Search di specifications (prime_power)
                {
                    specifications: {
                        some: {
                            prime_power: {
                                contains: search,
                                
                            }
                        }
                    }
                }
            ];
        }

        const products = await prisma.product.findMany({
            where: whereCondition,
            select: {
                uuid: true,      
                title: true,
                image: true,
                sell_price: true,
                rent_price: true,
                stock: true,
                category: {
                    select: { 
                        uuid: true,
                        name: true 
                    },
                },
                specifications: {
                    select: {
                        brand: true,
                        model: true,
                        prime_power: true,
                    },
                    take: 1, 
                }
            },
            orderBy: { created_at: "desc" },
            skip,
            take: limit,
        });

        const total = await prisma.product.count({
            where: whereCondition,
        });

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Berhasil mendapatkan produk publik" 
            },
            data: products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                perPage: limit,
                total,
            },
        });
    } catch (error) {
        console.error("Error in publicProducts:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};


const publicProductDetail = async (req, res) => {
    const { uuid } = req.params;
    
    try {
        const product = await prisma.product.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                title: true,
                description: true,
                image: true,
                sell_price: true,
                rent_price: true,
                stock: true,
                created_at: true,
                category: {
                    select: { 
                        uuid: true,
                        name: true,
                        image: true,
                    },
                },
               
                specifications: {
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
                    }
                }
            },
        });

        if (!product) {
            return res.status(404).send({
                meta: { 
                    success: false, 
                    message: `Produk dengan UUID ${uuid} tidak ditemukan` 
                },
            });
        }

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Berhasil mendapatkan detail produk" 
            },
            data: product,
        });
    } catch (error) {
        console.error("Error in publicProductDetail:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};


module.exports = {
    findProducts,
    createProduct,
    findProductById,
    updateProduct,
    deleteProduct,
    findProductByCategoryId,
    allProducts,
    publicProducts,
    publicProductDetail
};
