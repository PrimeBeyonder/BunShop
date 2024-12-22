import {Elysia, t} from "elysia";
import {PrismaClient} from "@prisma/client"

const prisma = new PrismaClient();

export const userRoutes = new Elysia({prefix: "/users"})
        .post("/", async ({body}) => {
            try{
                const user = await prisma.user.create({
                    data: body,
                })
                return {message: "User Created Successfully", user};
            }catch(err){
                return {error : "Failed to register user", details: err};
            }
        }, {
            body: t.Object({
                email: t.String(),
                name: t.Optional(t.String()),
            })
        })