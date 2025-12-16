// controllers/ProjectCategoryController.js

const prisma = require("../prisma/client");
const findProjectCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const categories = await prisma.projectCategory.findMany({
            where: {
                name: {
                    contains: search,
                },
            },
            select: {
                uuid: true,
                name: true,
                slug: true,
                created_at: true,
                updated_at: true,
                _count: {
                    select: { projects: true }
                }
            },
            orderBy: {
                created_at: "desc",
            },
            skip,
            take: limit,
        });

        const totalCategories = await prisma.projectCategory.count({
            where: {
                name: {
                    contains: search,
                },
            },
        });

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Berhasil mendapatkan semua kategori proyek" 
            },
            data: categories,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCategories / limit),
                perPage: limit,
                total: totalCategories,
            },
        });
    } catch (error) {
        console.error("Error in findProjectCategories:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const createProjectCategory = async (req, res) => {
    try {
        // Cek apakah slug sudah ada
        const existingSlug = await prisma.projectCategory.findUnique({
            where: { slug: req.body.slug }
        });

        if (existingSlug) {
            return res.status(422).send({
                success: false,
                message: "Slug sudah digunakan",
                errors: [{ msg: "Slug harus unique", path: "slug" }],
            });
        }

        const category = await prisma.projectCategory.create({
            data: {
                name: req.body.name,
                slug: req.body.slug,
            },
            select: {
                uuid: true,
                name: true,
                slug: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(201).send({
            meta: { 
                success: true, 
                message: "Kategori proyek berhasil dibuat" 
            },
            data: category,
        });
    } catch (error) {
        console.error("Error in createProjectCategory:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};
const findProjectCategoryById = async (req, res) => {
    const { uuid } = req.params;

    try {
        const category = await prisma.projectCategory.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                name: true,
                slug: true,
                created_at: true,
                updated_at: true,
                _count: {
                    select: { projects: true }
                }
            },
        });

        if (!category) {
            return res.status(404).send({
                meta: { 
                    success: false, 
                    message: `Kategori proyek dengan UUID: ${uuid} tidak ditemukan` 
                },
            });
        }

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Berhasil mendapatkan kategori proyek" 
            },
            data: category,
        });
    } catch (error) {
        console.error("Error in findProjectCategoryById:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const updateProjectCategory = async (req, res) => {
    const { uuid } = req.params;

    try {
        // Cek apakah category ada
        const existingCategory = await prisma.projectCategory.findUnique({
            where: { uuid }
        });

        if (!existingCategory) {
            return res.status(404).send({
                meta: { 
                    success: false, 
                    message: `Kategori proyek dengan UUID: ${uuid} tidak ditemukan` 
                },
            });
        }

        // Cek jika slug diubah, pastikan tidak bentrok
        if (req.body.slug && req.body.slug !== existingCategory.slug) {
            const slugExists = await prisma.projectCategory.findUnique({
                where: { slug: req.body.slug }
            });

            if (slugExists) {
                return res.status(422).send({
                    success: false,
                    message: "Slug sudah digunakan",
                    errors: [{ msg: "Slug harus unique", path: "slug" }],
                });
            }
        }

        const dataCategory = {
            name: req.body.name,
            slug: req.body.slug,
            updated_at: new Date(),
        };

        const category = await prisma.projectCategory.update({
            where: { uuid },
            data: dataCategory,
            select: {
                uuid: true,
                name: true,
                slug: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Kategori proyek berhasil diperbarui" 
            },
            data: category,
        });
    } catch (error) {
        console.error("Error in updateProjectCategory:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const deleteProjectCategory = async (req, res) => {
    const { uuid } = req.params;

    try {
        const category = await prisma.projectCategory.findUnique({
            where: { uuid },
            include: {
                _count: {
                    select: { projects: true }
                }
            }
        });

        if (!category) {
            return res.status(404).send({
                meta: { 
                    success: false, 
                    message: `Kategori proyek dengan UUID: ${uuid} tidak ditemukan` 
                },
            });
        }

        // Cek apakah ada project yang menggunakan category ini
        if (category._count.projects > 0) {
            return res.status(422).send({
                success: false,
                message: "Kategori tidak bisa dihapus",
                errors: [{ 
                    msg: `Masih ada ${category._count.projects} proyek yang menggunakan kategori ini`, 
                    path: "category" 
                }],
            });
        }

        await prisma.projectCategory.delete({ where: { uuid } });

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Kategori proyek berhasil dihapus" 
            },
        });
    } catch (error) {
        console.error("Error in deleteProjectCategory:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const allProjectCategories = async (req, res) => {
    try {
        const categories = await prisma.projectCategory.findMany({
            select: {
                id: true,
                uuid: true,
                name: true,
                slug: true,
            },
            orderBy: { name: "asc" },
        });

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Berhasil mendapatkan semua kategori proyek" 
            },
            data: categories,
        });
    } catch (error) {
        console.error("Error in allProjectCategories:", error);
        res.status(500).send({
            meta: { 
                success: false, 
                message: "Terjadi kesalahan di server" 
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const publicProjectCategories = async (req, res) => {
    try {
        const categories = await prisma.projectCategory.findMany({
            select: {
                uuid: true,
                name: true,
                slug: true,
            },
            orderBy: { name: "asc" }
        });

        res.status(200).send({
            meta: { 
                success: true, 
                message: "Berhasil mendapatkan kategori proyek publik" 
            },
            data: categories,
        });
    } catch (error) {
        console.error("Error in publicProjectCategories:", error);
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
    findProjectCategories,
    createProjectCategory,
    findProjectCategoryById,
    updateProjectCategory,
    deleteProjectCategory,
    allProjectCategories,
    publicProjectCategories,
};
