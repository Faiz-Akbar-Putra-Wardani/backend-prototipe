const express = require("express");
const prisma = require("../prisma/client");

const findCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const search = req.query.search || '';

        const customers = await prisma.customer.findMany({
            where: {
                name_perusahaan: {
                    contains: search,
            },
        },
        select:{
            id: true,
            name_perusahaan: true,
            no_telp: true,
            address: true,
            created_at: true,
            updated_at: true,
        },
        orderBy:{
            id: "desc",
        },
        skip: skip,
        take: limit,
    });

     const totalCustomers = await prisma.customer.count({
            where: {
                name_perusahaan: {
                    contains: search, 
                },
            },
        });

    const totalPages = Math.ceil(totalCustomers / limit);

    res.status(200).json({
        meta: {
            success: true,
            message: "Berhasil mendaptkan pelanggan ",
        },
        data: customers,
        pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalCustomers,
        }
    });

   } catch(error) {
    console.log(error);
    res.status(500).json({
        meta: {
            success: false,
            message: "Terjadi kesalahan di server",
        },
        errors: error,
    });

   }
};

const createCustomers = async (req, res) => {
    try{
        const customer = await prisma.customer.create({
            data: {
                name_perusahaan: req.body.name_perusahaan,
                no_telp: req.body.no_telp,
                address: req.body.address,
            },
        });

        res.status(201).json({
            meta: {
                success: true,
                message: "Berhasil menambahkan pelanggan",
            },
            data: customer,
        });
    } catch(error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const findCustomerById = async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await prisma.customer.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name_perusahaan: true,
                no_telp: true,
                address: true,
                created_at: true,
                updated_at: true
            },
        });

        if (!customer) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Pelanggan dengan ID: ${id} tidak ditemukan`,
                },
            });
        }
        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mendapatkan pelanggan dengan ID: ${id}`,
            },
            
            data: customer,
        });

    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

const updateCustomer = async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await prisma.customer.update({
            where: {
                id: Number(id),
            },
            data: {
                name_perusahaan: req.body.name_perusahaan,
                no_telp: req.body.no_telp,
                address: req.body.address,
            },
        });

        res.status(200).send({
            meta: {
                success: true,
                message: `Pelanggan berhasil di perbarui`,
            },
            data: customer,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
}

const deleteCustomer = async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await prisma.customer.findUnique({
            where: {
                id : Number(id),
            }
        });
        if (!customer){
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Pelanggan dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        await prisma.customer.delete({
            where: {
                id: Number(id),
            },
        });

        res.status(200).send({
            meta: {
                success: true,
                message: `Pelanggan berhasil dihapus`,
            },
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
}

const allCustomers = async (req, res) => {
    try {

        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name_perusahaan: true,
                no_telp: true,
                address: true,
            },
            orderBy: {
                id: "desc",
            }
        });

        const formattedCustomers = customers.map(customer => ({
            value: customer.id,
            label: customer.name_perusahaan,
            no_telp: customer.no_telp,
            address: customer.address

        }));

        res.status(200).send({
           
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua pelanggan",
            },
            data: formattedCustomers,
        });

    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
};

module.exports = { findCustomers, createCustomers, findCustomerById, updateCustomer, deleteCustomer, allCustomers };