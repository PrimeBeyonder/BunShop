import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { handleError, AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';
import {generateToken, hashPassword, comparePasswords, Roles, Role, verifyToken} from "../utils/auth.ts";
import { authMiddleware } from '../middleware/auth';
import {userSchema, loginSchema} from "../schema/indes.ts";

const prisma = new PrismaClient();
const authenticateUser = async (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    throw new AppError('Token missing or malformed', 401);
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  const { userId } = decoded;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const userRoutes = new Elysia({ prefix: '/users' })
    .post("/register", async ({body}) => {
      try {
        const validatedData = userSchema.parse(body);
        const hashedPassword = await hashPassword(validatedData.password);
        const user = await prisma.user.create({
          data: { ...validatedData, password: hashedPassword, role: Roles.USER },
        });
        const { password, ...userWithoutPassword } = user;
        logger.info({ user: userWithoutPassword }, 'User registered successfully');
        return new Response(
            JSON.stringify({ message: "User Created Successfully", user: userWithoutPassword }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error({ error }, 'Failed to register user');
        return handleError(error);
      }
    })
    .post("/login", async ({body}) => {
      try {
        const { email, password } = loginSchema.parse(body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new AppError('Invalid credentials', 401);
        }
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
          throw new AppError('Invalid credentials', 401);
        }
        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;
        logger.info({ user: userWithoutPassword }, 'User logged in successfully');
        return new Response(
            JSON.stringify({ message: 'Login successful', user: userWithoutPassword, token }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error({ error }, 'Failed to log in user');
        return handleError(error);
      }
    })
    .get("/me", async ({ request }) => {
      try {
        const user = await authenticateUser(request);
        const { password, ...userWithoutPassword } = user;
        logger.info({ user: userWithoutPassword }, 'User retrieved successfully');
        return new Response(
            JSON.stringify({ user: userWithoutPassword }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error({ error }, 'Failed to retrieve user');
        return handleError(error);
      }
    })
    .get('/', async ({ request }) => {
      try {
        const user = await authenticateUser(request);
        if (![Roles.ADMIN, Roles.MANAGER].includes(user.role as Role)) {
          throw new AppError('Unauthorized', 403);
        }
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phoneNumber: true,
            address: true,
            dateOfBirth: true,
            profileImageUrl: true,
            createdAt: true,
            updatedAt: true
          }
        });
        logger.info('All users retrieved successfully');
        return new Response(
            JSON.stringify({ users }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error({ error }, 'Failed to retrieve all users');
        return handleError(error);
      }
    })
    .put('/:id', async ({ params: { id }, body, request }) => {
      try {
        const authenticatedUser = await authenticateUser(request);

        // Validate the `id` parameter
        const userId = Number(id);
        if (isNaN(userId)) {
          throw new AppError('Invalid user ID', 400);
        }

        // Check if the user exists
        const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
        if (!userToUpdate) {
          throw new AppError('User not found', 404);
        }

        // Check if the authenticated user is authorized to update
        if (userId !== authenticatedUser.id && ![Roles.ADMIN, Roles.MANAGER].includes(authenticatedUser.role as Role)) {
          throw new AppError('Unauthorized to update this user', 403);
        }

        // Filter the body to remove undefined fields (Prisma requires valid fields only)
        const updateData = Object.fromEntries(
            Object.entries(body).filter(([_, value]) => value !== undefined)
        );

        // Perform the update
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phoneNumber: true,
            address: true,
            dateOfBirth: true,
            profileImageUrl: true,
          },
        });

        logger.info({ updatedUser }, 'User updated successfully');
        return new Response(
            JSON.stringify({ message: 'User updated successfully', user: updatedUser }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error({ error }, 'Failed to update user');
        return handleError(error);
      }
    }, {
      body: t.Object({
        email: t.Optional(t.String()),
        name: t.Optional(t.String()),
        role: t.Optional(t.String()),
        phoneNumber: t.Optional(t.String()),
        address: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        profileImageUrl: t.Optional(t.String()),
      }),
    })
    .delete('/:id', async ({ params: { id }, request }) => {
      try {
        const authenticatedUser = await authenticateUser(request);
        if (authenticatedUser.role !== Roles.ADMIN) {
          throw new AppError('Unauthorized', 403);
        }
        await prisma.user.delete({ where: { id: Number(id) } });
        logger.info({ userId: id }, 'User deleted successfully');
        return new Response(
            JSON.stringify({ message: 'User deleted successfully' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error({ error }, 'Failed to delete user');
        return handleError(error);
      }
    })
    .put('/:id/role', async ({ params: { id }, body, request }) => {
      try {
        const authenticatedUser = await authenticateUser(request);
        if (authenticatedUser.role !== Roles.ADMIN) {
          throw new AppError('Unauthorized', 403);
        }
        const { role } = body;
        if (!Object.values(Roles).includes(role)) {
          throw new AppError('Invalid role', 400);
        }
        const updatedUser = await prisma.user.update({
          where: { id: Number(id) },
          data: { role },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phoneNumber: true,
            address: true,
            dateOfBirth: true,
            profileImageUrl: true,
            createdAt: true,
            updatedAt: true
          }
        });
        logger.info({ updatedUser }, 'User role updated successfully');
        return new Response(
            JSON.stringify({ message: 'User role updated successfully', user: updatedUser }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error({ error }, 'Failed to update user role');
        return handleError(error);
      }
    }, {
      body: t.Object({
        role: t.String(),
      }),
    });
