
const prisma = require("../prisma/client");
const fs = require("fs");

const findProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const categoryId = req.query.category_id; 

        let whereCondition = {
            project_name: {
                contains: search,
            },
        };

        // Filter by category jika ada
        if (categoryId) {
            whereCondition.project_category_id = parseInt(categoryId);
        }

        const projects = await prisma.project.findMany({
            where: whereCondition,
            select: {
                uuid: true,
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        id: true,
                        uuid: true,
                        name: true,
                        slug: true,
                    }
                }
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        const totalProjects = await prisma.project.count({
            where: whereCondition,
        });

        const totalPages = Math.ceil(totalProjects / limit);

        res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua proyek",
            },
            data: projects,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalProjects,
            },
        });
    } catch (error) {
        console.error("Error in findProjects:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const createproject = async (req, res) => {
    try {
        // Validasi file image
        if (!req.file) {
            return res.status(422).send({
                success: false,
                message: "Image is required",
                errors: [{ msg: "Image harus diupload", path: "image" }],
            });
        }

        // Validasi category_id
        const categoryId = parseInt(req.body.project_category_id);
        
        if (isNaN(categoryId)) {
            return res.status(422).send({
                success: false,
                message: "Category ID tidak valid",
                errors: [{ msg: "Category ID harus berupa angka", path: "project_category_id" }],
            });
        }

        const categoryExists = await prisma.projectCategory.findUnique({
            where: { id: categoryId }
        });

        if (!categoryExists) {
            return res.status(404).send({
                success: false,
                message: "Kategori proyek tidak ditemukan",
                errors: [{ msg: "Category ID tidak valid", path: "project_category_id" }],
            });
        }

        const project = await prisma.project.create({
            data: {
                project_name: req.body.project_name,
                location: req.body.location,
                project_category_id: categoryId,
                image: req.file.path,
            },
            select: {
                uuid: true,
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        uuid: true,
                        name: true,
                        slug: true,
                    }
                }
            }
        });

        res.status(201).send({
            meta: {
                success: true,
                message: "Proyek berhasil dibuat",
            },
            data: project,
        });
    } catch (error) {
        console.error("Error in createproject:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const findprojectById = async (req, res) => {
    const { uuid } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        id: true,
                        uuid: true,
                        name: true,
                        slug: true,
                    }
                }
            },
        });

        if (!project) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Proyek dengan UUID: ${uuid} tidak ditemukan`,
                },
            });
        }

        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mendapatkan proyek dengan UUID: ${uuid}`,
            },
            data: project,
        });
    } catch (error) {
        console.error("Error in findprojectById:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const updateproject = async (req, res) => {
    const { uuid } = req.params;

    try {
        // Cek apakah project ada
        const existingProject = await prisma.project.findUnique({
            where: { uuid },
        });

        if (!existingProject) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Proyek dengan UUID: ${uuid} tidak ditemukan`,
                },
            });
        }

        const dataProject = {
            project_name: req.body.project_name,
            location: req.body.location,
        };

        // Update category jika ada
        if (req.body.project_category_id) {
            const categoryId = parseInt(req.body.project_category_id);
            
            if (isNaN(categoryId)) {
                return res.status(422).send({
                    success: false,
                    message: "Category ID tidak valid",
                    errors: [{ msg: "Category ID harus berupa angka", path: "project_category_id" }],
                });
            }

            const categoryExists = await prisma.projectCategory.findUnique({
                where: { id: categoryId }
            });

            if (!categoryExists) {
                return res.status(404).send({
                    success: false,
                    message: "Kategori proyek tidak ditemukan",
                    errors: [{ msg: "Category ID tidak valid", path: "project_category_id" }],
                });
            }

            dataProject.project_category_id = categoryId;
        }

        // Handle image upload
        if (req.file) {
            dataProject.image = req.file.path;

            // Hapus gambar lama jika ada
            if (existingProject.image && fs.existsSync(existingProject.image)) {
                fs.unlinkSync(existingProject.image);
            }
        }

        const project = await prisma.project.update({
            where: { uuid },
            data: dataProject,
            select: {
                uuid: true,
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        uuid: true,
                        name: true,
                        slug: true,
                    }
                }
            }
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Proyek berhasil diperbarui",
            },
            data: project,
        });
    } catch (error) {
        console.error("Error in updateproject:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const deleteProject = async (req, res) => {
    const { uuid } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: { uuid },
        });

        if (!project) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Proyek dengan UUID: ${uuid} tidak ditemukan`,
                },
            });
        }

        await prisma.project.delete({
            where: { uuid },
        });

        if (project.image && fs.existsSync(project.image)) {
            fs.unlinkSync(project.image);
        }

        res.status(200).send({
            meta: {
                success: true,
                message: "Proyek berhasil dihapus",
            },
        });
    } catch (error) {
        console.error("Error in deleteProject:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

const publicProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const categorySlug = req.query.category;
        const search = req.query.search || ""; // ✅ Tambahkan search

        let whereCondition = {};

        // ✅ Filter by search - cari di project_name dan location
        if (search && search.trim()) {
            whereCondition.OR = [
                {
                    project_name: {
                        contains: search,
                        
                    }
                },
                {
                    location: {
                        contains: search,
                    }
                }
            ];
        }

        // Filter by category slug
        if (categorySlug) {
            whereCondition.category = {
                slug: categorySlug
            };
        }

        const projects = await prisma.project.findMany({
            where: whereCondition,
            select: {
                uuid: true,
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                category: {
                    select: {
                        name: true,
                        slug: true,
                    }
                }
            },
            orderBy: {
                created_at: "desc",
            },
            skip,
            take: limit,
        });

        const total = await prisma.project.count({
            where: whereCondition,
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mendapatkan proyek publik",
            },
            data: projects,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                perPage: limit,
                total,
            },
        });
    } catch (error) {
        console.error("Error in publicProjects:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};


module.exports = {
    findProjects,
    createproject,
    findprojectById,
    updateproject,
    deleteProject,
    publicProjects
};
