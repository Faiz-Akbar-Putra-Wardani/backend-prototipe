const express = require("express");
const prisma = require("../prisma/client");
const fs = require("fs");

// Ambil semua projects (pagination + search)
const findProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const projects = await prisma.project.findMany({
            where: {
                project_name: {
                    contains: search, 
                },
            },
            select: {
                uuid: true,  
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        const totalProjects = await prisma.project.count({
            where: {
                project_name: {
                    contains: search, 
                },
            },
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

// Buat project baru
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

        const project = await prisma.project.create({
            data: {
                project_name: req.body.project_name,
                location: req.body.location,
                image: req.file.path,
            },
            select: {
                uuid: true,  
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
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

// Ambil project by UUID
const findprojectById = async (req, res) => {
    const { uuid } = req.params;  

    try {
        console.log("Fetching project with UUID:", uuid);

        const project = await prisma.project.findUnique({
            where: {
                uuid: uuid,  
            },
            select: {
                uuid: true,  
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
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

// Update project by UUID
const updateproject = async (req, res) => {
    const { uuid } = req.params;  

    try {
        console.log("Updating project with UUID:", uuid);

        // Cek apakah project ada
        const existingProject = await prisma.project.findUnique({
            where: {
                uuid: uuid,  
            },
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

        // Handle image upload
        if (req.file) {
            dataProject.image = req.file.path;

            // Hapus gambar lama jika ada
            if (existingProject.image && fs.existsSync(existingProject.image)) {
                fs.unlinkSync(existingProject.image);
            }
        }

        const project = await prisma.project.update({
            where: {
                uuid: uuid,  
            },
            data: dataProject,
            select: {
                uuid: true,  
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
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

// Hapus project by UUID
const deleteProject = async (req, res) => {
    const { uuid } = req.params;  

    try {
        console.log("Deleting project with UUID:", uuid);

        const project = await prisma.project.findUnique({
            where: {
                uuid: uuid,  
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

        await prisma.project.delete({
            where: {
                uuid: uuid,  
            },
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

// Ambil semua projects (tanpa pagination)
// Di ProyekController.js
const publicProjects = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10; // Batasi max 10 untuk performa
        
        const projects = await prisma.project.findMany({
            select: {  
                project_name: true,
                location: true,
                image: true,
            },
            orderBy: {
                created_at: "desc", 
            },
            take: limit,
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mendapatkan proyek publik",
            },
            data: projects,
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
