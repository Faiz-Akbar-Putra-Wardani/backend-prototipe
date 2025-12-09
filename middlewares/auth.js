const express = require('express');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ 
            meta: { success: false, message: 'Tidak terautentikasi.' } 
        });
    }

    // Hapus "Bearer " jika ada
    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

    jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                meta: { success: false, message: 'Token tidak valid' } 
            });
        }
        
        req.userId = decoded.id;
        req.userRole = decoded.role; // ← Simpan role dari token
        next();
    });
};

module.exports = verifyToken;
