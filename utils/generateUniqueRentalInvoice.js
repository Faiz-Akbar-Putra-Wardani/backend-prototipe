const prisma = require("../prisma/client");
const { generateRandomRentalInvoice } = require("./generateRandomRentalInvoice");

async function generateUniqueRentalInvoice() {
    let invoice;
    let exists = true;

    while (exists) {
        invoice = generateRandomRentalInvoice();

        // Cek apakah invoice rental sudah ada
        exists = await prisma.rental.findUnique({
            where: { invoice }
        });
    }

    return invoice;
}

module.exports = { generateUniqueRentalInvoice };
