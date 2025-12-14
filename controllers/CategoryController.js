const express = require("express");
const prisma = require("../prisma/client");
const fs = require("fs");

const findCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const search = req.query.search || "";

        const categories = await prisma.category.findMany({
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
                created_at: "desc",
            },
            skip,
            take: limit,
        });

        const totalCategories = await prisma.category.count({
            where: {
                name: {
                    contains: search,
                },
            },
        });

        res.status(200).send({
            meta: { success: true, message: "Berhasil mendapatkan semua kategori" },
            data: categories,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCategories / limit),
                perPage: limit,
                total: totalCategories,
            },
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const createCategory = async (req, res) => {
    try {
        const category = await prisma.category.create({
            data: {
                name: req.body.name,
                image: req.file ? req.file.path : null,
            },
        });

        res.status(201).send({
            meta: { success: true, message: "Kategori berhasil dibuat" },
            data: category,
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const findCategoryById = async (req, res) => {
    const { uuid } = req.params;

    try {
        const category = await prisma.category.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                name: true,
                image: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!category) {
            return res.status(404).send({
                meta: { success: false, message: `Kategori dengan UUID: ${uuid} tidak ditemukan` },
            });
        }

        res.status(200).send({
            meta: { success: true, message: "Berhasil mendapatkan kategori" },
            data: category,
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const updateCategory = async (req, res) => {
    const { uuid } = req.params;

    try {
        const dataCategory = {
            name: req.body.name,
            updated_at: new Date(),
        };

        // Jika upload gambar baru
        if (req.file) {
            const category = await prisma.category.findUnique({ where: { uuid } });

            if (category?.image && fs.existsSync(category.image)) {
                fs.unlinkSync(category.image);
            }

            dataCategory.image = req.file.path;
        }

        const category = await prisma.category.update({
            where: { uuid },
            data: dataCategory,
        });

        res.status(200).send({
            meta: { success: true, message: "Kategori berhasil diperbarui" },
            data: category,
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const deleteCategory = async (req, res) => {
    const { uuid } = req.params;

    try {
        const category = await prisma.category.findUnique({
            where: { uuid },
        });

        if (!category) {
            return res.status(404).send({
                meta: { success: false, message: `Kategori dengan UUID: ${uuid} tidak ditemukan` },
            });
        }

        // Delete category
        await prisma.category.delete({ where: { uuid } });

        // Hapus file image
        if (category.image && fs.existsSync(category.image)) {
            fs.unlinkSync(category.image);
        }

        res.status(200).send({
            meta: { success: true, message: "Kategori berhasil dihapus" },
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const allCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                uuid: true,
                name: true,
                image: true,
            },
            orderBy: { created_at: "desc" },
        });

        res.status(200).send({
            meta: { success: true, message: "Berhasil mendapatkan semua kategori" },
            data: categories,
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

module.exports = {
    findCategories,
    createCategory,
    findCategoryById,
    updateCategory,
    deleteCategory,
    allCategories,
};
