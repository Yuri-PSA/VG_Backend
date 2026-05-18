import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(correo: string, plainPassword: string): Promise<any> {
        const user = await this.prisma.$queryRawUnsafe<
            Array<{ 
                usuario_id: number; 
                correo: string; 
                rol: string;
                password: string;
                nombre: string;
                apellidos: string; 
            }>
        >(
            `SELECT usuario_id, correo, rol, password, nombre, apellidos
            FROM auth.usuario
            WHERE correo = $1`,
            correo,
        );

        if(user.length === 0) 
            throw new UnauthorizedException('Credenciales incorrectas. Por favor, verifica tu correo y contraseña');

        const usuario = user[0];

        const result = await this.prisma.$queryRawUnsafe<Array<{ match: boolean }>>(
            `SELECT (password = crypt($1, password)) AS match
            FROM auth.usuario
            WHERE usuario_id = $2`,
            plainPassword,
            usuario.usuario_id,
        );

        const firstName = usuario.nombre.split(' ')[0];
        const lastName = usuario.apellidos.split(' ')[0];
        const shortName = `${firstName} ${lastName}`;

        if(result[0]?.match) {
            const { password, ...rest } = usuario;
            return { ...rest, nombre: shortName }; // return data without password
        }
        throw new UnauthorizedException('Credenciales incorrectas. Por favor, verifica tu correo y contraseña');
    }

    async login(correo: string, password: string) {
        const user = await this.validateUser(correo, password);
        const payload = {
            sub: user.usuario_id,
            correo: user.correo,
            rol: user.rol,
            nombre: user.nombre,
        };
        return {
            access_token: this.jwtService.sign(payload),
            usuario: {
                usuario_id: user.usuario_id,
                correo: user.correo,
                rol: user.rol,
                nombre: user.nombre,
            },
        };
    }
}
