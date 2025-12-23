// controllers/RepairController.js

const express = require("express");
const prisma = require("../prisma/client");
const fs = require("fs");
const { generateUniqueRepairInvoice } = require('../utils/generateUniqueRepair');

// Fungsi untuk membuat transaksi perbaikan
const createRepair = async (req, res) => {
  try {
    const invoice = await generateUniqueRepairInvoice();

    const cashierId = parseInt(req.userId);
    const customerUuid = req.body.customer_id;
    const itemRepair = req.body.item_repair;
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    const description = req.body.description;
    const component = req.body.component || null;
    const pic = req.body.pic;

    const dp = parseFloat(req.body.dp) || 0;
    const repairCost = parseFloat(req.body.repair_cost) || 0;   // biaya dasar
    const extra = parseFloat(req.body.extra) || 0;              // tambahan biaya
    const pph = parseFloat(req.body.pph) || 0;                  // persen PPH

    const status = req.body.status || 'masuk';

    // VALIDASI CUSTOMER
    const customerExists = await prisma.customer.findUnique({
      where: { uuid: customerUuid }
    });

    if (!customerExists) {
      return res.status(404).json({
        meta: { success: false, message: "Customer tidak ditemukan" },
      });
    }

    // VALIDASI TANGGAL
    if (endDate < startDate) {
      return res.status(422).json({
        meta: { success: false, message: "Tanggal selesai harus setelah tanggal mulai" },
      });
    }

    // HITUNG TOTAL (sama seperti composable)
    const subtotalPlusExtra = repairCost + extra;     // 1.900.000 + 50.000 = 1.950.000
    const pphNominal = subtotalPlusExtra * (pph / 100); // 1.950.000 * 2.5% = 48.750
    const grandTotal = subtotalPlusExtra - pphNominal;  // 1.901.250

    // VALIDASI DP
    if (dp >= grandTotal) {
      return res.status(422).json({
        meta: { success: false, message: "DP tidak boleh melebihi total biaya perbaikan" },
      });
    }

    if (dp < 0) {
      return res.status(422).json({
        meta: { success: false, message: "DP tidak boleh kurang dari 0" },
      });
    }

    // VALIDASI STATUS
    const validStatuses = ['masuk', 'dikerjakan', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: { success: false, message: "Status harus: masuk, dikerjakan, atau selesai" },
      });
    }

    // SIMPAN
    const repair = await prisma.repair.create({
      data: {
        cashier_id: cashierId,
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
        extra,
        pph,
        pph_nominal: pphNominal,
        grand_total: grandTotal,
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
        extra: true,
        pph: true,
        pph_nominal: true,
        grand_total: true,
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

    await prisma.repairTracking.create({
      data: {
        repair_id: repair.id,
        status,
        notes: `Perbaikan ${itemRepair} dibuat dengan status ${status}`,
        updated_by: cashierId,
      }
    });

    await prisma.profit.create({
      data: {
        repair_id: repair.id,
        total: grandTotal, 
        source: "perbaikan",
      },
    });

    const { id, ...repairResponse } = repair;

    res.status(201).json({
      meta: { success: true, message: "Transaksi perbaikan berhasil dibuat" },
      data: repairResponse,
    });

  } catch (error) {
    console.error("Error in createRepair:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan pada server" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};


const getRepairs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const search = req.query.search || "";

    const where = search
      ? {
          OR: [
            { invoice: { contains: search } },
            { item_repair: { contains: search } },
            {
              customer: {
                name_perusahaan: { contains: search }
              }
            }
          ]
        }
      : {};

    const total = await prisma.repair.count({ where });

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
        extra: true,
        pph: true,
        pph_nominal: true,
        grand_total: true,
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
         cashier: { 
          select: {
            uuid: true,
            name: true,
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
        extra: true,
        pph: true,
        pph_nominal: true,
        grand_total: true,
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
        cashier: { 
          select: {
            uuid: true,
            name: true,
            email: true,
          }
        },
        trackings: { 
          select: {
            status: true,
            notes: true,
            created_at: true,
            user: { 
              select: {
                uuid: true,
                name: true,
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        }
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
        extra: true,
        pph: true,
        pph_nominal: true,
        grand_total: true,
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
        cashier: { 
          select: {
            uuid: true,
            name: true,
            email: true,
          }
        },
        trackings: { 
          select: {
            status: true,
            notes: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'asc'
          }
        }
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

const getRepairTrackingByInvoice = async (req, res) => {
  try {
    const { invoice } = req.params;

    console.log("Fetching repair tracking for invoice:", invoice);

    if (!invoice) {
      return res.status(400).json({
        meta: { success: false, message: "Invoice wajib diisi" },
      });
    }

    const repair = await prisma.repair.findUnique({
      where: { invoice },
      select: {
        uuid: true,
        invoice: true,
        item_repair: true,
        repair_cost: true,
        extra: true,
        pph: true,
        pph_nominal: true,
        grand_total: true,
        status: true,
        start_date: true,
        end_date: true,
        description: true,
        pic: true,
        image: true,
        created_at: true,
        customer: {
          select: {
            name_perusahaan: true,
            no_telp: true,
            address: true,
          }
        },
        trackings: {
          select: {
            status: true,
            notes: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'asc'
          }
        }
      },
    });

    if (!repair) {
      return res.status(404).json({
        meta: { success: false, message: "Invoice tidak ditemukan" },
      });
    }

    res.status(200).json({
      meta: {
        success: true,
        message: "Tracking berhasil diambil",
      },
      data: {
        type: 'perbaikan',
        ...repair
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan pada server" },
      errors: error.message,
    });
  }
};

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

const updateRepair = async (req, res) => {
  try {
    const { uuid } = req.params;

    const existingRepair = await prisma.repair.findUnique({
      where: { uuid },
      select: {
        id: true,
        image: true,
      }
    });

    if (!existingRepair) {
      return res.status(404).json({
        meta: { success: false, message: "Data perbaikan tidak ditemukan" },
      });
    }

    const customerUuid = req.body.customer_id;
    const itemRepair = req.body.item_repair;
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    const description = req.body.description;
    const component = req.body.component || null;
    const pic = req.body.pic;

    const dp = parseFloat(req.body.dp) || 0;
    const repairCost = parseFloat(req.body.repair_cost) || 0;
    const extra = parseFloat(req.body.extra) || 0;
    const pph = parseFloat(req.body.pph) || 0;

    const status = req.body.status;

    if (!customerUuid || !itemRepair || !startDate || !endDate || !description || !pic || isNaN(repairCost) || !status) {
      return res.status(400).json({
        meta: { success: false, message: "Input tidak valid. Periksa kembali data perbaikan." },
      });
    }

    const customerExists = await prisma.customer.findUnique({
      where: { uuid: customerUuid }
    });

    if (!customerExists) {
      return res.status(404).json({
        meta: { success: false, message: "Customer tidak ditemukan" },
      });
    }

    if (endDate < startDate) {
      return res.status(422).json({
        meta: { success: false, message: "Tanggal selesai harus setelah tanggal mulai" },
      });
    }

    // HITUNG TOTAL
    const subtotalPlusExtra = repairCost + extra;
    const pphNominal = subtotalPlusExtra * (pph / 100);
    const grandTotal = subtotalPlusExtra - pphNominal;

    if (dp > grandTotal) {
      return res.status(422).json({
        meta: { success: false, message: "DP tidak boleh melebihi total biaya perbaikan" },
      });
    }

    if (dp < 0) {
      return res.status(422).json({
        meta: { success: false, message: "DP tidak boleh kurang dari 0" },
      });
    }

    const validStatuses = ['masuk', 'dikerjakan', 'selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: { success: false, message: "Status harus: masuk, dikerjakan, atau selesai" },
      });
    }

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
      extra,
      pph,
      pph_nominal: pphNominal,
      grand_total: grandTotal,
      status,
    };

    if (req.file) {
      dataRepair.image = req.file.path;

      if (existingRepair.image && fs.existsSync(existingRepair.image)) {
        fs.unlinkSync(existingRepair.image);
      }
    }

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
        extra: true,
        pph: true,
        pph_nominal: true,
        grand_total: true,
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

    await prisma.profit.updateMany({
      where: { repair_id: existingRepair.id },
      data: { total: grandTotal },
    });

    const { id, ...repairResponse } = updatedRepair;

    res.status(200).json({
      meta: { success: true, message: "Data perbaikan berhasil diperbarui" },
      data: repairResponse,
    });

  } catch (error) {
    console.error("Error in updateRepair:", error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan pada server" },
      errors: [{ msg: error.message, path: "general" }],
    });
  }
};


const updateRepairStatus = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { status, notes } = req.body;
    const cashierId = parseInt(req.userId);

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
    const validStatuses = ['masuk', 'dikerjakan', 'selesai'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: masuk, dikerjakan, atau selesai",
        },
      });
    }

    // Update status
    const updatedRepair = await prisma.repair.update({
      where: { uuid },
      data: { status },
      select: {
        id: true,
        uuid: true,
        status: true,
        invoice: true,
        updated_at: true,
      }
    });

    // Create tracking record
    await prisma.repairTracking.create({
      data: {
        repair_id: updatedRepair.id,
        status: status,
        notes: notes || `Status diubah menjadi ${status}`,
        updated_by: cashierId,
      }
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Status perbaikan berhasil diperbarui",
      },
      data: {
        uuid: updatedRepair.uuid,
        status: updatedRepair.status,
        invoice: updatedRepair.invoice,
        updated_at: updatedRepair.updated_at
      },
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

const deleteRepair = async (req, res) => {
  try {
    const { uuid } = req.params;

    console.log("Deleting repair with UUID:", uuid);

    const repair = await prisma.repair.findUnique({
      where: { uuid },
    });

    if (!repair) {
      return res.status(404).json({
        meta: { success: false, message: "Data perbaikan tidak ditemukan" },
      });
    }

    await prisma.repair.delete({
      where: { uuid },
    });

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
  deleteRepair,
  getRepairTrackingByInvoice, 
};
