const prisma = require("../prisma/client");
const { generateRandomInvoice } = require("./generateRandomInvoice");

async function generateUniqueInvoice() {
    let invoice;
    let exists = true;

    while (exists) {
        invoice = generateRandomInvoice();

        // Cek apakah invoice sudah ada di database
        exists = await prisma.transaction.findUnique({
            where: { invoice }
        });
    }

    return invoice;
}

module.exports = { generateUniqueInvoice };
