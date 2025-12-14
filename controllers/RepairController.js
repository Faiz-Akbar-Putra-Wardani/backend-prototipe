// Import express untuk membuat aplikasi web
const express = require("express");


// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");


// Import fs untuk mengelola file
const fs = require("fs");


// Import function untuk menghasilkan invoice unik repair
const { generateUniqueRepairInvoice } = require('../utils/generateUniqueRepair');


// Fungsi untuk membuat transaksi perbaikan
const createRepair = async (req, res) => {
  try {
    // Generate invoice repair
    const invoice = await generateUniqueRepairInvoice();


    // Input dari frontend
    const customerUuid = req.body.customer_id;  
    const itemRepair = req.body.item_repair;
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    const description = req.body.description;
    const component = req.body.component || null;
    const pic = req.body.pic;
    const dp = parseFloat(req.body.dp) || 0;
    const repairCost = parseFloat(req.body.repair_cost);
    const status = req.body.status;


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
    const validStatuses = ['masuk', 'proses', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: masuk, proses, atau selesai",
        },
      });
    }


    // 1. Simpan transaksi perbaikan menggunakan customer.id internal
    const repair = await prisma.repair.create({
      data: {
        customer_id: customerExists.id,  
        item_repair: itemRepair,
        invoice,
        start_date: startDate,
        end_date: endDate,
        description,
        component,
        image: req.file ? req.file.path : null,
        pic,
        dp,
        repair_cost: repairCost,
        status,
      },
      select: {
        id: true,
        uuid: true,
        customer_id: true,
        item_repair: true,
        invoice: true,
        start_date: true,
        end_date: true,
        description: true,
        component: true,
        image: true,
        pic: true,
        dp: true,
        repair_cost: true,
        status: true,
        created_at: true,
        updated_at: true,
        customer: {
          select: {
            uuid: true,
            name_perusahaan: true,
          }
        }
      }
    });


    // 2. Simpan profit untuk perbaikan
    await prisma.profit.create({
      data: {
        repair_id: repair.id,
        total: repairCost,
        source: "perbaikan",
      },
    });

    const { id, ...repairResponse } = repair;


    // Response sukses
    res.status(201).json({
      meta: {
        success: true,
        message: "Transaksi perbaikan berhasil dibuat",
      },
      data: repairResponse,
    });


  } catch (error) {
    console.error("Error in createRepair:", error);
    res.status(500).json({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: [{ msg: error.message, path: "general" }],
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
      select: {
        uuid: true,
        customer_id: true,
        item_repair: true,
        invoice: true,
        start_date: true,
        end_date: true,
        description: true,
        component: true,
        image: true,
        pic: true,
        dp: true,
        repair_cost: true,
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
    console.error("Error in getRepairs:", error);
    res.status(500).json({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};


// Fungsi untuk mengambil detail perbaikan berdasarkan UUID
const getRepairById = async (req, res) => {
  try {
    const { uuid } = req.params;


    console.log("Fetching repair with UUID:", uuid);


    const repair = await prisma.repair.findUnique({
      where: { uuid },
      select: {
        uuid: true,
        customer_id: true,
        item_repair: true,
        invoice: true,
        start_date: true,
        end_date: true,
        description: true,
        component: true,
        image: true,
        pic: true,
        dp: true,
        repair_cost: true,
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
    console.error("Error in getRepairById:", error);
    res.status(500).json({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: [{ msg: error.message, path: "general" }],
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
      select: {
        uuid: true,
        customer_id: true,
        item_repair: true,
        invoice: true,
        start_date: true,
        end_date: true,
        description: true,
        component: true,
        image: true,
        pic: true,
        dp: true,
        repair_cost: true,
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
    console.error("Error in getRepairByInvoice:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan pada server" },
      errors: [{ msg: error.message, path: "general" }],
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
    console.error("Error in getNewRepairInvoice:", error);
    res.status(500).json({
      meta: { success: false, message: "Gagal membuat invoice" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};


// Update repair by UUID
const updateRepair = async (req, res) => {
  try {
    const { uuid } = req.params;


    console.log("Updating repair with UUID:", uuid);


    // Cek apakah data perbaikan ada
    const existingRepair = await prisma.repair.findUnique({
      where: { uuid },
      select: {
        id: true,  
        uuid: true,
        image: true,
      }
    });


    if (!existingRepair) {
      return res.status(404).json({
        meta: { success: false, message: "Data perbaikan tidak ditemukan" },
      });
    }


    // Input dari frontend
    const customerUuid = req.body.customer_id; 
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
    if (!customerUuid || !itemRepair || !startDate || !endDate || !description || !pic || isNaN(repairCost) || !status) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "Input tidak valid. Periksa kembali data perbaikan.",
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
    const validStatuses = ['masuk', 'proses', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: 'masuk', 'proses', atau 'selesai'",
        },
      });
    }


    // Prepare data update
    const dataRepair = {
      customer_id: customerExists.id,  
      item_repair: itemRepair,
      start_date: startDate,
      end_date: endDate,
      description,
      component,
      pic,
      dp,
      repair_cost: repairCost,
      status,
    };


    // Handle image upload jika ada file baru
    if (req.file) {
      dataRepair.image = req.file.path;


      // Hapus gambar lama jika ada
      if (existingRepair.image && fs.existsSync(existingRepair.image)) {
        fs.unlinkSync(existingRepair.image);
      }
    }


    // Update data perbaikan (KECUALI INVOICE)
    const updatedRepair = await prisma.repair.update({
      where: { uuid },
      data: dataRepair,
      select: {
        id: true,
        uuid: true,
        customer_id: true,
        item_repair: true,
        invoice: true,
        start_date: true,
        end_date: true,
        description: true,
        component: true,
        image: true,
        pic: true,
        dp: true,
        repair_cost: true,
        status: true,
        created_at: true,
        updated_at: true,
        customer: {
          select: {
            uuid: true,
            name_perusahaan: true,
          }
        }
      }
    });


    // Update profit jika repair_cost berubah
    await prisma.profit.updateMany({
      where: { repair_id: existingRepair.id },
      data: { total: repairCost },
    });

      // Remove id dari response
    const { id, ...repairResponse } = updatedRepair;


    res.status(200).json({
      meta: {
        success: true,
        message: "Data perbaikan berhasil diperbarui",
      },
      data: repairResponse,
    });


  } catch (error) {
    console.error("Error in updateRepair:", error);
    res.status(500).json({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};


const updateRepairStatus = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { status } = req.body;


    console.log("Updating repair status with UUID:", uuid);
    console.log("New status:", status);


    // Cek apakah data perbaikan ada
    const existingRepair = await prisma.repair.findUnique({
      where: { uuid },
    });


    if (!existingRepair) {
      return res.status(404).json({
        meta: { success: false, message: "Data perbaikan tidak ditemukan" },
      });
    }


    // VALIDASI STATUS
    const validStatuses = ['masuk', 'proses', 'selesai'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: 'masuk', 'proses', atau 'selesai'",
        },
      });
    }


    // Update hanya status
    const updatedRepair = await prisma.repair.update({
      where: { uuid },
      data: { status },
      select: {
        uuid: true,
        status: true,
        invoice: true,
        updated_at: true,
      }
    });


    res.status(200).json({
      meta: {
        success: true,
        message: "Status perbaikan berhasil diperbarui",
      },
      data: updatedRepair,
    });


  } catch (error) {
    console.error("Error in updateRepairStatus:", error);
    res.status(500).json({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};


// Fungsi untuk menghapus data perbaikan by UUID
const deleteRepair = async (req, res) => {
  try {
    const { uuid } = req.params;


    console.log("Deleting repair with UUID:", uuid);


    // Ambil data repair untuk cek image dan id untuk profit
    const repair = await prisma.repair.findUnique({
      where: { uuid },
    });


    if (!repair) {
      return res.status(404).json({
        meta: { success: false, message: "Data perbaikan tidak ditemukan" },
      });
    }


    // Hapus profit terkait (masih pakai repair_id internal)
    // await prisma.profit.deleteMany({
    //   where: { repair_id: repair.id },
    // });


    // Hapus data perbaikan
    await prisma.repair.delete({
      where: { uuid },
    });


    // Hapus file image jika ada
    if (repair.image && fs.existsSync(repair.image)) {
      fs.unlinkSync(repair.image);
    }


    res.status(200).json({
      meta: {
        success: true,
        message: "Data perbaikan berhasil dihapus",
      },
    });
  } catch (error) {
    console.error("Error in deleteRepair:", error);
    res.status(500).json({
      meta: { success: false, message: "Gagal menghapus data perbaikan" },
      errors: [{ msg: error.message, path: "general" }],
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
  updateRepairStatus,
  deleteRepair
};