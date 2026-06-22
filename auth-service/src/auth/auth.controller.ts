import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AzureSyncService } from './azure-sync.service';
import express from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly azureSyncService: AzureSyncService,
    ) {}

    // AZURE -> manual
    @Post('sync')
    async syncManual() {
        await this.azureSyncService.syncManual();
        return { message: 'Sincronización completada' };
    }

    // Login
    @Post('login-microsoft')
    async loginMicrosoft(
        @Body() body: { token: string },
        @Res({ passthrough: true }) res: express.Response,
    ){
        const { access_token, usuario } = await this.authService.loginMicrosoft(body.token);

        res.cookie('jwt', access_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'none',
            maxAge: 8 * 60 * 60 * 1000,
            path: '/',
        });

        return { access_token, usuario };
    }

    // Borrar después (se usa para local)
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
            sameSite: 'none',
            maxAge: 8 * 60 * 60 * 1000,
            path: '/',
        });

        return { access_token, usuario };
    }
    // Hasta aquí

    @Post('logout')
    logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie('jwt', { path: '/' });
        return { message: 'Sesión cerrada' };
    }
}
