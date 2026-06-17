import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComprobacioneDto } from './dto/create-comprobacione.dto';
import { UpdateComprobacioneDto } from './dto/update-comprobacione.dto';

@Injectable()
export class ComprobacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createComprobacioneDto: CreateComprobacioneDto, user_id: number){
    const facturasJson = JSON.stringify(createComprobacioneDto.facturas);

    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string; enviado: boolean }>
    >`
      SELECT * FROM core.sp_crear_comprobacion(
        ${user_id}::INT,
        ${createComprobacioneDto.folio_solicitud}::VARCHAR,
        ${createComprobacioneDto.fecha_comprobacion}::DATE,
        ${facturasJson}::JSONB
      )
    `;

    const respuesta = result[0];
    if(!respuesta.enviado)
      throw new HttpException(respuesta.mensaje, HttpStatus.BAD_REQUEST);

    return { message: respuesta.mensaje, success: respuesta.enviado };
  }

  async listarComprobaciones(
    userId: number,
    estado?: string,
    folio?: string,
    fechaIni?: string,
    fechaFin?: string,
    solicitud?: string,
    limit: number = 7,
    offset: number = 0,
    orden?: string,
    ordenSols?: string,
    ordenTotal?: string,
    ordenSaldo?: string,
  ){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        folio_comprobacion: string | null;
        folio_solicitud: string | null;
        fecha_comprobacion: Date | null;
        total: number | null;
        total_moneda: string | null;
        saldo: number | null;
        saldo_moneda: string | null;
        estado: string | null;
        paginas: bigint | null;
        comprobaciones_pendientes: bigint | null;
      }>
    >`
      SELECT * FROM core.sp_listar_comps(
        ${userId}::INT,
        ${estado || null}::VARCHAR,
        ${folio || null}::VARCHAR,
        ${fechaIni || null}::DATE,
        ${fechaFin || null}::DATE,
        ${solicitud || null}::VARCHAR,
        ${limit}::INT,
        ${offset}::INT,
        ${orden || null}::VARCHAR,
        ${ordenSols || null}::VARCHAR,
        ${ordenTotal || null}::VARCHAR,
        ${ordenSaldo || null}::VARCHAR
      )
    `;

    const firstRow = result[0];
    if(!firstRow || firstRow.paginas === null) {
      return {
        comprobaciones: [],
        paginacion: { 
          totalPaginas: 0, 
          paginaActual: 1 
        },
        pendientes: null,
        mensaje: 'No se encontraron resultados',
      };
    }

    return {
      comprobaciones: result.map(r => ({
        folio: r.folio_comprobacion,
        solicitud: r.folio_solicitud,
        fecha_comprobacion: r.fecha_comprobacion,
        total: r.total,
        total_moneda: r.total_moneda,
        saldo: r.saldo,
        saldo_moneda: r.saldo_moneda,
        estado: r.estado,
      })),
      paginacion: {
        totalPaginas: Number(firstRow.paginas),
        paginaActual: Math.floor(offset / limit) + 1,
      },
      pendientes: firstRow.comprobaciones_pendientes
        ? Number(firstRow.comprobaciones_pendientes)
        : null,
    };
  }

  async updateComprobacion(
    userId: number,
    folio: string,
    accion: string,
    motivoRechazo?: string,
  ){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string | null; comprobacion: number | null; nuevo_estado: string | null }>
    >`
      SELECT * FROM core.sp_actualizar_estado_cmp(
        ${userId}::INT,
        ${folio}::VARCHAR,
        ${accion}::VARCHAR,
        ${motivoRechazo || null}::TEXT
      )
    `;

    const row = result[0];

    if(!row || row.mensaje)
      throw new HttpException(row?.mensaje || 'Error al actualizar el estado de la comprobación', HttpStatus.BAD_REQUEST);

    return { comprobacion_id: row.comprobacion, nuevo_estado: row.nuevo_estado };
  }

  async detalleComprobacion(userId: number, folio: string){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        monto_solicitado: number | null;
        folio_comprobacion: string | null;
        fecha_comprobacion: string | null;
        total_importe: number | null;
        total_iva: number | null;
        total_otros: number | null;
        total: number | null;
        total_moneda: string | null;
        saldo: number | null;
        saldo_moneda: string | null;
        estado: string | null;
        fecha_actualizacion: string | null;
        folio_factura: string | null;
        fecha_factura: string | null;
        proveedor: string | null;
        concepto: string | null;
        descripcion: string | null;
        importe: number | null;
        iva: number | null;
        otros_montos: number | null;
        total_factura: number | null;
        tipo_moneda: string | null;
        ruta_pdf: string | null;
        ruta_xml: string | null;
        ruta_jpg: string | null;
        moneda_tc: string | null;
        tipo_cambio: number | null;
      }>
    >`
      SELECT * FROM core.sp_obtener_cmp(
        ${userId}::INT,
        ${folio}::VARCHAR
      )
    `;

    if(result.length === 0)
      throw new HttpException('No se encontró la comprobación', HttpStatus.NOT_FOUND);

    const firstRow = result[0];
    if(firstRow.mensaje)
      throw new HttpException(firstRow.mensaje, HttpStatus.BAD_REQUEST);

    // Datos generales (primera fila)
    const comprobacion = {
      anticipo: firstRow.monto_solicitado,
      folio: firstRow.folio_comprobacion,
      fecha_comprobacion: firstRow.fecha_comprobacion,
      total_importe: firstRow.total_importe,
      total_iva: firstRow.total_iva,
      total_otros: firstRow.total_otros,
      total: firstRow.total,
      total_moneda: firstRow.total_moneda,
      saldo: firstRow.saldo,
      saldo_moneda: firstRow.saldo_moneda,
      estado: firstRow.estado,
      fecha_actualizacion: firstRow.fecha_actualizacion,
    };

    // Facturas
    const facturas = result.map(row => ({
      folio_factura: row.folio_factura,
      fecha_factura: row.fecha_factura,
      proveedor: row.proveedor,
      concepto: row.concepto,
      descripcion: row.descripcion,
      importe: row.importe,
      iva: row.iva,
      otros_montos: row.otros_montos,
      total_factura: row.total_factura,
      tipo_moneda: row.tipo_moneda,
      ruta_pdf: row.ruta_pdf,
      ruta_xml: row.ruta_xml,
      ruta_jpg: row.ruta_jpg,
      tipo_cambio: {
        moneda: row.moneda_tc,
        tipo_cambio: row.tipo_cambio,
      },
    }));

    return { comprobacion, facturas };
  }

  // Dashboard
  async getEstadosMensuales(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        tipo: string | null;
        anio: number | null;
        mes: number | null;
        pendientes: bigint | null;
        aprobadas: bigint | null;
        rechazadas: bigint | null;
        canceladas: bigint | null;
        total: bigint | null;
      }>
    >`
      SELECT * FROM core.sp_estados_mensuales( ${userId}::INT )
      WHERE tipo = 'Comprobación'
    `;

    return result.map(row => ({
      tipo: row.tipo,
      anio: Number(row.anio),
      mes: Number(row.mes),
      pendientes: row.pendientes ? Number(row.pendientes) : 0,
      aprobadas: row.aprobadas ? Number(row.aprobadas) : 0,
      rechazadas: row.rechazadas ? Number(row.rechazadas) : 0,
      canceladas: row.canceladas ? Number(row.canceladas) : 0,
      total: row.total ? Number(row.total) : 0
    }));
  }

  // colaboradores
  async getRangeYears(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        tipo: string | null;
        min_anio: number | null;
        max_anio: number | null;
      }>
    >`
      SELECT * FROM core.sp_rangeyears_colab( ${userId}::INT )
      WHERE tipo = 'Comprobación'
    `;

    return result.map(row => ({
      tipo: row.tipo,
      min_anio: Number(row.min_anio),
      max_anio: Number(row.max_anio)
    }));
  }

  async getTotalComprobado(userId: number, year: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        mes: number | null;
        total_comprobado: number | null;
      }>
    >`
      SELECT * FROM core.sp_totalcomp_colab( 
        ${userId}::INT, 
        ${year}::INT 
      )`;

    return result.map(row => ({
      mes: Number(row.mes),
      total_comprobado: row.total_comprobado ? Number(row.total_comprobado) : 0,
    }));
  }

  // tesoreros
  async getRangeYearsTes(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        tipo: string | null;
        min_anio: number | null;
        max_anio: number | null;
      }>
    >`
      SELECT * FROM core.sp_rangeyears_tes( ${userId}::INT )
      WHERE tipo = 'Comprobación'
    `;

    return result.map(row => ({
      tipo: row.tipo,
      min_anio: Number(row.min_anio),
      max_anio: Number(row.max_anio)
    }));
  }
}