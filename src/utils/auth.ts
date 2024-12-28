import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}


export const generateToken = (user: User): string => {
    return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};
export const authorizeRole = (allowedRoles: string[]) => {
    return (user: { role: string }) => {
        if (!allowedRoles.includes(user.role)) {
            throw new Error('Unauthorized');
        }
    };
}

export const Roles = {
    USER: "USER",
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    SUPPORT: "SUPPORT",
} as const;

export type Role = typeof Roles[keyof typeof Roles];

export const OrderStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELED: "CANCELED",
}as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];