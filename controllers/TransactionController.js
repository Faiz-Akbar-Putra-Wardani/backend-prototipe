// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import function untuk menghasilkan invoice acak
const { generateUniqueInvoice } = require('../utils/generateUniqueInvoice');

const createTransaction = async (req, res) => {
    try {
        // Generate invoice
        const invoice = await generateUniqueInvoice();

        // Input dari frontend
        const cashierId = parseInt(req.userId);
        const customerUuid = req.body.customer_id; 
        const subtotal = parseFloat(req.body.subtotal) || 0;
        const subtotalPlusExtra = parseFloat(req.body.subtotalPlusExtra) || 0;
        const extra = parseFloat(req.body.extra) || 0;
        const dp = parseFloat(req.body.dp) || 0;
        const nego = parseFloat(req.body.nego) || 0;
        const pph = parseFloat(req.body.pph) || 0;
        const pphNominal = parseFloat(req.body.pph_nominal) || 0;
        const grandTotal = parseFloat(req.body.grand_total);
        const status = req.body.status;


        // Validasi wajib
        if (isNaN(cashierId) || isNaN(grandTotal)) {
            return res.status(400).json({
                meta: {
                    success: false,
                    message: "Input tidak valid. Periksa kembali data transaksi.",
                },
            });
        }

        let customerId = null;
        if (customerUuid) {
            console.log("🔍 Searching customer with UUID:", customerUuid);
            
            const customerExists = await prisma.customer.findUnique({
                where: { uuid: customerUuid }
            });

            console.log(" Customer found:", customerExists);

            if (!customerExists) {
                console.log("Customer NOT FOUND with UUID:", customerUuid);
                return res.status(404).json({
                    meta: {
                        success: false,
                        message: "Customer tidak ditemukan",
                    },
                });
            }

            customerId = customerExists.id; 
        } else {
            console.log(" No customer_id provided, will save as NULL");
        }


        // VALIDASI STATUS
        const validStatuses = ['proses', 'dikirim', 'selesai'];
        if (!validStatuses.includes(status)) {
            return res.status(422).json({
                meta: {
                    success: false,
                    message: "Status harus: proses, dikirim, atau selesai",
                },
            });
        }

        // VALIDASI PPH
        const maxPphNominal = subtotalPlusExtra;

        if (pphNominal > maxPphNominal) {
          return res.status(422).json({
            meta: {
              success: false,
              message: "PPH tidak boleh melebihi total biaya",
            },
          });
        }

        if (pph < 0 || pph > 100) {
          return res.status(422).json({
            meta: {
              success: false,
              message: "PPH harus berada di antara 0 - 100%",
            },
          });
        }

        // VALIDASI DP
        if (dp > grandTotal) {
          return res.status(422).json({
            meta: {
              success: false,
              message: "DP tidak boleh melebihi total bayar",
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

        //  VALIDASI NEGO
        const maxNego = subtotalPlusExtra - pphNominal;

        if (nego > maxNego) {
            return res.status(422).json({
              meta: {
                success: false,
                message: "Harga nego tidak boleh melebihi total sebelum nego",
              },
            });
        }

        if (nego < 0) {
            return res.status(422).json({
              meta: {
                success: false,
                message: "Harga nego tidak boleh kurang dari 0",
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
                subtotalPlusExtra,
                extra,
                dp,
                nego,
                pph,
                pph_nominal: pphNominal,
                grand_total: grandTotal,
                status,
            },
        });
        // 2. Ambil semua cart milik kasir
        const carts = await prisma.cart.findMany({
            where: { cashier_id: cashierId },
            include: { product: true },
        });

        // Jika cart kosong, hentikan
        if (carts.length === 0) {
            return res.status(400).json({
                meta: {
                    success: false,
                    message: "Keranjang kosong. Tidak bisa checkout.",
                },
            });
        }

        // 3. Loop item cart → simpan detail + profit
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

        // Simpan profit
        await prisma.profit.create({
            data: {
                transaction_id: transaction.id,
                total: grandTotal,
                source: "penjualan",
            },
        });

        // 4. Bersihkan cart kasir
        await prisma.cart.deleteMany({
            where: { cashier_id: cashierId },
        });

        // Response sukses
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

    console.log("Updating transaction with UUID:", uuid);

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

    // Input dari frontend (invoice tidak bisa diubah)
    const customerUuid = req.body.customer_id; 
    const subtotal = parseFloat(req.body.subtotal) || 0;
    const subtotalPlusExtra = parseFloat(req.body.subtotalPlusExtra) || 0;
    const extra = parseFloat(req.body.extra) || 0;
    const dp = parseFloat(req.body.dp) || 0;
    const nego = parseFloat(req.body.nego) || 0;
    const pph = parseFloat(req.body.pph) || 0;
    const pphNominal = parseFloat(req.body.pph_nominal) || 0;
    const grandTotal = parseFloat(req.body.grand_total);
    const status = req.body.status;

    // Validasi wajib
    if (isNaN(grandTotal)) {
      return res.status(400).json({
        meta: {
          success: false,
          message: "Input tidak valid. Periksa kembali data transaksi.",
        },
      });
    }

    let customerId = null;
    if (customerUuid) {
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

        customerId = customerExists.id; 
    }

    // VALIDASI STATUS
    const validStatuses = ['proses', 'dikirim', 'selesai'];
    if (!validStatuses.includes(status)) {
        return res.status(422).json({
            meta: {
                success: false,
                message: "Status harus: proses, dikirim, atau selesai",
            },
        });
    }

    // VALIDASI PPH
    const maxPphNominal = subtotalPlusExtra;

    if (pphNominal > maxPphNominal) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "PPH tidak boleh melebihi total biaya",
        },
      });
    }

    if (pph < 0 || pph > 100) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "PPH harus berada di antara 0 - 100%",
        },
      });
    }

    // VALIDASI DP
    if (dp > grandTotal) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "DP tidak boleh melebihi total bayar",
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

    // VALIDASI NEGO
    const maxNego = subtotalPlusExtra - pphNominal;

    if (nego > maxNego) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Harga nego tidak boleh melebihi total sebelum nego",
        },
      });
    }

    if (nego < 0) {
      return res.status(422).json({
        meta: {
          success: false,
          message: "Harga nego tidak boleh kurang dari 0",
        },
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { uuid },
      data: {
        customer_id: customerId, 
        subtotal,
        subtotalPlusExtra,
        extra,
        dp,
        nego,
        pph,
        pph_nominal: pphNominal,
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
        subtotalPlusExtra: true,
        extra: true,
        dp: true,
        nego: true,
        pph: true,
        pph_nominal: true,
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
                subtotalPlusExtra: true,
                extra: true,
                dp: true,
                nego: true,
                pph: true,
                pph_nominal: true,
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

const getTransactionByInvoice = async (req, res) => {
  try {
    const invoice = req.params.invoice;

    console.log("Fetching transaction by invoice:", invoice);

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
        subtotalPlusExtra: true,
        extra: true,
        dp: true,
        nego: true,
        pph: true,
        pph_nominal: true,
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
    const { status } = req.body;

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

    const trx = await prisma.transaction.update({
      where: { uuid },
      data: { status },
      select: {
        uuid: true,
        invoice: true,
        status: true,
        created_at: true, 
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

    // ✅ Cek apakah transaksi exists by UUID
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

    // ✅ Hapus transaksi utama by UUID
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
    deleteTransaction
};
