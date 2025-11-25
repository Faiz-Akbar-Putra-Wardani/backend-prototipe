const express = require("express");
const prisma = require("../prisma/client");
const fs = require("fs");

const findClients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const clients = await prisma.partnership.findMany({
           where: {
            name:{
                contains: search,
            },
           },
           select: {
                id: true,
                name: true,
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

        const totalClients = await prisma.partnership.count({
            where: {
                name: {
                    contains: search,
                },
            },
        });
        const totalPages = Math.ceil(totalClients / limit);

        res.status(200).send({
            data: clients,
            pagination: {
            currentPage: page,
            perPage: limit,
            total: totalClients,
            totalPage: totalPages
    }
});

    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
        });
    }
};

const createClient = async (req, res) => {
    try {
        const client = await prisma.partnership.create({
            data: {
                name: req.body.name,
                image: req.file.path,
            }
        });

        res.status(201).send({
            meta: {
                succces: true,
                message: "Klien berhasil dibuat",
            },
            data: client,
        });
    } catch(error){
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const findClientsById = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await prisma.partnership.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name: true,
                image: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!client) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Klien dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mengambil klien",
            },
            data: client,
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

const updateClient = async (req, res) => {
    
    const { id } = req.params;

    try {
        const dataClient = {
            name: req.body.name,
            updated_at: new Date(),
        };
        if (req.file) {

            dataClient.image = req.file.path;

            const client = await prisma.partnership.findUnique({
                where: {
                    id: Number(id),
                },
            });

            if (client.image) {
                fs.unlinkSync(client.image);
            }
        }

        const client = await prisma.partnership.update({
            where: {
                id: Number(id),
            },
            data: dataClient,
        });
        res.status(200).send({
            meta: {
                success: true,
                message: "Klien berhasil diperbarui",
            },
            data: client,
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
const deleteClient = async (req, res) => {
    const { id } = req.params;

    try {
        const client = await prisma.partnership.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!client) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Kategori dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        await prisma.partnership.delete({
            where: {
                id: Number(id),
            },
        });

        if (client.image) {
            const imagePath = client.image;
            const fileName = imagePath.substring(imagePath.lastIndexOf("/") + 1);
            const filePath = `uploads/${fileName}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(200).send({
            meta: {
                success: true,
                message: "Klien berhasil dihapus",
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
const allClients = async (req, res) => {
    try {
        
        const clients = await prisma.partnership.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                id: "desc",
            }
        });

        res.status(200).send({
            
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua klien",
            },
            data: clients
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
    findClients, createClient, findClientsById, updateClient, deleteClient, allClients
};