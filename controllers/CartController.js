// Import express
const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

const findCarts = async (req, res) => {
    try {
        // Mendapatkan data keranjang dari database
        const carts = await prisma.cart.findMany({
            select: {
                id: true,
                cashier_id: true,
                product_id: true,
                qty: true,
                price: true,
                created_at: true,
                updated_at: true,
                product: {
                    select: {
                        uuid: true,        
                        id: true,
                        title: true,
                        sell_price: true,
                        image: true,
                    },
                },
                cashier: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            where: {
                cashier_id: parseInt(req.userId),
            },
            orderBy: {
                id: "desc",
            },
        });

        // Menghitung total harga dengan menjumlahkan harga setiap item keranjang
        const totalPrice = carts.reduce((sum, cart) => sum + cart.price, 0);

        // Mengirimkan respon
        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mendapatkan semua keranjang oleh kasir: ${req.userId}`,
            },
            data: carts,
            totalPrice: totalPrice,
        });

    } catch (error) {
        console.error("ERROR in findCarts:", error);
        return res.status(500).json({
            meta: {
                success: false,
                message: error.message || "Terjadi kesalahan pada server"
            },
            errors: error
        });
    }
};

// Fungsi createCart 
const createCart = async (req, res) => {
    try {
        const productUuid = req.body.product_id; 
        const qty = parseInt(req.body.qty) || 1;

        //  VALIDASI QTY
        if (qty < 1) {
            return res.status(422).json({
                meta: {
                    success: false,
                    message: "Quantity minimal adalah 1",
                },
            });
        }

        //  VALIDASI PRODUCT EXISTS by UUID
        const product = await prisma.product.findUnique({
            where: {
                uuid: productUuid, 
            },
        });

        if (!product) {
            console.log("Product not found with UUID:", productUuid);
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Produk tidak ditemukan`,
                },
            });
        }

        console.log("Product found:", product.id, product.title);

        //  Memeriksa apakah item keranjang sudah ada (gunakan ID internal)
        const existingCart = await prisma.cart.findFirst({
            where: {
                product_id: product.id, // ✅ Gunakan ID internal
                cashier_id: parseInt(req.userId),
            },
        });

        if (existingCart) {
            console.log("Cart exists, updating qty");

            // Jika item keranjang sudah ada, tambahkan jumlahnya
            const newQty = existingCart.qty + qty;
            const updatedCart = await prisma.cart.update({
                where: {
                    id: existingCart.id,
                },
                data: {
                    qty: newQty,
                    price: product.sell_price * newQty,
                    updated_at: new Date(),
                },
                include: {
                    product: {
                        select: {
                            uuid: true,
                            id: true,
                            title: true,
                            sell_price: true,
                            image: true,
                        }
                    },
                    cashier: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            console.log("Cart updated successfully");

            return res.status(200).send({
                meta: {
                    success: true,
                    message: "Jumlah keranjang berhasil diperbarui",
                },
                data: updatedCart,
            });
        } else {
            console.log("Creating new cart");

            // Jika item keranjang belum ada, buat yang baru
            const cart = await prisma.cart.create({
                data: {
                    cashier_id: parseInt(req.userId),
                    product_id: product.id, 
                    qty: qty,
                    price: Number(product.sell_price) * qty
                },
                include: {
                    product: {
                        select: {
                            uuid: true,
                            id: true,
                            title: true,
                            sell_price: true,
                            image: true,
                        }
                    },
                    cashier: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            console.log("Cart created successfully");

            return res.status(201).send({
                meta: {
                    success: true,
                    message: "Keranjang berhasil dibuat",
                },
                data: cart,
            });
        }
    } catch (error) {
        console.error("=== ERROR in createCart ===");
        console.error("Error:", error);
        console.error("Stack:", error.stack);

        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

//  Fungsi updateCart
const updateCart = async (req, res) => {
    const { id } = req.params;
    const { qty } = req.body;

    try {
        // Validasi dasar
        if (!Number.isInteger(Number(qty)) || Number(qty) < 1) {
            return res.status(422).json({
                meta: { success: false, message: "Qty minimal 1" }
            });
        }

        const cart = await prisma.cart.findUnique({
            where: { id: Number(id) }
        });

        if (!cart || cart.cashier_id !== parseInt(req.userId)) {
            return res.status(404).json({
                meta: { success: false, message: "Cart tidak ditemukan" }
            });
        }

        const product = await prisma.product.findUnique({
            where: { id: cart.product_id }
        });

        const updated = await prisma.cart.update({
            where: { id: Number(id) },
            data: {
                qty: Number(qty),
                price: product.sell_price * Number(qty),
                updated_at: new Date(),
            },
            include: {
                product: {
                    select: {
                        uuid: true,
                        id: true,
                        title: true,
                        sell_price: true,
                        image: true,
                    }
                }
            }
        });

        console.log("Cart updated successfully");

        res.status(200).json({
            meta: { success: true, message: "Qty berhasil diupdate" },
            data: updated
        });

    } catch (error) {
        console.error("=== ERROR in updateCart ===");
        console.error(error);
        res.status(500).json({
            meta: { success: false, message: "Gagal update cart" }
        });
    }
};

const deleteCart = async (req, res) => {
    const { id } = req.params;

    try {

        // Mendapatkan data keranjang yang akan dihapus
        const cart = await prisma.cart.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!cart) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Keranjang dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Validasi kasir
        if (cart.cashier_id !== parseInt(req.userId)) {
            return res.status(403).send({
                meta: {
                    success: false,
                    message: "Anda tidak memiliki akses untuk menghapus keranjang ini",
                },
            });
        }

        // Menghapus keranjang
        await prisma.cart.delete({
            where: {
                id: Number(id),
            },
        });

        console.log("Cart deleted successfully");

        res.status(200).send({
            meta: {
                success: true,
                message: "Keranjang berhasil dihapus",
            },
        });

    } catch (error) {

        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

module.exports = { findCarts, createCart, deleteCart, updateCart };
