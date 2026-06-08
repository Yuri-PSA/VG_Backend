import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';

@Injectable()
export class LiquidacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarLiquid(
    userId: number,
    estado?: string,
    solicitud?: string,
    limit: number = 7,
    offset: number = 0,
    orden?: string,
    ordenAnt?: string,
    ordenCmp?: string,
    ordenSaldo?: string,
  ){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        folio_solicitud: string | null;
        total_autorizado: number | null;
        moneda_anticipo: string | null;
        total_comprobado: number | null;
        moneda_comprobacion: string | null;
        diferencia: number | null;
        tipo_ajuste: string | null;
        estado: string | null;
        paginas: bigint | null;
        liquidaciones_pendientes: bigint | null;
      }>
    >`
      SELECT * FROM core.sp_listar_liquidaciones(
        ${userId}::INT,
        ${estado || null}::VARCHAR,
        ${solicitud || null}::VARCHAR,
        ${limit}::INT,
        ${offset}::INT,
        ${orden || null}::VARCHAR,
        ${ordenAnt || null}::VARCHAR,
        ${ordenCmp || null}::VARCHAR,
        ${ordenSaldo || null}::VARCHAR
      )
    `;
    
    const firstRow = result[0];
    if(!firstRow || firstRow.paginas === null) {
      return {
        liquidaciones: [],
        paginacion: {
          totalPaginas: 0,
          paginaActual: 1,
        },
        pendientes: null,
        mensaje: 'No se encontraron resultados',
      };
    }

    return {
      liquidaciones: result.map(l => ({
        folio_solicitud: l.folio_solicitud,
        total_autorizado: l.total_autorizado,
        moneda_anticipo: l.moneda_anticipo,
        total_comprobado: l.total_comprobado,
        moneda_comprobacion: l.moneda_comprobacion,
        diferencia: l.diferencia,
        tipo_ajuste: l.tipo_ajuste,
        estado: l.estado,
      })),
      paginacion: {
        totalPaginas: Number(firstRow.paginas),
        paginaActual: Math.floor(offset / limit) + 1,
      },
      pendientes: firstRow.liquidaciones_pendientes ? Number(firstRow.liquidaciones_pendientes) : null,
    };
  }
}