// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import function untuk menghasilkan invoice unik repair
const { generateUniqueRepairInvoice } = require('../utils/generateUniqueRepair');

// Fungsi untuk membuat transaksi perbaikan
const createRepair = async (req, res) => {
  try {
    // Generate invoice repair
    const invoice = await generateUniqueRepairInvoice();

    // Input dari frontend
    const customerId = parseInt(req.body.customer_id);
    const itemRepair = req.body.item_repair;
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    const description = req.body.description;
    const component = req.body.component || null;
    const pic = req.body.pic;
    const dp = parseFloat(req.body.dp) || 0;
    const repairCost = parseFloat(req.body.repair_cost);
    const status = req.body.status;


    // VALIDASI CUSTOMER EXISTS
    const customerExists = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customerExists) {
      return res.status(404).json({
        meta: {
          success: false,
          message: "Customer tidak ditemukan",
        },
      });
    }

    // VALIDASI TANGGAL
    if (endDate < startDate) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Tanggal selesai harus setelah tanggal mulai",
        },
      });
    }

    // VALIDASI DP
    if (dp > repairCost) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh melebihi total biaya perbaikan",
        },
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

    // VALIDASI STATUS
    const validStatuses = ['process', 'completed', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: process, completed, atau pending",
        },
      });
    }

    // 1. Simpan transaksi perbaikan
    const repair = await prisma.repair.create({
      data: {
        customer_id: customerId,
        item_repair: itemRepair,
        invoice,
        start_date: startDate,
        end_date: endDate,
        description,
        component,
        pic,
        dp,
        repair_cost: repairCost,
        status,
      },
    });

    // 2. Simpan profit untuk perbaikan
    await prisma.profit.create({
      data: {
        repair_id: repair.id,
        total: repairCost,
        source: "repair",
      },
    });

    // Response sukses
    res.status(201).json({
      meta: {
        success: true,
        message: "Transaksi perbaikan berhasil dibuat",
      },
      data: repair,
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

// Fungsi untuk mengambil semua data perbaikan dengan pagination dan search
const getRepairs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const search = req.query.search || "";

    const where = search
      ? {
          OR: [
            { invoice: { contains: search, mode: "insensitive" } },
            { item_repair: { contains: search, mode: "insensitive" } },
            {
              customer: {
                name_perusahaan: { contains: search, mode: "insensitive" }
              }
            }
          ]
        }
      : {};

    // Hitung total data
    const total = await prisma.repair.count({ where });

    // Ambil data perbaikan dengan pagination + relasi
    const repairs = await prisma.repair.findMany({
      where,
      include: {
        customer: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { id: "desc" },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Data perbaikan berhasil diambil",
        pagination: {
          currentPage: page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      },
      data: repairs,
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

// Fungsi untuk mengambil detail perbaikan berdasarkan ID
const getRepairById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "ID perbaikan tidak valid",
        },
      });
    }

    const repair = await prisma.repair.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!repair) {
      return res.status(404).json({
        meta: {
          success: false,
          message: "Data perbaikan tidak ditemukan",
        },
      });
    }

    res.status(200).json({
      meta: {
        success: true,
        message: "Detail perbaikan berhasil diambil",
      },
      data: repair,
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

// Fungsi untuk mengambil detail perbaikan berdasarkan invoice
const getRepairByInvoice = async (req, res) => {
  try {
    const invoice = req.params.invoice;

    if (!invoice) {
      return res.status(400).json({
        meta: { success: false, message: "Invoice wajib diisi" },
      });
    }

    const repair = await prisma.repair.findUnique({
      where: { invoice },
      include: {
        customer: true,
      },
    });

    if (!repair) {
      return res.status(404).json({
        meta: { success: false, message: "Data perbaikan tidak ditemukan" },
      });
    }

    res.status(200).json({
      meta: {
        success: true,
        message: "Data perbaikan berdasarkan invoice berhasil diambil",
      },
      data: repair,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan pada server" },
      errors: error.message,
    });
  }
};

// Fungsi untuk generate invoice baru
const getNewRepairInvoice = async (req, res) => {
  try {
    const invoice = await generateUniqueRepairInvoice();

    res.status(200).json({
      meta: { success: true, message: "Invoice perbaikan baru berhasil dibuat" },
      data: { invoice }
    });
  } catch (error) {
    res.status(500).json({
      meta: { success: false, message: "Gagal membuat invoice" },
      errors: error.message
    });
  }
};
const updateRepair = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validasi ID
    if (isNaN(id)) {
      return res.status(400).json({
        meta: { success: false, message: "ID perbaikan tidak valid" },
      });
    }

    // Cek apakah data perbaikan ada
    const existingRepair = await prisma.repair.findUnique({
      where: { id },
    });

    if (!existingRepair) {
      return res.status(404).json({
        meta: { success: false, message: "Data perbaikan tidak ditemukan" },
      });
    }

    // Input dari frontend
    const customerId = parseInt(req.body.customer_id);
    const itemRepair = req.body.item_repair;
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    const description = req.body.description;
    const component = req.body.component || null;
    const pic = req.body.pic;
    const dp = parseFloat(req.body.dp) || 0;
    const repairCost = parseFloat(req.body.repair_cost);
    const status = req.body.status;

    // Validasi wajib
    if (isNaN(customerId) || !itemRepair || !startDate || !endDate || !description || !pic || isNaN(repairCost) || !status) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "Input tidak valid. Periksa kembali data perbaikan.",
        },
      });
    }

    // VALIDASI TANGGAL
    if (endDate < startDate) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Tanggal selesai harus setelah tanggal mulai",
        },
      });
    }

    // VALIDASI DP
    if (dp > repairCost) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh melebihi total biaya perbaikan",
        },
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

    // VALIDASI STATUS
    const validStatuses = ['process', 'completed', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: process, completed, atau pending",
        },
      });
    }

    // Update data perbaikan (KECUALI INVOICE)
    const updatedRepair = await prisma.repair.update({
      where: { id },
      data: {
        customer_id: customerId,
        item_repair: itemRepair,
        start_date: startDate,
        end_date: endDate,
        description,
        component,
        pic,
        dp,
        repair_cost: repairCost,
        status,
      },
    });

    // Update profit jika repair_cost berubah
    await prisma.profit.updateMany({
      where: { repair_id: id },
      data: { total: repairCost },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Data perbaikan berhasil diperbarui",
      },
      data: updatedRepair,
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

// Fungsi untuk menghapus data perbaikan
const deleteRepair = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        meta: { success: false, message: "ID tidak valid" },
      });
    }

    // Hapus profit terkait
    await prisma.profit.deleteMany({
      where: { repair_id: id },
    });

    // Hapus data perbaikan
    await prisma.repair.delete({
      where: { id },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Data perbaikan berhasil dihapus",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      meta: { success: false, message: "Gagal menghapus data perbaikan" },
      errors: error.message,
    });
  }
};

// Export fungsi
module.exports = {
  createRepair,
  getRepairs,
  getRepairById,
  getRepairByInvoice,
  getNewRepairInvoice,
  updateRepair,  
  deleteRepair
};
