const prisma = require("../prisma/client");

// Get total revenue dari semua sumber
const getTotalRevenue = async (req, res) => {
  try {
    // Aggregate profit berdasarkan source
    const profitBySource = await prisma.profit.groupBy({
      by: ['source'],
      _sum: {
        total: true,
      },
    });

    // Transform ke format yang mudah digunakan
    const revenue = {
      penjualan: 0,
      sewa: 0,
      perbaikan: 0,
      total: 0,
    };

    profitBySource.forEach((item) => {
      const total = item._sum.total || 0;
      
      if (item.source === 'penjualan') {
        revenue.penjualan = total;
      } else if (item.source === 'sewa') {
        revenue.sewa = total;
      } else if (item.source === 'perbaikan') {
        revenue.perbaikan = total;
      }
      
      revenue.total += total;
    });

    res.status(200).json({
      success: true,
      message: "Total revenue berhasil diambil",
      data: revenue,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data revenue",
      errors: error.message,
    });
  }
};

// Get revenue dengan filter periode
const getRevenueByPeriod = async (req, res) => {
  try {
    const { startDate, endDate, source } = req.query;

    const where = {};
    
    // Filter berdasarkan source jika ada
    if (source && ['penjualan', 'sewa', 'perbaikan'].includes(source)) {
      where.source = source;
    }

    // Filter berdasarkan tanggal jika ada
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    // Get data profit dengan filter
    const profits = await prisma.profit.findMany({
      where,
      include: {
        transaction: {
          select: {
            invoice: true,
            created_at: true,
          }
        },
        rental: {
          select: {
            invoice: true,
            created_at: true,
          }
        },
        repair: {
          select: {
            invoice: true,
            created_at: true,
          }
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Hitung total
    const totalRevenue = profits.reduce((sum, profit) => sum + profit.total, 0);

    res.status(200).json({
      success: true,
      message: "Data revenue berhasil diambil",
      data: {
        profits,
        summary: {
          totalRevenue,
          count: profits.length,
        },
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data revenue",
      errors: error.message,
    });
  }
};

// Get revenue statistics (untuk dashboard)
const getRevenueStats = async (req, res) => {
  try {
    // Total revenue keseluruhan
    const totalAggregate = await prisma.profit.aggregate({
      _sum: {
        total: true,
      },
    });

    // Revenue per source
    const revenueBySource = await prisma.profit.groupBy({
      by: ['source'],
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // Format data
    const stats = {
      totalRevenue: totalAggregate._sum.total || 0,
      bySource: {},
    };

    revenueBySource.forEach((item) => {
      stats.bySource[item.source] = {
        total: item._sum.total || 0,
        count: item._count.id,
      };
    });

    res.status(200).json({
      success: true,
      message: "Statistik revenue berhasil diambil",
      data: stats,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik revenue",
      errors: error.message,
    });
  }
};

// profitController.js

// Get monthly revenue statistics
const getMonthlyRevenue = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    // Query untuk mendapatkan revenue per bulan
    const monthlyData = await prisma.$queryRaw`
      SELECT 
        MONTH(created_at) as month,
        SUM(total) as total_revenue,
        COUNT(*) as transaction_count
      FROM profits
      WHERE YEAR(created_at) = ${parseInt(year)}
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `;

    // Inisialisasi array untuk 12 bulan
    const monthlyRevenue = Array(12).fill(0);
    const monthlyCount = Array(12).fill(0);

    // Isi data dari query
    monthlyData.forEach((item) => {
      const monthIndex = Number(item.month) - 1; // Convert ke 0-based index
      monthlyRevenue[monthIndex] = Number(item.total_revenue) || 0;
      monthlyCount[monthIndex] = Number(item.transaction_count) || 0;
    });

    res.status(200).json({
      success: true,
      message: "Data revenue bulanan berhasil diambil",
      data: {
        year: parseInt(year),
        monthlyRevenue,
        monthlyCount,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data revenue bulanan",
      errors: error.message,
    });
  }
};

// Alternative dengan Prisma groupBy (jika MySQL/PostgreSQL support)
const getMonthlyRevenueBySource = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const source = req.query.source; // 'penjualan', 'sewa', 'perbaikan'

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    const where = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (source) {
      where.source = source;
    }

    const profits = await prisma.profit.findMany({
      where,
      select: {
        total: true,
        created_at: true,
        source: true,
      },
    });

    // Group by month
    const monthlyData = {
      penjualan: Array(12).fill(0),
      sewa: Array(12).fill(0),
      perbaikan: Array(12).fill(0),
      total: Array(12).fill(0),
    };

    profits.forEach((profit) => {
      const month = new Date(profit.created_at).getMonth(); // 0-11
      const total = Number(profit.total);
      
      monthlyData[profit.source][month] += total;
      monthlyData.total[month] += total;
    });

    res.status(200).json({
      success: true,
      message: "Data revenue bulanan berhasil diambil",
      data: {
        year: parseInt(year),
        monthlyData,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data revenue bulanan",
      errors: error.message,
    });
  }
};

// profitController.js

const getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const source = req.query.source;

    const where = {};
    if (source && ['penjualan', 'sewa', 'perbaikan'].includes(source)) {
      where.source = source;
    }

    //  TAMBAHKAN FILTER: Hanya ambil profit yang referensinya masih ada
    where.OR = [
      {
        source: 'penjualan',
        transaction: { isNot: null } 
      },
      {
        source: 'sewa',
        rental: { isNot: null } 
      },
      {
        source: 'perbaikan',
        repair: { isNot: null } 
      }
    ];

    //  Jika ada filter source, sesuaikan OR filter
    if (source) {
      if (source === 'penjualan') {
        where.OR = [{ source: 'penjualan', transaction: { isNot: null } }];
      } else if (source === 'sewa') {
        where.OR = [{ source: 'sewa', rental: { isNot: null } }];
      } else if (source === 'perbaikan') {
        where.OR = [{ source: 'perbaikan', repair: { isNot: null } }];
      }
    }

    // Get transaksi terbaru dengan detail lengkap
    const profits = await prisma.profit.findMany({
      where,
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        transaction: {
          select: {
            invoice: true,
            status: true,
            customer: {
              select: {
                name_perusahaan: true, 
              }
            },
            transaction_details: { 
              include: {
                product: {
                  select: {
                    title: true,
                    image: true,
                  }
                }
              }
            }
          }
        },
        rental: {
          select: {
            invoice: true,
            status: true,
            customer: {
              select: {
                name_perusahaan: true, 
              }
            },
            details: {
              include: {
                product: {
                  select: {
                    title: true,
                    image: true,
                  }
                }
              }
            },
          }
        },
        repair: {
          select: {
            invoice: true,
            status: true,
            item_repair: true,
            image: true,
            customer: {
              select: {
                name_perusahaan: true,
              }
            },
          }
        },
      },
    });

    console.log(' Profits found:', profits.length);

    // Format data dengan error handling
    const formattedTransactions = profits.map(profit => {
      let transactionData = {
        id: profit.id,
        invoice: 'N/A',
        customer: 'Unknown',
        items: [],
        source: profit.source,
        total: profit.total,
        date: profit.created_at,
        status: 'unknown'
      };

      try {
        // PENJUALAN
        if (profit.source === 'penjualan' && profit.transaction) {
          transactionData.invoice = profit.transaction.invoice || 'N/A';
          transactionData.customer = profit.transaction.customer?.name_perusahaan || 'Guest';
          transactionData.status = profit.transaction.status || 'proses';
          
          transactionData.items = (profit.transaction.transaction_details || []).map(d => ({
            name: d.product?.title || 'Unknown Product',
            image: d.product?.image || null,
            qty: d.qty || 1,
          }));
        } 
        
        //  SEWA
        else if (profit.source === 'sewa' && profit.rental) {
          transactionData.invoice = profit.rental.invoice || 'N/A';
          transactionData.customer = profit.rental.customer?.name_perusahaan || 'Unknown';
          transactionData.status = profit.rental.status || 'proses';
          
          transactionData.items = (profit.rental.details || []).map(d => ({
            name: d.product?.title || 'Unknown Product',
            image: d.product?.image || null,
            qty: d.qty || 1,
          }));
        } 
        
        //  PERBAIKAN
        else if (profit.source === 'perbaikan' && profit.repair) {
          transactionData.invoice = profit.repair.invoice || 'N/A';
          transactionData.customer = profit.repair.customer?.name_perusahaan || 'Unknown';
          transactionData.status = profit.repair.status || 'masuk';
          
          transactionData.items = [{
            name: profit.repair.item_repair || 'Repair Service',
            image: profit.repair.image || null,
            qty: 1,
          }];
        }

        // Fallback jika items kosong
        if (transactionData.items.length === 0) {
          transactionData.items = [{
            name: `${profit.source.charAt(0).toUpperCase() + profit.source.slice(1)} Transaction`,
            image: null,
            qty: 1
          }];
        }

      } catch (itemError) {
        console.error('Error formatting transaction:', itemError);
        transactionData.items = [{
          name: 'Error loading data',
          image: null,
          qty: 1
        }];
      }

      return transactionData;
    });

    console.log(' Formatted transactions:', formattedTransactions.length);

    res.status(200).json({
      success: true,
      message: "Transaksi terbaru berhasil diambil",
      data: formattedTransactions,
    });

  } catch (error) {
    console.error('Error in getRecentTransactions:', error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil transaksi terbaru",
      errors: error.message,
    });
  }
};

module.exports = {
  getTotalRevenue,
  getRevenueByPeriod,
  getRevenueStats,
  getMonthlyRevenue,
  getMonthlyRevenueBySource,
  getRecentTransactions, 
};
