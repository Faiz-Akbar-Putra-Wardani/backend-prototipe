const prisma = require("../client");
const bcrypt = require("bcryptjs");

async function main(){
    const password = await bcrypt.hash("password123", 10);

    await prisma.user.create({
        data: {
            name: "sinar elektro sejahtera",
            email: "ses@gmail.com",
            password
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });