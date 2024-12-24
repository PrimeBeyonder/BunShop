import Elysia  from "elysia";
import {PrismaClient} from "@prisma/client"
import {userRoutes} from "./routes/user.ts";
import {productRoutes} from "./routes/products.ts";

const prisma = new PrismaClient();
const app = new Elysia();

app.use(userRoutes)
app.use(productRoutes);
app.get("/", () => "Hello World!");
app.listen(8000, ()=> {
    console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
});
