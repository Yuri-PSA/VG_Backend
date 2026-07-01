import { Controller, Post, Get, Patch, Body, Res, Req, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
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

    @Get('listar')
    @UseGuards(JwtAuthGuard)
    async listarUsuarios(
        @Req() req,
        @Query('ident') ident?: string,
        @Query('colaborador') colaborador?: string,
        @Query('departamento') departamento?: string,
        @Query('ordenNombre') ordenNombre?: string,
        @Query('ordenEmail') ordenEmail?: string,
        @Query('ordenDep') ordenDep?: string,
        @Query('ordenAcceso') ordenAcceso?: string,
        @Query('ordenRol') ordenRol?: string,
        @Query('ordenJefe') ordenJefe?: string,
        @Query('pagina') pagina?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const userId = req.user.usuario_id;
        return this.authService.listarUsuarios(
            userId,
            ident,
            colaborador,
            departamento,
            ordenNombre,
            ordenEmail,
            ordenDep,
            ordenAcceso,
            ordenRol,
            ordenJefe,
            pagina,
            limit ? parseInt(limit, 10) : 7,
            offset ? parseInt(offset, 10) : 0,
        );
    }

    @Patch('actualizar-acceso')
    @UseGuards(JwtAuthGuard)
    async actualizarAcceso(
        @Req() req,
        @Body() body: { usuarioId: number; acceso: boolean },
    ){
        const userId = req.user.usuario_id;
        return this.authService.actualizarAcceso(userId, body.usuarioId, body.acceso);
    }

    @Patch('actualizar-rol')
    @UseGuards(JwtAuthGuard)
    async actualizarRol(
        @Req() req,
        @Body() body: { usuarioId: number; rol: string },
    ){
        const userId = req.user.usuario_id;
        return this.authService.actualizarRol(userId, body.usuarioId, body.rol);
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie('jwt', { path: '/' });
        return { message: 'Sesión cerrada' };
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
}