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

    const customerUuid = req.body.customer_id;
    const dp = Number(req.body.dp || 0);
    const status = req.body.status ?? "berlangsung";

    // VALIDASI CUSTOMER EXISTS by UUID
    const customerExists = await prisma.customer.findUnique({
      where: { uuid: customerUuid }
    });

    if (!customerExists) {
      return res.status(404).json({
        meta: {
          success: false,
          message: "Customer tidak ditemukan",
        },
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

    for (const d of req.body.details) {
      const productExists = await prisma.product.findUnique({
        where: { uuid: d.product_id }
      });

      if (!productExists) {
        return res.status(404).json({
          meta: {
            success: false,
            message: `Produk dengan UUID ${d.product_id} tidak ditemukan`,
          },
        });
      }

      const startDate = new Date(d.start_date);
      const endDate = new Date(d.end_date);

      if (endDate < startDate) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal selesai tidak boleh lebih awal dari tanggal mulai untuk produk ${productExists.name}`
          }
        });
      }

      const months = diffMonths(startDate, endDate);

      if (months <= 0) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal sewa tidak valid untuk produk ${productExists.name}`
          }
        });
      }
    }

    let totalRent = 0;

    const rental = await prisma.rental.create({
      data: {
        customer_id: customerExists.id,
        invoice,
        dp,
        total_rent_price: 0,
        status,
      },
    });

    for (const d of req.body.details) {
      const productExists = await prisma.product.findUnique({
        where: { uuid: d.product_id }
      });

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
          product_id: productExists.id,  
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
    const { uuid } = req.params;

    console.log("Updating rental with UUID:", uuid);

    const existingRental = await prisma.rental.findUnique({
      where: { uuid },
    });

    if (!existingRental) {
      return res.status(404).json({
        meta: {
          success: false,
          message: "Rental tidak ditemukan",
        },
      });
    }

    const customerUuid = req.body.customer_id;
    const dp = Number(req.body.dp || 0);
    const status = req.body.status ?? "berlangsung";

    if (!customerUuid) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "Customer ID tidak boleh kosong",
        },
      });
    }

    // VALIDASI CUSTOMER EXISTS by UUID
    const customerExists = await prisma.customer.findUnique({
      where: { uuid: customerUuid }
    });

    if (!customerExists) {
      return res.status(404).json({
        meta: {
          success: false,
          message: "Customer tidak ditemukan",
        },
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

    //  Validasi dan convert product UUID ke ID
    for (const d of req.body.details) {
      if (!d.product_id) {
        return res.status(400).json({
          meta: {
            success: false,
            message: "Product ID tidak boleh kosong",
          },
        });
      }

      const productExists = await prisma.product.findUnique({
        where: { uuid: d.product_id }
      });

      if (!productExists) {
        return res.status(404).json({
          meta: {
            success: false,
            message: `Produk dengan UUID ${d.product_id} tidak ditemukan`,
          },
        });
      }

      const startDate = new Date(d.start_date);
      const endDate = new Date(d.end_date);

      if (endDate < startDate) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal selesai tidak boleh lebih awal dari tanggal mulai`
          }
        });
      }

      const months = diffMonths(startDate, endDate);

      if (months <= 0) {
        return res.status(422).json({
          meta: {
            success: false,
            message: `Tanggal sewa tidak valid`
          }
        });
      }
    }

    let totalRent = 0;

    // Hapus detail & profit lama
    await prisma.rentalDetail.deleteMany({ where: { rental_id: existingRental.id } });
    await prisma.profit.deleteMany({ where: { rental_id: existingRental.id } });

    // Insert detail baru dengan convert UUID ke ID
    for (const d of req.body.details) {
      // Convert product UUID ke ID
      const productExists = await prisma.product.findUnique({
        where: { uuid: d.product_id }
      });

      const startDate = new Date(d.start_date);
      const endDate = new Date(d.end_date);
      const months = diffMonths(startDate, endDate);

      const qty = Number(d.qty);
      const pricePerMonth = Number(d.rent_price);

      const itemTotal = pricePerMonth * months * qty;
      totalRent += itemTotal;

      await prisma.rentalDetail.create({
        data: {
          rental_id: existingRental.id,
          product_id: productExists.id,  
          qty,
          rent_price: pricePerMonth,
          start_date: startDate,
          end_date: endDate
        }
      });

      await prisma.profit.create({
        data: {
          rental_id: existingRental.id,
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

    // Update rental header
    const updatedRental = await prisma.rental.update({
      where: { uuid },
      data: { 
        customer_id: customerExists.id,  
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
      select: {
        uuid: true, 
        invoice: true,
        dp: true,
        total_rent_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        customer: {
          select: {
            uuid: true,
            name_perusahaan: true,
            no_telp: true,
            address: true,
          }
        },
        details: {
          select: {
            id: true,
            qty: true,
            rent_price: true,
            start_date: true,
            end_date: true,
            product: {
              select: {
                uuid: true,
                title: true,
                description: true,
              }
            },
          },
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

//  GET RENTAL BY UUID
const getRentalById = async (req, res) => {
  try {
    const { uuid } = req.params; 

    console.log("Fetching rental with UUID:", uuid);

    const rental = await prisma.rental.findUnique({
      where: { uuid },
      select: {
        uuid: true,
        invoice: true,
        dp: true,
        total_rent_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        customer: {
          select: {
            uuid: true,
            name_perusahaan: true,
            no_telp: true,
            address: true,
          }
        },
        details: {
          select: {
            id: true,
            qty: true,
            rent_price: true,
            start_date: true,
            end_date: true,
            product: {
              select: {
                uuid: true,
                title: true,
                description: true,
              }
            },
          },
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

    console.log("Fetching rental by invoice:", invoice); 

    const rental = await prisma.rental.findUnique({
      where: { invoice },
      select: {
        uuid: true,
        invoice: true,
        dp: true,
        total_rent_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        customer: {
          select: {
            uuid: true,
            name_perusahaan: true,
            no_telp: true,
            address: true,
          }
        },
        details: {
          select: {
            id: true,
            qty: true,
            rent_price: true,
            start_date: true,
            end_date: true,
            product: {
              select: {
                uuid: true,
                title: true,  
                description: true,
                image: true,  
              }
            },
          },
        },
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
    console.error("Error in getRentalByInvoice:", error);
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

//  UPDATE RENTAL STATUS ONLY (PATCH - Tanpa validasi penuh)
const updateRentalStatus = async (req, res) => {
  try {
    const { uuid } = req.params; 
    const { status } = req.body;

    console.log("Updating rental status with UUID:", uuid);
    console.log("New status:", status);

    if (!status) {
      return res.status(400).json({
        meta: { success: false, message: "Status wajib diisi" },
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

    // Cek apakah rental ada by UUID
    const exist = await prisma.rental.findUnique({
      where: { uuid },
    });

    if (!exist) {
      return res.status(404).json({
        meta: { success: false, message: "Rental tidak ditemukan" },
      });
    }

    const rental = await prisma.rental.update({
      where: { uuid },
      data: { status },
      select: {
        uuid: true,
        invoice: true,
        status: true,
        updated_at: true,
      }
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Status rental berhasil diperbarui",
      },
      data: rental,
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

const deleteRental = async (req, res) => {
  try {
    const { uuid } = req.params; 

    console.log("Deleting rental with UUID:", uuid);

    const rental = await prisma.rental.findUnique({
      where: { uuid },
    });

    if (!rental) {
      return res.status(404).json({
        meta: { success: false, message: "Rental tidak ditemukan" },
      });
    }

    // Hapus detail & profit dulu (pakai id internal)
    // await prisma.rentalDetail.deleteMany({ where: { rental_id: rental.id } });
    // await prisma.profit.deleteMany({ where: { rental_id: rental.id } });

    await prisma.rental.delete({ where: { uuid } });

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
