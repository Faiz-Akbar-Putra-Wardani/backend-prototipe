const express = require("express");
const prisma = require("../prisma/client");

const findBanks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const banks = await prisma.bank.findMany({
            where: {
                OR: [
                    { account_holder: { contains: search } },
                    { bank_name: { contains: search } },
                    { account_number: { contains: search } },
                ],
            },
            select: {
                uuid: true,
                account_holder: true,
                bank_name: true,
                account_number: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { id: "desc" },
            skip,
            take: limit,
        });

        const totalBanks = await prisma.bank.count({
            where: {
                OR: [
                    { account_holder: { contains: search } },
                    { bank_name: { contains: search } },
                    { account_number: { contains: search } },
                ],
            },
        });

        res.status(200).json({
            meta: { success: true, message: "Berhasil mendapatkan data bank" },
            data: banks,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBanks / limit),
                perPage: limit,
                total: totalBanks,
            }
        });

    } catch (error) {
        res.status(500).json({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const createBank = async (req, res) => {
    try {
        const bank = await prisma.bank.create({
            data: {
                account_holder: req.body.account_holder,
                bank_name: req.body.bank_name,
                account_number: req.body.account_number,
            },
        });

        res.status(201).json({
            meta: { success: true, message: "Berhasil menambahkan data bank" },
            data: bank,
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const findBankById = async (req, res) => {
    const { uuid } = req.params;

    try {
        const bank = await prisma.bank.findUnique({
            where: { uuid },
            select: {
                uuid: true,
                account_holder: true,
                bank_name: true,
                account_number: true,
                created_at: true,
                updated_at: true
            },
        });

        if (!bank) {
            return res.status(404).send({
                meta: { success: false, message: `Bank dengan UUID: ${uuid} tidak ditemukan` },
            });
        }

        res.status(200).send({
            meta: { success: true, message: "Berhasil mendapatkan data bank" },
            data: bank,
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const updateBank = async (req, res) => {
    const { uuid } = req.params;

    try {
        const bank = await prisma.bank.update({
            where: { uuid },
            data: {
                account_holder: req.body.account_holder,
                bank_name: req.body.bank_name,
                account_number: req.body.account_number,
            },
        });

        res.status(200).send({
            meta: { success: true, message: "Data bank berhasil diperbarui" },
            data: bank,
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const deleteBank = async (req, res) => {
    const { uuid } = req.params;

    try {
        await prisma.bank.delete({ where: { uuid } });

        res.status(200).send({
            meta: { success: true, message: "Bank berhasil dihapus" },
        });

    } catch (error) {
        res.status(500).send({ meta: { success: false, message: "Server error" }, errors: error });
    }
};

const allBanks = async (req, res) => {
    try {
        const banks = await prisma.bank.findMany({
            select: {
                id: true,
                account_holder: true,
                bank_name: true,
                account_number: true,
            },
            orderBy: {
                id: "desc",
            }
        });

        const formattedBanks = banks.map(bank => ({
            value: bank.id,
            label: `${bank.bank_name} - ${bank.account_number}`,
            account_holder: bank.account_holder,
            bank_name: bank.bank_name,
            account_number: bank.account_number
        }));

        res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua data bank",
            },
            data: formattedBanks,
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

module.exports = { 
    findBanks, 
    createBank, 
    findBankById, 
    updateBank, 
    deleteBank, 
    allBanks 
};
