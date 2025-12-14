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
                uuid: true,
                name_perusahaan: true,
                no_telp: true,
                address: true,
                created_at: true,
                updated_at: true,
            },
            orderBy:{ created_at: "desc" },
            skip,
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
                message: "Berhasil mendapatkan pelanggan",
            },
            data: customers,
            pagination: {
                currentPage: page,
                totalPages,
                perPage: limit,
                total: totalCustomers,
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            meta: { success: false, message: "Terjadi kesalahan di server" },
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
            meta: { success: true, message: "Berhasil menambahkan pelanggan" },
            data: customer,
        });
    } catch(error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const findCustomerById = async (req, res) => {
    const { uuid } = req.params;

    try {
        const customer = await prisma.customer.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                name_perusahaan: true,
                no_telp: true,
                address: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!customer) {
            return res.status(404).send({
                meta: { success: false, message: `Pelanggan dengan UUID: ${uuid} tidak ditemukan` },
            });
        }

        res.status(200).send({
            meta: { success: true, message: "Berhasil mendapatkan pelanggan" },
            data: customer,
        });

    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const updateCustomer = async (req, res) => {
    const { uuid } = req.params;

    try {
        const customer = await prisma.customer.update({
            where: { uuid },
            data: {
                name_perusahaan: req.body.name_perusahaan,
                no_telp: req.body.no_telp,
                address: req.body.address,
            },
        });

        res.status(200).send({
            meta: { success: true, message: "Pelanggan berhasil diperbarui" },
            data: customer,
        });

    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const deleteCustomer = async (req, res) => {
    const { uuid } = req.params;

    try {
        const customer = await prisma.customer.findUnique({ where: { uuid } });

        if (!customer){
            return res.status(404).send({
                meta: { success: false, message: `Pelanggan dengan UUID: ${uuid} tidak ditemukan` },
            });
        }

        await prisma.customer.delete({ where: { uuid } });

        res.status(200).send({
            meta: { success: true, message: "Pelanggan berhasil dihapus" },
        });

    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

const allCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                uuid: true,
                name_perusahaan: true,
                no_telp: true,
                address: true,
            },
            orderBy: { created_at: "desc" },
        });

        const formatted = customers.map(c => ({
           value: c.id,          
            uuid: c.uuid,
            label: c.name_perusahaan,
            no_telp: c.no_telp,
            address: c.address,
        }));

        res.status(200).send({
            meta: { success: true, message: "Berhasil mendapatkan semua pelanggan" },
            data: formatted,
        });

    } catch (error) {
        res.status(500).send({
            meta: { success: false, message: "Terjadi kesalahan di server" },
            errors: error,
        });
    }
};

module.exports = {
    findCustomers,
    createCustomers,
    findCustomerById,
    updateCustomer,
    deleteCustomer,
    allCustomers
};
