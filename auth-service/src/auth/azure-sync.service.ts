import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfidentialClientApplication } from '@azure/msal-node';

@Injectable()
export class AzureSyncService implements OnModuleInit {
    private readonly logger = new Logger(AzureSyncService.name);
    private msalClient!: ConfidentialClientApplication;

    constructor(private readonly prisma: PrismaService) {}

    onModuleInit() {
        this.msalClient = new ConfidentialClientApplication({
            auth: {
                clientId: process.env.AZURE_CLIENT_ID!,
                clientSecret: process.env.AZURE_CLIENT_SECRET!,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
            },
        });
        this.logger.log('AzureSyncService inicializado correctamente');
    }

    // ── Token de acceso ───────────────────────────────────────
    private async getAccessToken(): Promise<string> {
        const result = await this.msalClient.acquireTokenByClientCredential({
            scopes: ['https://graph.microsoft.com/.default'],
        });
        if(!result?.accessToken)
            throw new Error('No se pudo obtener token de Azure');
        return result.accessToken;
    }

    // ── Llamada a Graph API con paginación ────────────────────
    private async graphGet(url: string, token: string): Promise<any[]> {
        const items: any[] = [];
        let nextUrl: string | null = url;

        while(nextUrl) {
            const res = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(!res.ok) throw new Error(`Graph API error: ${res.status}`);
            const data = await res.json();
            items.push(...(data.value ?? []));
            nextUrl = data['@odata.nextLink'] ?? null;
        }
        return items;
    }

    // ── Sincronización principal ──────────────────────────────
    @Cron(CronExpression.EVERY_6_HOURS)
    async syncUsuarios() {
        this.logger.log('Iniciando sincronización con Azure AD...');

        try {
            const token = await this.getAccessToken();

            // Usuarios con los campos necesarios
            const azureUsers = await this.graphGet(
                `https://graph.microsoft.com/v1.0/users` +
                `?$select=id,givenName,surname,mail,department,jobTitle,accountEnabled,createdDateTime,manager` +
                `&$expand=manager($select=id,mail)` +
                `&$top=999`,
                token
            );

            this.logger.log(`Usuarios encontrados en Azure: ${azureUsers.length}`);

            // Usuarios actuales en BD (por correo)
            const usuariosBD = await this.prisma.$queryRaw<
                Array<{ 
                    usuario_id: number; 
                    correo: string; 
                    activo: boolean 
                }>
            >`
                SELECT usuario_id, correo, activo FROM auth.usuario
            `;

            const correosBD = new Map(usuariosBD.map(u => [u.correo, u]));

            // Procesar cada usuario de Azure
            for(const azUser of azureUsers) {
                const correo = azUser.mail;
                if(!correo) continue;

                const nombre = azUser.givenName   || '';
                const apellidos = azUser.surname      || '';
                const depto = azUser.department   || '';
                const activo = azUser.accountEnabled ?? true;

                const existente = correosBD.get(correo);

                if(existente) {
                    // Actualizar datos
                    await this.prisma.$executeRaw`
                        UPDATE auth.usuario SET
                            nombre = ${nombre},
                            apellidos = ${apellidos},
                            departamento = ${depto},
                            activo = ${activo}
                        WHERE correo = ${correo}
                    `;
                } else {
                    // Insertar nuevo usuario sin rol
                    await this.prisma.$executeRaw`
                        INSERT INTO auth.usuario
                            (nombre, apellidos, correo, password, rol, departamento, activo, fecha_creacion)
                        VALUES (
                            ${nombre},
                            ${apellidos},
                            ${correo},
                            NULL,
                            'Colaborador',
                            ${depto},
                            ${activo},
                            NOW()
                        )
                    `;
                    this.logger.log(`Nuevo usuario creado: ${correo}`);
                }
            }

            // Actualizar jefe_directo_id
            for(const azUser of azureUsers) {
                const correo = azUser.mail;
                const correoManager = azUser.manager?.mail;
                if(!correo || !correoManager) continue;

                await this.prisma.$executeRaw`
                    UPDATE auth.usuario u
                    SET jefe_directo_id = (
                        SELECT usuario_id FROM auth.usuario
                        WHERE correo = ${correoManager}
                        LIMIT 1
                    )
                    WHERE u.correo = ${correo}
                        AND u.jefe_directo_id IS NULL
                `;
            }

            // Desactivar usuarios que ya no están en Azure
            const correosAzure = new Set(
                azureUsers.map(u => u.mail).filter(Boolean)
            );
            for(const [correo, usuario] of correosBD) {
                if(!correosAzure.has(correo) && usuario.activo) {
                    await this.prisma.$executeRaw`
                        UPDATE auth.usuario
                        SET activo = false
                        WHERE correo = ${correo}
                    `;
                    this.logger.log(`Usuario desactivado: ${correo}`);
                }
            }

            this.logger.log('Sincronización completada exitosamente');
        } catch(error) {
            if(error instanceof Error)
                this.logger.error('Error en sincronización con Azure AD:', error.message);
            else
                this.logger.error('Error en sincronización con Azure AD:', String(error));
        }
    }

    // Sync manual desde el controlador
    async syncManual() {
        return this.syncUsuarios();
    }
}