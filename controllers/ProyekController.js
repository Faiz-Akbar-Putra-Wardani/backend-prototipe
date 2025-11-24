const express = require("express");
const prisma = require("../prisma/client");
const fs = require("fs");

const findProjects= async (req, res) => {
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
                id: true,
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
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const createproject = async (req, res) => {
    try{
        const project = await prisma.project.create({
            data: {
                project_name: req.body.project_name,
                location: req.body.location,
                image: req.file.path,
            },
        });

        res.status(201).send({
            meta: {
                success: true,
                message: "Proyek berhasil dibuat",
            },
            data: project,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const findprojectById = async (req, res) => {
   
    const { id } = req.params;

    try {
        
        const project = await prisma.project.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
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
                    message: `Proyek dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mendapatkan proyek dengan ID: ${id}`,
            },
            data: project,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const updateproject = async (req, res) => {
    
    const { id } = req.params;

    try {
        const dataProject = {
            project_name: req.body.name,
            location: req.body.location,
            updated_at: new Date(),
        };
        if (req.file) {

            dataProject.image = req.file.path;

            const project = await prisma.project.findUnique({
                where: {
                    id: Number(id),
                },
            });

            if (project.image) {
                fs.unlinkSync(project.image);
            }
        }

        const project= await prisma.project.update({
            where: {
                id: Number(id),
            },
            data: dataProject,
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Proyek berhasil diperbarui",
            },
            data: project,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!project) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Proyek dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        await prisma.project.delete({
            where: {
                id: Number(id),
            },
        });

        if (project.image) {
            const imagePath = project.image;
            const fileName = imagePath.substring(imagePath.lastIndexOf("/") + 1);
            const filePath = `uploads/${fileName}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(200).send({
            meta: {
                success: true,
                message: "Proyek berhasil dihapus",
            },
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const allProjects = async (req, res) => {
    try {
        
        const projects = await prisma.project.findMany({
            select: {
                id: true,
                project_name: true,
                location: true,
                image: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                id: "desc",
            }
        });

        // Kirim respons
        res.status(200).send({
            // Meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua proyek",
            },
            data: projects,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};


module.exports = {
    findProjects,
    createproject,
    findprojectById,
    updateproject,
    deleteProject,
    allProjects
};