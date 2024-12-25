import {Elysia} from "elysia";
import {verifyToken} from "../utils/auth.ts";
import {AppError} from "../utils/ errorHandler.ts";

export const authMiddleware = new Elysia()
    .derive(({request}) => {
        return {
            authorize: async () => {
                const token = request.headers.get("Authorization")?.split(' ')[1];
                if (!token) throw new AppError("No Token Provided" , 401);
                try{
                    const decodedToken = await verifyToken(token);
                    return decodedToken;
                }catch(err){
                    throw new AppError("Unable to verify token", 401);
                }
            }
        }
    })