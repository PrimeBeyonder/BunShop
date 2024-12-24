import { z } from 'zod'

export const userSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
})

export const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be a positive number")
})