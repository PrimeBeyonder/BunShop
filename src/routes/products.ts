import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be a positive number")
})

export const productRoutes = new Elysia({prefix: "api/v1/products"})
    .post("/", async({body}) => {
        try{
            const validatedData = productSchema.parse(body);
            const product = await prisma.product.create({
                data: validatedData,
            })
            return new Response(JSON.stringify({ product }), { status: 201 });
        }catch(err) {
            if (err instanceof z.ZodError) {
                const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return new Response(JSON.stringify({message: `Validation error: ${errorMessages}`}), { status: 400 });
            }
            return new Response(JSON.stringify({message: `Error while creating product: ${err}`}), { status: 500 });
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
            return new Response(JSON.stringify({message: `Successfully Updated Product`, product: updatedProduct}), { status: 200 });
        }catch(err) {
            if (err instanceof z.ZodError) {
                const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return new Response(JSON.stringify({message: `Validation error: ${errorMessages}`}), { status: 400 });
            }
            return new Response(JSON.stringify({message: `Error while updating product: ${err}`}), { status: 500 });
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

