const jwt = require('jsonwebtoken');
const User = require('../models/UserModels');
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

const getTokenFromHeaderOrCookie = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        return req.cookies.jwt;  
    }
    return null;
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

const protect = async (req, res, next) => {
    const token = getTokenFromHeaderOrCookie(req);  
    console.log('Token:', token);

    if (token) {
        try {
            const decoded = verifyToken(token);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found or unauthorized' });
            }

            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ message: 'Invalid token or token expired' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = protect;