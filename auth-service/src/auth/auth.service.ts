import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async loginMicrosoft(microsoftToken: string) {
        // Validar token con Microsoft Graph
        const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${microsoftToken}` }
        });

        if(!graphRes.ok)
            throw new UnauthorizedException('Token de Microsoft inválido');

        const msUser = await graphRes.json();
        const correo = msUser.mail || msUser.userPrincipalName;

        if(!correo)
            throw new UnauthorizedException('Lo siento, no se pudo obtener el correo de Microsoft');

        // Buscar usuario en BD
        const users = await this.prisma.$queryRawUnsafe<
            Array<{
                usuario_id: number;
                correo: string;
                rol: string;
                nombre: string;
                apellidos: string;
                activo: boolean;
                acceso: boolean;
                es_jefe: boolean;
            }>
        >(
            `SELECT u.usuario_id, u.correo, u.rol, u.nombre, u.apellidos, u.activo, u.acceso,
                EXISTS(
                    SELECT 1 FROM auth.usuario c
                    WHERE c.jefe_directo_id = u.usuario_id AND c.activo = TRUE
                ) AS es_jefe
            FROM auth.usuario u
            WHERE u.correo = $1`,
            correo,
        );

        if(users.length === 0)
            throw new UnauthorizedException('Ha habido un problema con tu cuenta. Por favor, contacta al administrador');

        const usuario = users[0];

        if(!usuario.activo)
            throw new UnauthorizedException('Tu cuenta ha sido desactivada. Por favor, contacta al administrador');

        if(!usuario.acceso)
            throw new UnauthorizedException('No tienes acceso al sistema. Por favor, contacta al administrador');

        const firstName = usuario.nombre.split(' ')[0];
        const lastName  = usuario.apellidos.split(' ')[0];
        const shortName = `${firstName} ${lastName}`;

        const payload = {
            sub: usuario.usuario_id,
            correo: usuario.correo,
            rol: usuario.rol,
            nombre: shortName,
            es_jefe: usuario.es_jefe,
        };

        return {
            access_token: this.jwtService.sign(payload),
            usuario: {
                usuario_id: usuario.usuario_id,
                correo: usuario.correo,
                rol: usuario.rol,
                nombre: shortName,
                es_jefe: usuario.es_jefe,
            },
        };
    }

    async listarUsuarios(
        userId: number,
        ident?: string,
        colaborador?: string,
        departamento?: string,
        ordenNombre?: string,
        ordenEmail?: string,
        ordenDep?: string,
        ordenAcceso?: string,
        ordenRol?: string,
        ordenJefe?: string,
        pagina: string = 'Accesos',
        limit: number = 7,
        offset: number = 0
    ){
        const result = await this.prisma.$queryRaw<
            Array<{
                mensaje: string | null;
                usuario_id: number | null;
                nombre_completo: string | null;
                correo: string | null;
                departamento: string | null;
                rol: string | null;
                jefe: string | null;
                acceso: boolean | null;
                paginas: bigint | null;
            }>
        >`
            SELECT * FROM auth.sp_listar_usuarios(
                ${userId}::INT,
                ${ident || null}::VARCHAR,
                ${colaborador || null}::VARCHAR,
                ${departamento || null}::VARCHAR,
                ${ordenNombre || null}::VARCHAR,
                ${ordenEmail || null}::VARCHAR,
                ${ordenDep || null}::VARCHAR,
                ${ordenAcceso || null}::VARCHAR,
                ${ordenRol || null}::VARCHAR,
                ${ordenJefe || null}::VARCHAR,
                ${pagina}::VARCHAR,
                ${limit}::INT,
                ${offset}::INT
            )`;
        
        if(result.length > 0 && result[0].mensaje)
            throw new HttpException(result[0].mensaje, HttpStatus.BAD_REQUEST);

        if(result.length === 0 || result[0].paginas === null) {
            return {
                usuarios: [],
                paginacion: { totalPaginas: 0, paginaActual: 1 },
                mensaje: 'No se encontraron usuarios',
            };
        }

        return {
            usuarios: result.map(u => ({
                usuario_id: u.usuario_id,
                nombre_completo: u.nombre_completo,
                correo: u.correo,
                departamento: u.departamento,
                rol: u.rol,
                jefe: u.jefe,
                acceso: u.acceso,
            })),
            paginacion: {
                totalPaginas: Number(result[0].paginas),
                paginaActual: Math.floor(offset / limit) + 1,
            },
        };
    }

    async actualizarAcceso(
        userId: number,
        targetId: number,
        acceso: boolean
    ){
        const result = await this.prisma.$queryRaw<
            Array<{
                mensaje: string | null;
                exito: boolean;
            }>
        >`
            SELECT * FROM auth.sp_actualizar_acceso(
                ${userId}::INT,
                ${targetId}::INT,
                ${acceso}::BOOLEAN
            )`;

        if(result.length > 0 && result[0].mensaje)
            throw new HttpException(result[0].mensaje, HttpStatus.BAD_REQUEST);

        return { message: `Acceso ${acceso ? 'activado' : 'desactivado'} correctamente` };
    }

    async actualizarRol(
        userId: number,
        targetId: number,
        rol: string
    ){
        const result = await this.prisma.$queryRaw<
            Array<{
                mensaje: string | null;
                exito: boolean;
            }>
        >`
            SELECT * FROM auth.sp_actualizar_rol(
                ${userId}::INT,
                ${targetId}::INT,
                ${rol}::VARCHAR
            )`;
        
        if(result.length > 0 && result[0].mensaje)
            throw new HttpException(result[0].mensaje, HttpStatus.BAD_REQUEST);

        return { message: `Rol actualizado a ${rol} correctamente` };
    }



    // Borrar después (se usa para local)
    async validateUser(correo: string, plainPassword: string): Promise<any> {
        const user = await this.prisma.$queryRawUnsafe<
            Array<{ 
                usuario_id: number; 
                correo: string; 
                rol: string;
                password: string;
                nombre: string;
                apellidos: string; 
                activo: boolean;
                acceso: boolean;
                es_jefe: boolean;
            }>
        >(
            `SELECT u.usuario_id, u.correo, u.rol, u.password, u.nombre, u.apellidos, u.activo, u.acceso,
                EXISTS (
                    SELECT 1 FROM auth.usuario c
                    WHERE c.jefe_directo_id = u.usuario_id AND c.activo = TRUE
                ) AS es_jefe
            FROM auth.usuario u
            WHERE u.correo = $1`,
            correo,
        );

        if(user.length === 0) 
            throw new UnauthorizedException('Credenciales incorrectas. Por favor, verifica tu correo y contraseña');

        const usuario = user[0];

        if(!usuario.activo)
            throw new UnauthorizedException('Tu cuenta ha sido desactivada. Por favor, contacta al administrador');

        if(!usuario.acceso)
            throw new UnauthorizedException('No tienes acceso al sistema. Por favor, contacta al administrador');

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
            const { password, activo, acceso, ...rest } = usuario;
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
            es_jefe: user.es_jefe,
        };
        return {
            access_token: this.jwtService.sign(payload),
            usuario: {
                usuario_id: user.usuario_id,
                correo: user.correo,
                rol: user.rol,
                nombre: user.nombre,
                es_jefe: user.es_jefe,
            },
        };
    }
}
