import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {userSchema} from "../schema/indes.ts";
import { handleError, AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';
import {generateToken, hashPassword, comparePasswords, verifyToken} from '../utils/auth';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const userRoutes = new Elysia({prefix: "/users"})
    .use(authMiddleware)
    .post("/register", async ({ body }) => {
        try {
            const validatedData = userSchema.extend({password:z.string()}).parse(body);
            const hashedPassword = await hashPassword(validatedData.password);
            const user = await prisma.user.create({
                data:{...validatedData, password:hashedPassword},
            })
            const {password, ...userWithoutPassword} = user;
            logger.info({ user: userWithoutPassword }, 'User registered successfully');
            return new Response(
                JSON.stringify({ message: "User Created Successfully", user: userWithoutPassword }),
                { status: 201 }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to register user');
            return handleError(error);
        }
    })
    .post("/login", async ({ body }) => {
        try {
            const { email, password } = loginSchema.parse(body);
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new AppError("Invalid Credentials", 401);
            }
            const isPasswordValid = await comparePasswords(password, user.password);
            if (!isPasswordValid) {
                throw new AppError("Invalid Credentials", 401);
            }
            const token = generateToken(user);
            const { password: _, ...userWithoutPassword } = user;
            logger.info({ user: userWithoutPassword }, 'User login successfully');
            return new Response(
                JSON.stringify({
                    message: "Login successful",
                    user: userWithoutPassword,
                    token: token
                }),
                { status: 200 }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to log in user');
            return handleError(error);
        }
    })
    .get("/me", async ({ request, authorize }) => {
        try {
            const authHeader = request.headers.get('Authorization');

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AppError('Token missing or malformed', 401);
            }
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            const { userId } = decoded;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new AppError('User not found', 404);
            }
            const { password, ...userWithoutPassword } = user;
            logger.info({ user: userWithoutPassword }, 'User retrieved successfully');
            return new Response(
                JSON.stringify({ user: userWithoutPassword }),
                { status: 200 }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve user');
            return handleError(error);
        }
    })
    .get('/', async () => {
        try {
            const users = await prisma.user.findMany()
            return { users }
        } catch (error) {
            return { error: 'Failed to fetch users', details: error }
        }
    })
    .get('/:id', async ({ params: { id } }) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: Number(id) },
            })
            if (!user) {
                return { error: 'User not found' }
            }
            return { user }
        } catch (error) {
            return { error: 'Failed to fetch user', details: error }
        }
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
