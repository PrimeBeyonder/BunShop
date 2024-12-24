import {Elysia, t} from "elysia";
import {PrismaClient} from "@prisma/client"

const prisma = new PrismaClient();

export const userRoutes = new Elysia({prefix: "api/v1/users"})
    .get("/", async () => {
        try {
            const users = await prisma.user.findMany();
            return new Response(JSON.stringify({ users }), { status: 200 });
        } catch (err) {
            return new Response(
                JSON.stringify({ error: "Failed to retrieve users", details: err }),
                { status: 500 }
            );
        }
    })
    .get("/:id", async ({ params }) => {
        const { id } = params;
        try {
            const user = await prisma.user.findUnique({
                where: { id: Number(id) },
            });

            if (user) {
                return new Response(JSON.stringify({ user }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ message: "No User Found" }), { status: 404 });
            }
        } catch (err) {
            return new Response(JSON.stringify({ message: "Internal Server Error", details: err }), { status: 500 });
        }
    })

    .post("/", async ({ body }) => {
        try {
            const user = await prisma.user.create({
                data: body,
            });
            return new Response(
                JSON.stringify({ message: "User Created Successfully", user }),
                { status: 201 }
            );
        } catch (err) {
            return new Response(
                JSON.stringify({ error: "Failed to register user", details: err }),
                { status: 400 }
            );
        }
    }, {
        body: t.Object({
            email: t.String(),
            name: t.Optional(t.String()),
        })
    })
    .put("/:id", async ({ params: { id }, body }) => {
        try {
            const updatedUser = await prisma.user.update({
                where: { id: Number(id) },
                data: body,
            });
            return new Response(
                JSON.stringify({ message: "User Updated Successfully", updatedUser }),
                { status: 200 }
            );
        } catch (err) {
            return new Response(
                JSON.stringify({ error: "Failed to update user", details: err }),
                { status: 500 }
            );
        }
    }, {
        body: t.Object({
            email: t.Optional(t.String()),
            name: t.Optional(t.String()),
        })
    })
    .delete("/:id", async ({ params: { id } }) => {
        try {
            await prisma.user.delete({
                where: { id: Number(id) },
            });
            return new Response(
                JSON.stringify({ message: "User Deleted Successfully", details: id }),
                { status: 200 }
            );
        } catch (err) {
            return new Response(
                JSON.stringify({ error: "Failed to delete user", details: err }),
                { status: 500 }
            );
        }
    });
