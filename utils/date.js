function diffMonths(start, end) {
  if (!(start instanceof Date) || !(end instanceof Date)) return 0;
  if (end < start) return 0;

  // Hitung selisih bulan dari tahun dan bulan
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();

  // Jika tanggal end LEBIH BESAR dari tanggal start, tambah 1 bulan
  // Contoh: 1 Jan - 2 Feb = end.date(2) > start.date(1) → tambah 1 bulan = 2 bulan
  // Contoh: 1 Jan - 1 Feb = end.date(1) === start.date(1) → tetap 1 bulan
  if (end.getDate() > start.getDate()) {
    months += 1;
  }

  return months < 1 ? 1 : months;
}

module.exports = { diffMonths };
