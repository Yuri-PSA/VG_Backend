import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import express from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(
        @Body() body: { correo: string; password: string },
        @Res({ passthrough: true }) res: express.Response,
    ){
        const { access_token, usuario } = await this.authService.login(body.correo, body.password);

        // Establecer la cookie
        res.cookie('jwt', access_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000,
            path: '/',
        });

        return { access_token, usuario };
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie('jwt', { path: '/' });
        return { message: 'Sesión cerrada' };
    }
}
