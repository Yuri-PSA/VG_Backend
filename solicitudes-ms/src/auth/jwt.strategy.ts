import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                // 1. Lee la cookie jwt (Frontend)
                (req: Request) => req?.cookies?.jwt || null,
                // 2. Lee el header Authorization (Insomnia)
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET!,
        });
    }

    async validate(payload: any) {
        return { usuario_id: payload.sub, correo: payload.correo, rol: payload.rol };
    }
}