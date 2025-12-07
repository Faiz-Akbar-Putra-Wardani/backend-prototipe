const prisma = require("../prisma/client");

const getCustomerRecap = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const type = req.query.type;
    const search = req.query.search;
    const all = req.query.all === 'true'; // Flag untuk ambil semua data

    let results = [];

    /** ================= SALE ================= **/
    if (!type || type === "penjualan") {
      const sales = await prisma.transaction.findMany({
        select: {
          invoice: true,
          grand_total: true,
          created_at: true,
          customer: { select: { name_perusahaan: true } },
        },
      });

      results.push(
        ...sales.map((s) => ({
          invoice: s.invoice,
          perusahaan: s.customer?.name_perusahaan ?? "-",
          total: s.grand_total,
          type: "penjualan",
          created_at: s.created_at,
        }))
      );
    }

    /** ================= RENTAL ================= **/
    if (!type || type === "sewa") {
      const rentals = await prisma.rental.findMany({
        select: {
          invoice: true,
          total_rent_price: true,
          created_at: true,
          customer: { select: { name_perusahaan: true } },
        },
      });

      results.push(
        ...rentals.map((r) => ({
          invoice: r.invoice,
          perusahaan: r.customer?.name_perusahaan ?? "-",
          total: r.total_rent_price,
          type: "sewa",
          created_at: r.created_at,
        }))
      );
    }

    /** ================= REPAIR ================= **/
    if (!type || type === "perbaikan") {
      const repairs = await prisma.repair.findMany({
        select: {
          invoice: true,
          repair_cost: true,
          created_at: true,
          customer: { select: { name_perusahaan: true } },
        },
      });

      results.push(
        ...repairs.map((r) => ({
          invoice: r.invoice,
          perusahaan: r.customer?.name_perusahaan ?? "-",
          total: r.repair_cost,
          type: "perbaikan",
          created_at: r.created_at,
        }))
      );
    }

    /** ================= SEARCH FILTER ================= **/
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (item) =>
          item.invoice?.toLowerCase().includes(searchLower) ||
          item.perusahaan?.toLowerCase().includes(searchLower)
      );
    }

    /** ================= SORT ================= **/
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = results.length;

    // ================= JIKA ALL = TRUE, KIRIM SEMUA DATA =================
    if (all) {
      return res.status(200).json({
        success: true,
        data: results, // Kirim semua data tanpa pagination
        meta: {
          pagination: {
            currentPage: 1,
            perPage: total,
            total,
            totalPages: 1,
          },
        },
      });
    }

    /** ================= PAGINATION (untuk halaman index) ================= **/
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    const data = results.slice(start, end);

    res.status(200).json({
      success: true,
      data,
      meta: {
        pagination: {
          currentPage: page,
          perPage: limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data rekap",
    });
  }
};

/* ================= DELETE RECAP ================= */
const deleteCustomerRecap = async (req, res) => {
  const { invoice, type } = req.params;

  try {
    if (type === "penjualan") {
      await prisma.transaction.delete({ where: { invoice } });
    } else if (type === "sewa") {
      await prisma.rental.delete({ where: { invoice } });
    } else if (type === "perbaikan") {
      await prisma.repair.delete({ where: { invoice } });
    } else {
      return res.status(400).json({ message: "Type tidak valid" });
    }

    res.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal menghapus data" });
  }
};

const getTransactionStats = async (req, res) => {
  try {
    // Count penjualan
    const salesCount = await prisma.transaction.count();
    
    // Count sewa
    const rentalsCount = await prisma.rental.count();
    
    // Count perbaikan
    const repairsCount = await prisma.repair.count();

    res.status(200).json({
      success: true,
      data: {
        penjualan: salesCount,
        sewa: rentalsCount,
        perbaikan: repairsCount,
        total: salesCount + rentalsCount + repairsCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik transaksi"
    });
  }
};

module.exports = { getCustomerRecap, deleteCustomerRecap, getTransactionStats };
