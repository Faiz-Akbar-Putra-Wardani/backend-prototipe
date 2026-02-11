const prisma = require("../prisma/client");
const excelJS = require('exceljs');
const { moneyFormat } = require('../utils/moneyFormat');

const getCustomerRecap = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const type = req.query.type;
    const search = req.query.search;
    const all = req.query.all === 'true'; 

    let results = [];

    // SALE 
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

    // RENTAL 
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

    // REPAIR 
    if (!type || type === "perbaikan") {
      const repairs = await prisma.repair.findMany({
        select: {
          invoice: true,
          grand_total: true,
          created_at: true,
          customer: { select: { name_perusahaan: true } },
        },
      });

      results.push(
        ...repairs.map((r) => ({
          invoice: r.invoice,
          perusahaan: r.customer?.name_perusahaan ?? "-",
          total: r.grand_total,
          type: "perbaikan",
          created_at: r.created_at,
        }))
      );
    }

    //SEARCH FILTER 
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (item) =>
          item.invoice?.toLowerCase().includes(searchLower) ||
          item.perusahaan?.toLowerCase().includes(searchLower)
      );
    }

    //SORT 
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = results.length;

    if (all) {
      return res.status(200).json({
        success: true,
        data: results, 
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

const exportCustomerRecap = async (req, res) => {
  try {
    const type = req.query.type;
    const search = req.query.search;

    let results = [];

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

    if (!type || type === "perbaikan") {
      const repairs = await prisma.repair.findMany({
        select: {
          invoice: true,
          grand_total: true,
          created_at: true,
          customer: { select: { name_perusahaan: true } },
        },
      });

      results.push(
        ...repairs.map((r) => ({
          invoice: r.invoice,
          perusahaan: r.customer?.name_perusahaan ?? "-",
          total: r.grand_total,
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

    // Buat workbook Excel
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Pelanggan');

    // Header columns
    worksheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Tanggal', key: 'tanggal', width: 20 },
      { header: 'Invoice', key: 'invoice', width: 25 },
      { header: 'Pelanggan', key: 'perusahaan', width: 30 },
      { header: 'Jenis', key: 'type', width: 15 },
      { header: 'Total', key: 'total', width: 20 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add border to header
    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Tambahkan data
    const totalAmount = results.reduce((sum, item) => sum + Number(item.total), 0);
    
    results.forEach((item, index) => {
      const rowNumber = index + 2;
      worksheet.addRow({
        no: rowNumber,
        tanggal: new Date(item.created_at).toLocaleDateString('id-ID'),
        invoice: item.invoice,
        perusahaan: item.perusahaan,
        type: item.type.toUpperCase(),
        total: ` ${moneyFormat(item.total)}`,
      });

      // Style data rows
      const row = worksheet.getRow(rowNumber);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Color coding berdasarkan type
      const typeCell = row.getCell(5); // Kolom Jenis
      if (item.type === 'penjualan') {
        typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
      } else if (item.type === 'sewa') {
        typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8D9' } };
      } else if (item.type === 'perbaikan') {
        typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5B4' } };
      }
    });

    // Baris TOTAL
    const totalRow = worksheet.addRow({
      no: '',
      tanggal: '',
      invoice: '',
      perusahaan: 'TOTAL',
      type: '',
      total: ` ${moneyFormat(totalAmount)}`,
    });

    // Style total row
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFDC3545' } };
      cell.alignment = { horizontal: colNumber <= 4 ? 'center' : 'right', vertical: 'middle' };
      cell.border = {
        top: { style: 'thick' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    totalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5B4' } };

    // Auto fit columns
    worksheet.columns.forEach((column) => {
      column.width = column.width || 15;
    });

    // Set header response untuk download Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=Rekap_Pelanggan_${new Date().toISOString().split('T')[0]}.xlsx`);

    // Generate dan kirim file Excel
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal export data ke Excel",
    });
  }
};



module.exports = { getCustomerRecap, deleteCustomerRecap, getTransactionStats, exportCustomerRecap };
