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
    ordenAjuste?: string,
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
        ${ordenSaldo || null}::VARCHAR,
        ${ordenAjuste || null}::VARCHAR
      )`;
    
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

  async gestionarLiquid(
    userId: number,
    solicitud: string,
    fechaPago?: string,
    fechaRecibido?: string,
    rutaComprobante?: string,
    noRecibido?: boolean
  ){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string | null }>
    >`
      SELECT mensaje FROM core.sp_liquidacion(
        ${userId}::INT,
        ${solicitud}::VARCHAR,
        ${fechaPago || null}::DATE,
        ${fechaRecibido || null}::DATE,
        ${rutaComprobante || null}::VARCHAR,
        ${noRecibido ?? null}::BOOLEAN
      )`;

    const row = result[0];
    if(row?.mensaje)
      throw new HttpException(row.mensaje, HttpStatus.BAD_REQUEST);

    return { mensaje: row.mensaje };
  }

  async detalleLiquidacion(userId: number, solicitud: string){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        total_autorizado: number | null;
        moneda_anticipo: string | null;
        total_comprobado: number | null;
        moneda_comprobacion: string | null;
        diferencia: number | null;
        tipo_ajuste: string | null;
        estado: string | null;
        fecha_pago: string | null;
        fecha_recibido: string | null;
        ruta_comprobacion: string | null;
      }>
    >`
      SELECT * FROM core.sp_obtener_liq(
        ${userId}::INT,
        ${solicitud}::VARCHAR
      )`;

    const row = result[0];
    if(!row || row.mensaje)
      throw new HttpException(row?.mensaje || 'No se encontró la liquidación', HttpStatus.NOT_FOUND);

    return {
      total_autorizado: row.total_autorizado,
      moneda_anticipo: row.moneda_anticipo,
      total_comprobado: row.total_comprobado,
      moneda_comprobacion: row.moneda_comprobacion,
      diferencia: row.diferencia,
      tipo_ajuste: row.tipo_ajuste,
      estado: row.estado,
      fecha_pago: row.fecha_pago,
      fecha_recibido: row.fecha_recibido,
      ruta_comprobacion: row.ruta_comprobacion,
    };
  }

  async obtenerAjuste(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        tipo_ajuste: string | null;
      }>
    >`
      SELECT * FROM core.sp_obtener_ajuste( ${userId}::INT )
    `;

    if(result.length > 0 && result[0].mensaje)
      throw new HttpException(result[0].mensaje, HttpStatus.BAD_REQUEST);

    return result
      .filter(r => r.tipo_ajuste !== null)
      .map(r => r.tipo_ajuste);
  }

  // Dashboard
  // colaboradores
  async getCardLiquids(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        reembolsos: number | null;
        devoluciones: number | null;
      }>
    >`
      SELECT * FROM core.sp_cards_rd( ${userId}::INT )
    `;

    return result.map(row => ({
      reembolsos: row.reembolsos ? Number(row.reembolsos) : 0,
      devoluciones: row.devoluciones ? Number(row.devoluciones) : 0,
    }));
  }

  // tesorero
  async getAjustesMens(userId: number, year: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        mes: number | null;
        devoluciones: number | null;
        reembolsos: number | null;
      }>
    >`
      SELECT * FROM core.sp_liqmxn_tes( 
        ${userId}::INT, 
        ${year}::INT 
      )`;

    const data = result.filter(r => r.mes !== null);

    if(data.length === 0)
      return [];

    return data.map(r => ({
      mes: Number(r.mes),
      devoluciones: Number(r.devoluciones),
      reembolsos: Number(r.reembolsos),
    }));
  }

  async getYearsTes(userId){
    const result = await this.prisma.$queryRaw<
      Array<{
        min_anio: number | null;
        max_anio: number | null;
      }>
    >`
      SELECT * FROM core.sp_rangeyears_liq_tes( ${userId}::INT )
    `;

    return result.map(row => ({
      min_anio: Number(row.min_anio),
      max_anio: Number(row.max_anio)
    }));
  }
}