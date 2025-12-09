// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

// Import generator invoice
const { generateUniqueRentalInvoice } = require("../utils/generateUniqueRentalInvoice");

const { diffMonths } = require("../utils/date");

const createRental = async (req, res) => {
  try {
    const invoice = await generateUniqueRentalInvoice();

    const customerId = Number(req.body.customer_id);
    const dp = Number(req.body.dp || 0);
    const status = req.body.status ?? "berlangsung";

    // VALIDASI STATUS
    const validStatuses = ['berlangsung', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: berlangsung atau selesai",
        },
      });
    }

    for (const d of req.body.details) {
      const startDate = new Date(d.start_date);
      const endDate = new Date(d.end_date);

      // Validasi: end_date harus >= start_date
      if (endDate < startDate) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal selesai tidak boleh lebih awal dari tanggal mulai untuk produk ID ${d.product_id}`
          }
        });
      }

      const months = diffMonths(startDate, endDate);

      if (months <= 0) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal sewa tidak valid untuk produk ID ${d.product_id}`
          }
        });
      }
    }

    let totalRent = 0;

    const rental = await prisma.rental.create({
      data: {
        customer_id: customerId,
        invoice,
        dp,
        total_rent_price: 0,
        status,
      },
    });

    // Loop untuk insert detail + create profit
    for (const d of req.body.details) {
      const startDate = new Date(d.start_date);
      const endDate = new Date(d.end_date);
      const months = diffMonths(startDate, endDate);

      const qty = Number(d.qty);
      const pricePerMonth = Number(d.rent_price);

      const itemTotal = pricePerMonth * months * qty;
      totalRent += itemTotal;

      await prisma.rentalDetail.create({
        data: {
          rental_id: rental.id,
          product_id: d.product_id,
          qty,
          rent_price: pricePerMonth,
          start_date: startDate,
          end_date: endDate
        }
      });

      await prisma.profit.create({
        data: {
          rental_id: rental.id,
          total: itemTotal,
          source: "sewa"
        }
      });
    }

    // Validasi DP
    if (dp > totalRent) {
      await prisma.rentalDetail.deleteMany({ where: { rental_id: rental.id } });
      await prisma.profit.deleteMany({ where: { rental_id: rental.id } });
      await prisma.rental.delete({ where: { id: rental.id } });

      return res.status(422).json({ 
        meta: {
          success: false,
          message: "DP tidak boleh melebihi total sewa"
        }
      });
    }

    if (dp < 0) {
      await prisma.rentalDetail.deleteMany({ where: { rental_id: rental.id } });
      await prisma.profit.deleteMany({ where: { rental_id: rental.id } });
      await prisma.rental.delete({ where: { id: rental.id } });

      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh kurang dari 0",
        },
      });
    }

    // Update total final
    await prisma.rental.update({
      where: { id: rental.id },
      data: { total_rent_price: totalRent },
    });

    return res.status(201).json({
      meta: {
        success: true,
        message: "Rental berhasil dibuat"
      },
      data: {
        invoice,
        total_rent_price: totalRent,
      },
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ 
      meta: {
        success: false,
        message: "Server error"
      },
      errors: e.message
    });
  }
};

const updateRental = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validasi ID
    if (isNaN(id)) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "ID rental tidak valid",
        },
      });
    }

    // Cek apakah rental ada
    const existingRental = await prisma.rental.findUnique({
      where: { id },
    });

    if (!existingRental) {
      return res.status(404).json({
        meta: {
          success: false,
          message: "Rental tidak ditemukan",
        },
      });
    }

    const customerId = Number(req.body.customer_id);
    const dp = Number(req.body.dp || 0);
    const status = req.body.status ?? "berlangsung";

    // VALIDASI STATUS
    const validStatuses = ['berlangsung', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: berlangsung atau selesai",
        },
      });
    }

    // Validasi tanggal untuk setiap detail
    for (const d of req.body.details) {
      const startDate = new Date(d.start_date);
      const endDate = new Date(d.end_date);

      if (endDate < startDate) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal selesai tidak boleh lebih awal dari tanggal mulai untuk produk ID ${d.product_id}`
          }
        });
      }

      const months = diffMonths(startDate, endDate);

      if (months <= 0) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal sewa tidak valid untuk produk ID ${d.product_id}`
          }
        });
      }
    }

    let totalRent = 0;

    // Hapus detail & profit lama
    await prisma.rentalDetail.deleteMany({ where: { rental_id: id } });
    await prisma.profit.deleteMany({ where: { rental_id: id } });

    // Insert detail baru
    for (const d of req.body.details) {
      const startDate = new Date(d.start_date);
      const endDate = new Date(d.end_date);
      const months = diffMonths(startDate, endDate);

      const qty = Number(d.qty);
      const pricePerMonth = Number(d.rent_price);

      const itemTotal = pricePerMonth * months * qty;
      totalRent += itemTotal;

      await prisma.rentalDetail.create({
        data: {
          rental_id: id,
          product_id: d.product_id,
          qty,
          rent_price: pricePerMonth,
          start_date: startDate,
          end_date: endDate
        }
      });

      await prisma.profit.create({
        data: {
          rental_id: id,
          total: itemTotal,
          source: "sewa"
        }
      });
    }

    // Validasi DP
    if (dp > totalRent) {
      return res.status(422).json({ 
        meta: {
          success: false,
          message: "DP tidak boleh melebihi total sewa"
        }
      });
    }

    if (dp < 0) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh kurang dari 0",
        },
      });
    }

    // Update rental header (invoice tetap tidak berubah)
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: { 
        customer_id: customerId,
        dp,
        total_rent_price: totalRent,
        status
      },
    });

    return res.status(200).json({
      meta: {
        success: true,
        message: "Rental berhasil diperbarui"
      },
      data: {
        invoice: updatedRental.invoice,
        total_rent_price: totalRent,
      },
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ 
      meta: { success: false, message: "Server error" },
      errors: e.message 
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

    if (!invoice || !status) {
      return res.status(400).json({
        meta: { success: false, message: "Invoice dan status wajib diisi" },
      });
    }

    // VALIDASI STATUS
    const validStatuses = ['berlangsung', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: berlangsung atau selesai",
        },
      });
    }

    // Cek apakah transaksi ada
    const exist = await prisma.rental.findUnique({
      where: { invoice },
    });

    if (!exist) {
      return res.status(404).json({
        meta: { success: false, message: "Transaksi tidak ditemukan" },
      });
    }

    // Update status
    const trx = await prisma.rental.update({
      where: { invoice },
      data: { status },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Status transaksi berhasil diperbarui",
      },
      data: trx,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: error.message,
    });
  }
};

// DELETE RENTAL
const deleteRental = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
          return res.status(400).json({
            meta: { success: false, message: "ID tidak valid" },
          });
        }

        // Cek apakah rental exists
        const rental = await prisma.rental.findUnique({
          where: { id },
        });

        if (!rental) {
          return res.status(404).json({
            meta: { success: false, message: "Rental tidak ditemukan" },
          });
        }

        // Hapus detail & profit dulu
        await prisma.rentalDetail.deleteMany({ where: { rental_id: id } });
        await prisma.profit.deleteMany({ where: { rental_id: id } });

        await prisma.rental.delete({ where: { id } });

        res.status(200).json({
            meta: { success: true, message: "Rental berhasil dihapus" },
        });

    } catch (error) {
        console.error(error);
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
    updateRental,
    deleteRental,
};
