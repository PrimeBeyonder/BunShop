import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { productSchema} from "../schema/indes.ts";

const prisma = new PrismaClient()

export const productRoutes = new Elysia({prefix: "api/v1/products"})
    .post("/", async({body}) => {
        try{
            const validatedData = productSchema.parse(body);
            const product = await prisma.product.create({
                data: validatedData,
            })
            return { message: 'Product created successfully', product }
        }catch(err) {
            if (err instanceof z.ZodError) {
                return { error: 'Validation failed', details: err.errors }
            }
            return { error: 'Failed to create product', details: err }
        }
    })
    .get("/", async()=> {
        try{
            const products = await prisma.product.findMany();
            return new Response(JSON.stringify({ products }), { status: 200 });
        }catch(err) {
            return new Response(JSON.stringify({message: `Error while finding products: ${err}`}), { status: 500 });
        }
    })
    .get("/:id", async({params: {id}})=> {
        try{
            const product = await prisma.product.findUnique({
                where: {id: Number(id)}
            })
            if(!product) {
                return new Response(JSON.stringify({message: `No Product Found For this ID: ${id}`}), { status: 404 });
            }
            return new Response(JSON.stringify({ product }), { status: 200 });
        }catch(err) {
            return new Response(JSON.stringify({message: `Error while finding product: ${err}`}), { status: 500 });
        }
    })
    .put("/:id", async({params: {id}, body})=> {
        try{
            const validatedData = productSchema.partial().parse(body);
            const updatedProduct = await prisma.product.update({
                where: { id: Number(id) },
                data: validatedData,
            })
            return { message: 'Product updated successfully', product: updatedProduct }
        }catch(err) {
            if (err instanceof z.ZodError) {
                return { error: 'Validation failed', details: err.errors }
            }
            return { error: 'Failed to update product', details: err }
        }
    })
    .delete('/:id', async ({ params: { id } }) => {
        try {
            await prisma.product.delete({
                where: { id: Number(id) },
            })
            return new Response(JSON.stringify({message: `Successfully Deleted Product: ${id}`}), { status: 200 });
        } catch (error) {
            return new Response(JSON.stringify({message: `Error While Deleting Product: ${error}`}), { status: 500 });
        }
    })

