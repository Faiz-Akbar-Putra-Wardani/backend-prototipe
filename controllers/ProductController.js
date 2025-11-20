const express = require("express");
const prisma = require("../prisma/client");
const fs = require("fs");

// Ambil semua produk (dengan pagination & pencarian)
const findProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const products = await prisma.product.findMany({
            where: {
                title: { contains: search },
            },
            select: {
                id: true,
                title: true,
                description: true,
                sell_price: true,
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

        const totalProducts = await prisma.product.count({
            where: { title: { contains: search } },
        });

        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).send({
            meta: { success: true, message: "Berhasil mengambil semua produk" },
            data: products,
            pagination: {
                currentPage: page,
                totalPages,
                perPage: limit,
                total: totalProducts,
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
        const product = await prisma.product.create({
            data: {
                title: req.body.title,
                description: req.body.description || null,
                sell_price: parseFloat(req.body.sell_price),
                stock: parseInt(req.body.stock),
                image: req.file ? req.file.path : null,
                category_id: parseInt(req.body.category_id),
            },
            include: { category: true },
        });

        res.status(201).send({
            meta: { success: true, message: "Produk berhasil dibuat" },
            data: product,
        });
    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: error.message,
        });
    }
};

// Ambil produk berdasarkan ID
const findProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                title: true,
                description: true,
                sell_price: true,
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
                meta: { success: false, message: `Produk dengan ID ${id} tidak ditemukan` },
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

// Update produk
const updateProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const dataProduct = {
            title: req.body.title,
            description: req.body.description || null,
            sell_price: parseFloat(req.body.sell_price),
            stock: parseInt(req.body.stock),
            category_id: parseInt(req.body.category_id),
        };

        if (req.file) {
            dataProduct.image = req.file.path;

            const existing = await prisma.product.findUnique({ where: { id: Number(id) } });
            if (existing && existing.image && fs.existsSync(existing.image)) {
                fs.unlinkSync(existing.image);
            }
        }
        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: dataProduct,
            include: { category: true },
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

// Hapus produk
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({ where: { id: Number(id) } });
        if (!product) {
            return res.status(404).send({
                meta: { success: false, message: `Produk dengan ID ${id} tidak ditemukan` },
            });
        }

        await prisma.product.delete({ where: { id: Number(id) } });

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

// Ambil produk berdasarkan kategori
const findProductByCategoryId = async (req, res) => {
    const { id } = req.params;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const products = await prisma.product.findMany({
            where: { category_id: Number(id) },
            select: {
                id: true,
                title: true,
                description: true,
                sell_price: true,
                stock: true,
                image: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { id: "desc" },
            skip,
            take: limit,
        });

        const total = await prisma.product.count({
            where: { category_id: Number(id) },
        });

        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mengambil produk dengan kategori ID ${id}`,
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
        res.status(500).send({
            meta: { success: false, message: "Kesalahan internal server" },
            errors: error.message,
        });
    }
};

// Ambil semua produk (tanpa pagination) — digunakan untuk dropdown di frontend
const allProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        sell_price: true,
        stock: true,
        image: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { id: "desc" },
    });

    res.status(200).send({
      meta: { success: true, message: "Berhasil mengambil semua produk (tanpa pagination)" },
      data: products,
    });
  } catch (error) {
    res.status(500).send({
      meta: { success: false, message: "Kesalahan internal server" },
      errors: error.message,
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
    allProducts
};
