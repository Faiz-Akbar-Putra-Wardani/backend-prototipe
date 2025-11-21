// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

// Import generator invoice
const { generateUniqueRentalInvoice } = require("../utils/generateUniqueRentalInvoice");

// Create Rental
const createRental = async (req, res) => {
    try {
        const invoice = await generateUniqueRentalInvoice();

        const customerId = parseInt(req.body.customer_id);
        const dp = parseFloat(req.body.dp) || 0;
        const rentPrice = parseFloat(req.body.rent_price);
        const status = req.body.status ?? "ongoing";

        // VALIDASI TANGGAL
        if (!req.body.start_date || !req.body.end_date) {
            return res.status(400).json({
                meta: { success: false, message: "start_date dan end_date wajib diisi" }
            });
        }

        const startDate = new Date(req.body.start_date);
        const endDate = new Date(req.body.end_date);

        // VALIDASI WAJIB
        if (
            isNaN(customerId) ||
            isNaN(rentPrice)
        ) {
            return res.status(400).json({
                meta: { success: false, message: "customer_id, rent_price wajib diisi" }
            });
        }

        const details = req.body.details;
        if (!Array.isArray(details) || details.length === 0) {
            return res.status(400).json({
                meta: { success: false, message: "details minimal 1 produk" }
            });
        }

        // SIMPAN RENTAL UTAMA
        const rental = await prisma.rental.create({
            data: {
                customer_id: customerId,
                invoice,
                start_date: startDate,
                end_date: endDate,
                dp,
                rent_price: rentPrice,
                status,
            },
        });

        // SIMPAN RENTAL DETAIL
        for (const item of details) {

            await prisma.rentalDetail.create({
                data: {
                    rental_id: rental.id,
                    product_id: item.product_id,
                    qty: item.qty || 1,
                    rent_price: item.rent_price,
                    start_date: startDate,
                    end_date: endDate,
                },
            });

            const totalRent = item.rent_price * (item.qty || 1);

            await prisma.profit.create({
                data: {
                    rental_id: rental.id,
                    total: totalRent,
                    source: "rental",
                },
            });
        }

        return res.status(201).json({
            meta: { success: true, message: "Rental berhasil dibuat" },
            data: rental
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            meta: { success: false, message: "Terjadi kesalahan server" },
            errors: error.message,
        });
    }
};


// GET ALL RENTAL + PAGINATION + SEARCH
const getRentals = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 5;
        const search = req.query.search ?? "";

        const where = search
            ? {
                OR: [
                    { invoice: { contains: search, mode: "insensitive" } },
                    {
                        customer: {
                            name_perusahaan: { contains: search, mode: "insensitive" }
                        }
                    }
                ]
            }
            : {};

        const total = await prisma.rental.count({ where });

        const rentals = await prisma.rental.findMany({
            where,
            include: {
                customer: true,
                details: {
                    include: { product: true },
                },
            },
            skip: (page - 1) * perPage,
            take: perPage,
            orderBy: { id: "desc" },
        });

        res.status(200).json({
            meta: {
                success: true,
                message: "Data rental berhasil diambil",
                pagination: {
                    currentPage: page,
                    perPage,
                    total,
                    totalPages: Math.ceil(total / perPage),
                },
            },
            data: rentals,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            meta: { success: false, message: "Terjadi kesalahan server" },
            errors: error.message,
        });
    }
};


// GET RENTAL BY ID
const getRentalById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                meta: { success: false, message: "ID rental tidak valid" },
            });
        }

        const rental = await prisma.rental.findUnique({
            where: { id },
            include: {
                customer: true,
                details: {
                    include: { product: true },
                },
            },
        });

        if (!rental) {
            return res.status(404).json({
                meta: { success: false, message: "Rental tidak ditemukan" },
            });
        }

        res.status(200).json({
            meta: {
                success: true,
                message: "Detail rental berhasil diambil",
            },
            data: rental,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            meta: { success: false, message: "Terjadi kesalahan server" },
            errors: error.message,
        });
    }
};


// GET RENTAL BY INVOICE
const getRentalByInvoice = async (req, res) => {
    try {
        const invoice = req.params.invoice;

        const rental = await prisma.rental.findUnique({
            where: { invoice },
            include: {
                customer: true,
                details: { include: { product: true } },
            },
        });

        if (!rental) {
            return res.status(404).json({
                meta: { success: false, message: "Rental tidak ditemukan" },
            });
        }

        res.status(200).json({
            meta: { success: true, message: "Data rental berdasarkan invoice" },
            data: rental,
        });

    } catch (error) {
        res.status(500).json({
            meta: { success: false, message: "Terjadi kesalahan server" },
            errors: error.message,
        });
    }
};

const getNewInvoice = async (req, res) => {
  try {
    const invoice = await generateUniqueRentalInvoice();

    res.status(200).json({
      meta: { success: true, message: "Invoice baru berhasil dibuat" },
      data: { invoice }
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Gagal membuat invoice" },
      errors: error.message
    });
  }
};


// UPDATE RENTAL STATUS
const updateRentalStatus = async (req, res) => {
    try {
        const { invoice, status } = req.body;

        const updated = await prisma.rental.update({
            where: { invoice },
            data: { status },
        });

        res.status(200).json({
            meta: { success: true, message: "Status rental berhasil diperbarui" },
            data: updated,
        });

    } catch (error) {
        res.status(500).json({
            meta: { success: false, message: "Terjadi kesalahan server" },
            errors: error.message,
        });
    }
};


// DELETE RENTAL
const deleteRental = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Hapus detail & profit dulu
        await prisma.rentalDetail.deleteMany({ where: { rental_id: id } });
        await prisma.profit.deleteMany({ where: { rental_id: id } });

        await prisma.rental.delete({ where: { id } });

        res.status(200).json({
            meta: { success: true, message: "Rental berhasil dihapus" },
        });

    } catch (error) {
        res.status(500).json({
            meta: { success: false, message: "Gagal menghapus rental" },
            errors: error.message,
        });
    }
};


// EXPORT
module.exports = {
    createRental,
    getRentals,
    getRentalById,
    getRentalByInvoice,
    getNewInvoice,
    updateRentalStatus,
    deleteRental,
};
