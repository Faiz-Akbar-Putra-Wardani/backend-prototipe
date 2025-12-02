const prisma = require("../prisma/client");
const { generateRandomInvoiceRepair } = require("./generateRandomInvoiceRepair");

async function generateUniqueRepairInvoice() {
    let invoice;
    let exists = true;

    while (exists) {
        invoice = generateRandomInvoiceRepair();

        // Cek apakah invoice sudah ada di database
        exists = await prisma.repair.findUnique({
            where: { invoice }
        });
    }

    return invoice;
}

module.exports = { generateUniqueRepairInvoice };
