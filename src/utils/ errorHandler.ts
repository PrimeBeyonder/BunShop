import { z } from 'zod'

export class AppError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
    }
}

export const handleError = (error: unknown) => {
    if (error instanceof AppError) {
        return { error: error.message, statusCode: error.statusCode }
    }
    if (error instanceof z.ZodError) {
        return { error: 'Validation failed', details: error.errors, statusCode: 400 }
    }
    console.error(error)
    return { error: 'Internal Server Error', statusCode: 500 }
}
