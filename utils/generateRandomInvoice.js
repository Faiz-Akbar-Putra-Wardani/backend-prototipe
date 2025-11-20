function generateRandomInvoice(prefix = 'INVSALE') {
     // Tanggal YYMMDD
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');

    // Random 4 karakter ALFANUMERIK
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${prefix}-${datePart}-${randomPart}`;
}

module.exports = { generateRandomInvoice }