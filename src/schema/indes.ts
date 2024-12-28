import { z } from 'zod'
import {Roles} from "../utils/auth.ts";

export const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    role: z.enum([Roles.USER, Roles.ADMIN, Roles.MANAGER, Roles.SUPPORT]).optional(),
    dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : undefined),
    profileImageUrl: z.string().optional(),
});

export const productSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number().positive(),
    category: z.string(),
    brand: z.string().optional(),
    sku: z.string(),
    stockCount: z.number().int().nonnegative(),
    imageUrl: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});