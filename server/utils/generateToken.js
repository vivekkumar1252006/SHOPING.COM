import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
        throw new Error('JWT_SECRET is missing from server/.env.');
    }

    return jwt.sign({ id }, secret, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};
