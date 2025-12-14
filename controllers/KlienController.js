const express = require("express");
const prisma = require("../prisma/client");
const fs = require("fs");

// Ambil semua clients (pagination + search)
const findClients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const clients = await prisma.partnership.findMany({
            where: {
                name: {
                    contains: search,
                },
            },
            select: {
                uuid: true,  
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
            meta: {
                success: true,
                message: "Berhasil mengambil semua klien",
            },
            data: clients,
            pagination: {
                currentPage: page,
                perPage: limit,
                total: totalClients,
                totalPages: totalPages
            }
        });

    } catch (error) {
        console.error("Error in findClients:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

// Buat client baru
const createClient = async (req, res) => {
    try {
        // Validasi file image
        if (!req.file) {
            return res.status(422).send({
                success: false,
                message: "Image is required",
                errors: [{ msg: "Image harus diupload", path: "image" }],
            });
        }

        const client = await prisma.partnership.create({
            data: {
                name: req.body.name,
                image: req.file.path,
            },
            select: {
                uuid: true,  
                name: true,
                image: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(201).send({
            meta: {
                success: true,
                message: "Klien berhasil dibuat",
            },
            data: client,
        });
    } catch (error) {
        console.error("Error in createClient:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

// Ambil client by UUID
const findClientsById = async (req, res) => {
    try {
        const { uuid } = req.params;  

        console.log("Fetching client with UUID:", uuid);

        const client = await prisma.partnership.findUnique({
            where: {
                uuid: uuid,  
            },
            select: {
                uuid: true,  
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
                    message: `Klien dengan UUID: ${uuid} tidak ditemukan`,
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
        console.error("Error in findClientsById:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

// Update client by UUID
const updateClient = async (req, res) => {
    const { uuid } = req.params;  

    try {
        console.log("Updating client with UUID:", uuid);

        // Cek apakah client ada
        const existingClient = await prisma.partnership.findUnique({
            where: {
                uuid: uuid,  
            },
        });

        if (!existingClient) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Klien dengan UUID: ${uuid} tidak ditemukan`,
                },
            });
        }

        const dataClient = {
            name: req.body.name,
        };

        // Handle image upload
        if (req.file) {
            dataClient.image = req.file.path;

            // Hapus gambar lama jika ada
            if (existingClient.image && fs.existsSync(existingClient.image)) {
                fs.unlinkSync(existingClient.image);
            }
        }

        const client = await prisma.partnership.update({
            where: {
                uuid: uuid,  
            },
            data: dataClient,
            select: {
                uuid: true, 
                name: true,
                image: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Klien berhasil diperbarui",
            },
            data: client,
        });
    } catch (error) {
        console.error("Error in updateClient:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

// Hapus client by UUID
const deleteClient = async (req, res) => {
    const { uuid } = req.params;  

    try {
        console.log("Deleting client with UUID:", uuid);

        const client = await prisma.partnership.findUnique({
            where: {
                uuid: uuid,  
            },
        });

        if (!client) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Klien dengan UUID: ${uuid} tidak ditemukan`,
                },
            });
        }

        await prisma.partnership.delete({
            where: {
                uuid: uuid,  
            },
        });

        // Hapus file gambar jika ada
        if (client.image && fs.existsSync(client.image)) {
            fs.unlinkSync(client.image);
        }

        res.status(200).send({
            meta: {
                success: true,
                message: "Klien berhasil dihapus",
            },
        });
    } catch (error) {
        console.error("Error in deleteClient:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: [{ msg: error.message, path: "general" }],
        });
    }
};

// Ambil semua clients (tanpa pagination)
const allClients = async (req, res) => {
    try {
        const clients = await prisma.partnership.findMany({
            select: {
                uuid: true,  
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
        console.error("Error in allClients:", error);
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
    findClients, 
    createClient, 
    findClientsById, 
    updateClient, 
    deleteClient, 
    allClients
};
