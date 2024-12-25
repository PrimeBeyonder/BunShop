import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { productSchema} from "../schema/indes.ts";
import { handleError } from "../utils/ errorHandler.ts";
import logger from '../utils/logger'

const prisma = new PrismaClient()

export const productRoutes = new Elysia({ prefix: 'api/v1/products' })
    .post('/', async ({ body }) => {
        try {
            const validatedData = productSchema.parse(body)
            const product = await prisma.product.create({
                data: validatedData,
            })

            logger.info({ product }, 'Product created successfully')

            return new Response(
                JSON.stringify({ message: 'Product created successfully', product }),
                { status: 201 }
            )
        } catch (error) {

            logger.error({ error }, 'Failed to create product')

            return handleError(error)
        }
    })
    .get("/", async () => {
        try {

            const products = await prisma.product.findMany()

            logger.info({ products }, 'Products retrieved successfully')

            return new Response(
                JSON.stringify({ message: 'Products retrieved successfully', products }),
                { status: 200 }
            )
        } catch (err) {
            logger.error({ err }, 'Failed to retrieve products')

            return handleError(err)
        }
    })
    .get("/:id", async ({ params: { id } }) => {
        try {
            const product = await prisma.product.findUnique({
                where: { id: Number(id) },
            })

            if (!product) {
                logger.error({ id }, 'No Product Found for this ID')
                return new Response(
                    JSON.stringify({ message: `No Product Found For this ID: ${id}` }),
                    { status: 404 }
                )
            }
            logger.info({ product }, 'Product retrieved successfully')

            return new Response(
                JSON.stringify({ message: 'Product retrieved successfully', product }),
                { status: 200 }
            )
        } catch (err) {
            logger.error({ err }, 'Failed to retrieve product')
            return handleError(err)
        }
    })
    .put("/:id", async ({ params: { id }, body }) => {
        try {
            const validatedData = productSchema.partial().parse(body)
            const updatedProduct = await prisma.product.update({
                where: { id: Number(id) },
                data: validatedData,
            })
            logger.info({ updatedProduct }, 'Product updated successfully')
            return new Response(
                JSON.stringify({ message: 'Product updated successfully', updatedProduct }),
                { status: 200 }
            )
        } catch (err) {
            logger.error({ err }, 'Failed to update product')
            return handleError(err)
        }
    })
    .delete('/:id', async ({ params: { id } }) => {
        try {
            await prisma.product.delete({
                where: { id: Number(id) },
            })
            logger.info({ id }, 'Product deleted successfully')

            return new Response(
                JSON.stringify({ message: `Successfully Deleted Product: ${id}` }),
                { status: 200 }
            )
        } catch (error) {

            logger.error({ error }, 'Failed to delete product')

            return handleError(error)
        }
    })
