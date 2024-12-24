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
            // Validate the request body using the productSchema
            const validatedData = productSchema.parse(body)

            // Create the product in the database
            const product = await prisma.product.create({
                data: validatedData,
            })

            // Log the success
            logger.info({ product }, 'Product created successfully')

            // Return the success response with status code 201
            return new Response(
                JSON.stringify({ message: 'Product created successfully', product }),
                { status: 201 }
            )
        } catch (error) {
            // Log the error
            logger.error({ error }, 'Failed to create product')

            // Return the error response with status code 500 (Internal Server Error)
            return handleError(error)
        }
    })
    .get("/", async () => {
        try {
            // Retrieve all products from the database
            const products = await prisma.product.findMany()

            // Log the success
            logger.info({ products }, 'Products retrieved successfully')

            // Return the success response with status code 200
            return new Response(
                JSON.stringify({ message: 'Products retrieved successfully', products }),
                { status: 200 }
            )
        } catch (err) {
            // Log the error
            logger.error({ err }, 'Failed to retrieve products')

            // Return the error response with status code 500
            return handleError(err)
        }
    })
    .get("/:id", async ({ params: { id } }) => {
        try {
            // Retrieve a product by ID from the database
            const product = await prisma.product.findUnique({
                where: { id: Number(id) },
            })

            if (!product) {
                // Log the failure for the missing product
                logger.error({ id }, 'No Product Found for this ID')

                // Return a 404 response (Product not found)
                return new Response(
                    JSON.stringify({ message: `No Product Found For this ID: ${id}` }),
                    { status: 404 }
                )
            }

            // Log the success
            logger.info({ product }, 'Product retrieved successfully')

            // Return the success response with status code 200
            return new Response(
                JSON.stringify({ message: 'Product retrieved successfully', product }),
                { status: 200 }
            )
        } catch (err) {
            // Log the error
            logger.error({ err }, 'Failed to retrieve product')

            // Return the error response with status code 500
            return handleError(err)
        }
    })
    .put("/:id", async ({ params: { id }, body }) => {
        try {
            // Validate the request body using the productSchema (allow partial updates)
            const validatedData = productSchema.partial().parse(body)

            // Update the product in the database
            const updatedProduct = await prisma.product.update({
                where: { id: Number(id) },
                data: validatedData,
            })

            // Log the success
            logger.info({ updatedProduct }, 'Product updated successfully')

            // Return the success response with status code 200
            return new Response(
                JSON.stringify({ message: 'Product updated successfully', updatedProduct }),
                { status: 200 }
            )
        } catch (err) {
            // Log the error
            logger.error({ err }, 'Failed to update product')

            // Return the error response with status code 500
            return handleError(err)
        }
    })
    .delete('/:id', async ({ params: { id } }) => {
        try {
            // Delete the product from the database
            await prisma.product.delete({
                where: { id: Number(id) },
            })

            // Log the success
            logger.info({ id }, 'Product deleted successfully')

            // Return the success response with status code 200
            return new Response(
                JSON.stringify({ message: `Successfully Deleted Product: ${id}` }),
                { status: 200 }
            )
        } catch (error) {
            // Log the error
            logger.error({ error }, 'Failed to delete product')

            // Return the error response with status code 500
            return handleError(error)
        }
    })
