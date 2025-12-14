const express = require("express");
const prisma = require("../prisma/client");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const findAdmins = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const admins = await prisma.user.findMany({
            where: {
                name: { contains: search },
            },
            select: {
                uuid: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { id: "desc" },
            skip,
            take: limit,
        });

        const totalAdmins = await prisma.user.count({
            where: { name: { contains: search } },
        });

        res.status(200).send({
            data: admins,
            pagination: {
                currentPage: page,
                perPage: limit,
                total: totalAdmins,
                totalPage: Math.ceil(totalAdmins / limit),
            }
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" } });
    }
};

const createAdmin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({
            meta: { success: false, message: "Validasi gagal" },
            errors: errors.array(),
        });
    }

    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
            select: {
                uuid: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(201).send({
            meta: { success: true, message: "Admin berhasil dibuat" },
            data: admin,
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const findAdminById = async (req, res) => {
    try {
        const { uuid } = req.params;

        const admin = await prisma.user.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            }
        });

        if (!admin) {
            return res.status(404).send({
                meta: { success: false, message: `Admin dengan UUID: ${uuid} tidak ditemukan` },
            });
        }

        res.status(200).send({
            meta: { success: true, message: "Berhasil mengambil admin" },
            data: admin,
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const updateAdmin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({
            meta: { success: false, message: "Validasi gagal" },
            errors: errors.array(),
        });
    }

    const { uuid } = req.params;

    try {
        const { name, email, password, role } = req.body;

        const dataUpdate = {};
        if (name) dataUpdate.name = name;
        if (email) dataUpdate.email = email;
        if (role) dataUpdate.role = role;
        if (password) dataUpdate.password = await bcrypt.hash(password, 10);

        const admin = await prisma.user.update({
            where: { uuid },
            data: dataUpdate,
            select: {
                uuid: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            }
        });

        res.status(200).send({
            meta: { success: true, message: "Admin berhasil diperbarui" },
            data: admin,
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const deleteAdmin = async (req, res) => {
    const { uuid } = req.params;

    try {
        const admin = await prisma.user.findUnique({ where: { uuid } });

        if (!admin) {
            return res.status(404).send({
                meta: { success: false, message: `Admin dengan UUID: ${uuid} tidak ditemukan` },
            });
        }

        // Cegah hapus super admin terakhir
        if (admin.role === "super_admin") {
            const count = await prisma.user.count({ where: { role: "super_admin" } });
            if (count <= 1) {
                return res.status(400).send({
                    meta: { success: false, message: "Tidak dapat menghapus super admin terakhir" }
                });
            }
        }

        await prisma.user.delete({ where: { uuid } });

        res.status(200).send({
            meta: { success: true, message: "Admin berhasil dihapus" },
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const allAdmins = async (req, res) => {
    try {
        const admins = await prisma.user.findMany({
            select: {
                uuid: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { id: "desc" }
        });

        res.status(200).send({
            meta: { success: true, message: "Berhasil mendapatkan semua admin" },
            data: admins,
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

module.exports = {
    findAdmins,
    createAdmin,
    findAdminById,
    updateAdmin,
    deleteAdmin,
    allAdmins,
};
