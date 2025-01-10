import { Elysia } from 'elysia';
import { userRoutes } from './routes/user';
import { productRoutes} from "./routes/products.ts";
import logger from './utils/logger';
import {orderRoutes} from "./routes/order.ts";
import {categoryRoutes} from "./routes/category.ts";
import {tagRoutes} from "./routes/tag.ts";
import {reviewRoutes} from "./routes/review.ts";

const app = new Elysia();

app.use(userRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use(categoryRoutes);
app.use(tagRoutes);
app.use(reviewRoutes);

app.get('/', () => 'Welcome to BunShop API!');

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen(port, () => {
    logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
});
