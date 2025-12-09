function diffMonths(start, end) {
  if (!(start instanceof Date) || !(end instanceof Date)) return 0;
  if (end < start) return 0;

  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();

  if (end.getDate() > start.getDate()) {
    months += 1;
  }

  return months < 1 ? 1 : months;
}

module.exports = { diffMonths };
