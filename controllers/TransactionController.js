// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import function untuk menghasilkan invoice acak
const { generateUniqueInvoice } = require('../utils/generateUniqueInvoice');

const createTransaction = async (req, res) => {
  try {
    const invoice = await generateUniqueInvoice();

    // Input dari frontend
    const cashierId = parseInt(req.userId);
    const customerUuid = req.body.customer_id;

    const subtotal = parseFloat(req.body.subtotal) || 0;
    const ppn = parseFloat(req.body.ppn) || 0;          // persen PPN
    const nego = parseFloat(req.body.nego) || 0;
    const dp = parseFloat(req.body.dp) || 0;
    const status = req.body.status || "proses";

    if (isNaN(cashierId) || isNaN(subtotal)) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "Input tidak valid. Periksa kembali data transaksi.",
        },
      });
    }

    // VALIDASI CUSTOMER (optional)
    let customerId = null;
    if (customerUuid) {
      const customerExists = await prisma.customer.findUnique({
        where: { uuid: customerUuid },
      });

      if (!customerExists) {
        return res.status(404).json({
          meta: {
            success: false,
            message: "Customer tidak ditemukan",
          },
        });
      }

      customerId = customerExists.id;
    }

    // VALIDASI STATUS
    const validStatuses = ["proses", "dikirim", "selesai"];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: proses, dikirim, atau selesai",
        },
      });
    }

    // HITUNG PPN & TOTAL
    const ppnNominal = subtotal * (ppn / 100);
    const totalBeforeNego = subtotal + ppnNominal;
    const grandTotal = Math.max(0, totalBeforeNego - nego);

    // VALIDASI PPN
    if (ppn < 0 || ppn > 100) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "PPN harus berada di antara 0 - 100%",
        },
      });
    }

    // VALIDASI NEGO
    if (nego < 0) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Harga nego tidak boleh kurang dari 0",
        },
      });
    }

    if (nego >= totalBeforeNego) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Harga nego tidak boleh melebihi total sebelum nego",
        },
      });
    }

    // VALIDASI DP
    if (dp < 0) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh kurang dari 0",
        },
      });
    }

    if (dp >= grandTotal) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh melebihi total bayar",
        },
      });
    }

    // 1. Simpan transaksi utama
    const transaction = await prisma.transaction.create({
      data: {
        cashier_id: cashierId,
        customer_id: customerId,
        invoice,
        subtotal,
        dp,
        nego,
        ppn,
        ppn_nominal: ppnNominal,
        grand_total: grandTotal,
        status,
      },
    });

    // 2. Tracking awal
    await prisma.transactionTracking.create({
      data: {
        transaction_id: transaction.id,
        status,
        notes: `Transaksi penjualan dibuat dengan status ${status}`,
        updated_by: cashierId,
      },
    });

    // 3. Ambil cart kasir
    const carts = await prisma.cart.findMany({
      where: { cashier_id: cashierId },
      include: { product: true },
    });

    if (carts.length === 0) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "Keranjang kosong. Tidak bisa checkout.",
        },
      });
    }

    // 4. Simpan detail transaksi
    for (const cart of carts) {
      await prisma.transactionDetail.create({
        data: {
          transaction_id: transaction.id,
          product_id: cart.product_id,
          qty: cart.qty,
          price: parseFloat(cart.price),
        },
      });
    }

    // 5. Simpan profit
    await prisma.profit.create({
      data: {
        transaction_id: transaction.id,
        total: grandTotal,
        source: "penjualan",
      },
    });

    // 6. Bersihkan cart kasir
    await prisma.cart.deleteMany({
      where: { cashier_id: cashierId },
    });

    res.status(201).json({
      meta: {
        success: true,
        message: "Transaksi berhasil dibuat",
      },
      data: transaction,
    });
  } catch (error) {
    console.error("ERROR creating transaction:", error);
    res.status(500).json({
      meta: {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      errors: error.message,
    });
  }
};


const updateTransaction = async (req, res) => {
  try {
    const { uuid } = req.params;

    const existingTransaction = await prisma.transaction.findUnique({
      where: { uuid },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        meta: {
          success: false,
          message: "Transaksi tidak ditemukan",
        },
      });
    }

    const customerUuid = req.body.customer_id;
    const subtotal = parseFloat(req.body.subtotal) || 0;
    const ppn = parseFloat(req.body.ppn) || 0;
    const nego = parseFloat(req.body.nego) || 0;
    const dp = parseFloat(req.body.dp) || 0;
    const status = req.body.status;

    if (isNaN(subtotal)) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "Input tidak valid. Periksa kembali data transaksi.",
        },
      });
    }

    // CUSTOMER
    let customerId = null;
    if (customerUuid) {
      const customerExists = await prisma.customer.findUnique({
        where: { uuid: customerUuid },
      });

      if (!customerExists) {
        return res.status(404).json({
          meta: {
            success: false,
            message: "Customer tidak ditemukan",
          },
        });
      }

      customerId = customerExists.id;
    }

    // STATUS
    const validStatuses = ["proses", "dikirim", "selesai"];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Status harus: proses, dikirim, atau selesai",
        },
      });
    }

    // HITUNG PPN & TOTAL
    const ppnNominal = subtotal * (ppn / 100);
    const totalBeforeNego = subtotal + ppnNominal;
    const grandTotal = Math.max(0, totalBeforeNego - nego);

    // VALIDASI PPN
    if (ppn < 0 || ppn > 100) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "PPN harus berada di antara 0 - 100%",
        },
      });
    }

    // VALIDASI NEGO
    if (nego < 0) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Harga nego tidak boleh kurang dari 0",
        },
      });
    }

    if (nego >= totalBeforeNego) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Harga nego tidak boleh melebihi total sebelum nego",
        },
      });
    }

    // VALIDASI DP
    if (dp < 0) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh kurang dari 0",
        },
      });
    }

    if (dp >= grandTotal) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh melebihi total bayar",
        },
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { uuid },
      data: {
        customer_id: customerId,
        subtotal,
        dp,
        nego,
        ppn,
        ppn_nominal: ppnNominal,
        grand_total: grandTotal,
        status,
      },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Transaksi berhasil diperbarui",
      },
      data: updatedTransaction,
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


const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const search = req.query.search || "";

    const where = search
      ? {
          OR: [
            { invoice: { contains: search } },
            {
              customer: {
                name_perusahaan: { contains: search }
              }
            }
          ]
        }
      : {};

    const total = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        uuid: true,
        invoice: true,
        subtotal: true,
        dp: true,
        nego: true,
        ppn: true,
        ppn_nominal: true,
        grand_total: true,
        status: true,
        created_at: true, 
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
            id: true,
            name: true,
            email: true,
          }
        },
        transaction_details: {
          select: {
            id: true,
            qty: true,
            price: true,
            created_at: true,   
            updated_at: true,   
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
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { id: "desc" },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Data transaksi berhasil diambil",
        pagination: {
          currentPage: page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      },
      data: transactions,
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

const getTransactionById = async (req, res) => {
    try {
        const { uuid } = req.params;

        console.log("Fetching transaction with UUID:", uuid);

        const transaction = await prisma.transaction.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                invoice: true,
                subtotal: true,
                dp: true,
                nego: true,
                ppn: true,
                ppn_nominal: true,
                grand_total: true,
                status: true,
                created_at: true, 
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
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                transaction_details: {
                    select: {
                        id: true,
                        qty: true,
                        price: true,
                        created_at: true,   
                        updated_at: true,   
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

        if (!transaction) {
            return res.status(404).json({
                meta: {
                    success: false,
                    message: "Transaksi tidak ditemukan",
                },
            });
        }

        res.status(200).json({
            meta: {
                success: true,
                message: "Detail transaksi berhasil diambil",
            },
            data: transaction,
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

// NEW: Get tracking by invoice (Public)
const getTrackingByInvoice = async (req, res) => {
  try {
    const { invoice } = req.params;

    console.log("Fetching tracking for invoice:", invoice);

    if (!invoice) {
      return res.status(400).json({
        meta: { success: false, message: "Invoice wajib diisi" },
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { invoice },
      select: {
        uuid: true,
        invoice: true,
        grand_total: true,
        status: true,
        created_at: true,
        customer: {
          select: {
            name_perusahaan: true,
            no_telp: true,
            address: true,
          }
        },
        transaction_details: {
          select: {
            qty: true,
            price: true,
            product: {
              select: {
                title: true,
                image: true,
              }
            }
          }
        },
        trackings: {
          select: {
            status: true,
            notes: true,
            created_at: true,
            user: {
              select: {
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

    if (!transaction) {
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
        type: 'penjualan',
        ...transaction
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


// Update existing getTransactionByInvoice to include trackings
const getTransactionByInvoice = async (req, res) => {
  try {
    const invoice = req.params.invoice;

    if (!invoice) {
      return res.status(400).json({
        meta: { success: false, message: "Invoice wajib diisi" },
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { invoice },
      select: {
        uuid: true,
        invoice: true,
        subtotal: true,
        dp: true,
        nego: true,
        ppn: true,
        ppn_nominal: true,
        grand_total: true,
        status: true,
        created_at: true, 
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
            id: true,
            name: true,
            email: true,
          }
        },
        transaction_details: {
          select: {
            id: true,
            qty: true,
            price: true,
            created_at: true,   
            updated_at: true,   
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
        trackings: { // NEW
          select: {
            status: true,
            notes: true,
            created_at: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        }
      },
    });

    if (!transaction) {
      return res.status(404).json({
        meta: { success: false, message: "Transaksi tidak ditemukan" },
      });
    }

    res.status(200).json({
      meta: {
        success: true,
        message: "Transaksi berdasarkan invoice berhasil diambil",
      },
      data: transaction,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      meta: { success: false, message: "Terjadi kesalahan pada server" },
      errors: error.message,
    });
  }
};

// GET NEW INVOICE
const getNewInvoice = async (req, res) => {
  try {
    const invoice = await generateUniqueInvoice();

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

const updateStatus = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { status, notes } = req.body;
    const userId = parseInt(req.userId);

    console.log("Updating transaction status with UUID:", uuid);
    console.log("New status:", status);

    if (!status) {
      return res.status(400).json({
        meta: { success: false, message: "Status wajib diisi" },
      });
    }

    const validStatuses = ['proses', 'dikirim', 'selesai'];
    if (!validStatuses.includes(status)) {
        return res.status(422).json({
            meta: {
                success: false,
                message: "Status harus: proses, dikirim, atau selesai",
            },
        });
    }

    const exist = await prisma.transaction.findUnique({
      where: { uuid },
    });

    if (!exist) {
      return res.status(404).json({
        meta: { success: false, message: "Transaksi tidak ditemukan" },
      });
    }

    // Update transaction status
    const trx = await prisma.transaction.update({
      where: { uuid },
      data: { status },
      select: {
        id: true,
        uuid: true,
        invoice: true,
        status: true,
        created_at: true, 
      }
    });

    // Create tracking record
    await prisma.transactionTracking.create({
        data: {
            transaction_id: trx.id,
            status: status,
            notes: notes || `Status diubah menjadi ${status}`,
            updated_by: userId,
        }
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

const deleteTransaction = async (req, res) => {
  try {
    const { uuid } = req.params; 

    console.log("Deleting transaction with UUID:", uuid);

    const transaction = await prisma.transaction.findUnique({
      where: { uuid },
    });

    if (!transaction) {
      return res.status(404).json({
        meta: { success: false, message: "Transaksi tidak ditemukan" },
      });
    }

    // Hapus detail transaksi (gunakan id internal)
    await prisma.transactionDetail.deleteMany({
      where: { transaction_id: transaction.id },
    });

    // Hapus profit
    await prisma.profit.deleteMany({
      where: { transaction_id: transaction.id },
    });

    await prisma.transaction.delete({
      where: { uuid },
    });

    res.status(200).json({
      meta: {
        success: true,
        message: "Transaksi berhasil dihapus",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      meta: { success: false, message: "Gagal menghapus transaksi" },
      errors: error.message,
    });
  }
};

// Export fungsi
module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    getTransactionByInvoice,
    getNewInvoice,
    updateStatus,
    updateTransaction,
    deleteTransaction,
    getTrackingByInvoice,
};
