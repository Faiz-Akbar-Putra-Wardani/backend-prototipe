const express = require("express");
const prisma = require("../prisma/client");
const bcrypt = require("bcryptjs");
const { validationResult } = require('express-validator');

const findAdmins = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const admins = await prisma.user.findMany({
            where: {
                name: {
                    contains: search,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        const totalAdmins = await prisma.user.count({
            where: {
                name: {
                    contains: search,
                },
            },
        });
        const totalPages = Math.ceil(totalAdmins / limit);

        res.status(200).send({
            data: admins,
            pagination: {
                currentPage: page,
                perPage: limit,
                total: totalAdmins,
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

const createAdmin = async (req, res) => {
    // Cek hasil validasi
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({
            meta: {
                success: false,
                message: "Validasi gagal",
            },
            errors: errors.array()
        });
    }

    try {
        const { name, email, password, role } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
                role: role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(201).send({
            meta: {
                success: true,
                message: "Admin berhasil dibuat",
            },
            data: admin,
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

const findAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await prisma.user.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!admin) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Admin dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mengambil admin",
            },
            data: admin,
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

const updateAdmin = async (req, res) => {
    // Cek hasil validasi
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({
            meta: {
                success: false,
                message: "Validasi gagal",
            },
            errors: errors.array()
        });
    }

    const { id } = req.params;

    try {
        const { name, email, password, role } = req.body;

        const dataAdmin = {
            updated_at: new Date(),
        };

        if (name) dataAdmin.name = name;
        if (email) dataAdmin.email = email;
        if (role) dataAdmin.role = role;

        // Jika ada password baru, hash terlebih dahulu
        if (password) {
            dataAdmin.password = await bcrypt.hash(password, 10);
        }

        const admin = await prisma.user.update({
            where: {
                id: Number(id),
            },
            data: dataAdmin,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Admin berhasil diperbarui",
            },
            data: admin,
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

const deleteAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const admin = await prisma.user.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!admin) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Admin dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Cegah penghapusan super_admin terakhir
        if (admin.role === 'super_admin') {
            const superAdminCount = await prisma.user.count({
                where: { role: 'super_admin' }
            });

            if (superAdminCount <= 1) {
                return res.status(400).send({
                    meta: {
                        success: false,
                        message: "Tidak dapat menghapus super admin terakhir",
                    },
                });
            }
        }

        await prisma.user.delete({
            where: {
                id: Number(id),
            },
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Admin berhasil dihapus",
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

const allAdmins = async (req, res) => {
    try {
        const admins = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
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
                message: "Berhasil mendapatkan semua admin",
            },
            data: admins
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
    findAdmins, 
    createAdmin, 
    findAdminById, 
    updateAdmin, 
    deleteAdmin, 
    allAdmins
};
