import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudeDto } from './dto/create-solicitude.dto';
import { UpdateSolicitudeDto } from './dto/update-solicitude.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class SolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSolicitudeDto: CreateSolicitudeDto, user_id: number){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string; enviado: boolean }>
    >`
      SELECT * FROM core.sp_crear_solicitud(
        ${user_id}::INT,
        ${createSolicitudeDto.inicio_viaje}::DATE,
        ${createSolicitudeDto.fin_viaje}::DATE,
        ${createSolicitudeDto.destino}::VARCHAR,
        ${createSolicitudeDto.motivo}::TEXT,
        ${createSolicitudeDto.monto_solicitado}::DECIMAL,
        ${createSolicitudeDto.monto_moneda}::VARCHAR,
        ${createSolicitudeDto.forma_pago}::VARCHAR,
        ${createSolicitudeDto.fecha_recepcion}::DATE
      )`;

      const respuesta = result[0];

      if(!respuesta.enviado)
        throw new HttpException(respuesta.mensaje, HttpStatus.BAD_REQUEST);

      return { message: respuesta.mensaje, success: respuesta.enviado };
  }

  async listarSolicitudes(
    userId: number,
    estado?: string,
    folio?: string,
    fechaIni?: string,
    fechaFin?: string,
    colaborador?: string,
    limit: number = 7,
    offset: number = 0,
    orden: string = 'ASC',
    ordenMonto?: string,
  ){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        folio_solicitud: string | null;
        nombre: string | null;
        inicio_viaje: Date | null;
        destino: string | null;
        monto: number | null;
        moneda: string | null;
        forma_pago: string | null;
        estado: string | null;
        estado_financiero: string | null;
        fecha_entrega: Date | null;
        paginas: bigint | null;
        solicitudes_pendientes: bigint | null;
        solicitudes_sin_entrega: bigint | null;
        nombre_completo: string | null;
      }>
    >`
      SELECT * FROM core.sp_listar_sols(
        ${userId}::INT,
        ${estado || null}::VARCHAR,
        ${folio || null}::VARCHAR,
        ${fechaIni || null}::DATE,
        ${fechaFin || null}::DATE,
        ${colaborador || null}::VARCHAR,
        ${limit}::INT,
        ${offset}::INT,
        ${orden}::VARCHAR,
        ${ordenMonto || null}::VARCHAR
      )
    `;

    // Información de paginación y conteos
    const firstRow = result[0];
    if(!firstRow || firstRow.paginas === null) {
      return {
        solicitudes: [],
        paginacion: {
          totalPaginas: 0,
          paginaActual: 1,
        },
        pendientes: null,
        sinEntrega: null,
        mensaje: 'No se encontraron resultados',
      };
    }

    return {
      solicitudes: result.map(r => ({
        folio: r.folio_solicitud,
        nombre: r.nombre,
        inicio_viaje: r.inicio_viaje,
        destino: r.destino,
        monto: r.monto,
        moneda: r.moneda,
        forma_pago: r.forma_pago,
        estado: r.estado,
        estado_financiero: r.estado_financiero,
        fecha_entrega: r.fecha_entrega,
        nombre_completo: r.nombre_completo,
      })),
      paginacion: {
        totalPaginas: Number(firstRow.paginas),
        paginaActual: Math.floor(offset / limit) + 1,
      },
      pendientes: firstRow.solicitudes_pendientes ? Number(firstRow.solicitudes_pendientes) : null,
      sinEntrega: firstRow.solicitudes_sin_entrega ? Number(firstRow.solicitudes_sin_entrega) : null,
    };
  }

  async updateSolicitud(
    userId: number,
    folio: string,
    accion: string,
    motivoRechazo?: string,
  ){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string | null; solicitud: number | null; nuevo_estado: string | null }>
    >`
      SELECT * FROM core.sp_actualizar_estado_sol(
        ${userId}::INT,
        ${folio}::VARCHAR,
        ${accion}::VARCHAR,
        ${motivoRechazo || null}::TEXT
      )
    `;

    const row = result[0];

    if(!row || row.mensaje)
      throw new HttpException(row?.mensaje || 'Error al actualizar el estado de la solicitud', HttpStatus.BAD_REQUEST);

    return { solicitud_id: row.solicitud, nuevo_estado: row.nuevo_estado };
  }

  async detalleSolicitud(userId: number, folio: string){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        colaborador: string | null;
        folio_solicitud: string | null;
        fecha_recepcion: string | null;
        inicio_viaje: string | null;
        fin_viaje: string | null;
        destino: string | null;
        motivo: string | null;
        monto_solicitado: number | null;
        monto_moneda: string | null;
        forma_pago: string | null;
        estado: string | null;
        estado_financiero: string | null;
        fecha_entrega: string | null;
        fecha_confirmacion: string | null;
        ruta_comprobante: string | null;
        fecha_actualizacion: string | null;
      }>
    >`
      SELECT * FROM core.sp_obtener_sol(
        ${userId}::INT,
        ${folio}::VARCHAR
      )
    `;

    const row = result[0];
    if(!row || row.mensaje)
      throw new HttpException(row?.mensaje || 'No se encontró la solicitud', HttpStatus.NOT_FOUND);

    return {
      colaborador: row.colaborador,
      folio: row.folio_solicitud,
      fecha_recepcion: row.fecha_recepcion,
      inicio_viaje: row.inicio_viaje,
      fin_viaje: row.fin_viaje,
      destino: row.destino,
      motivo: row.motivo,
      monto_solicitado: row.monto_solicitado,
      monto_moneda: row.monto_moneda,
      forma_pago: row.forma_pago,
      estado: row.estado,
      estado_financiero: row.estado_financiero,
      fecha_entrega: row.fecha_entrega,
      fecha_confirmacion: row.fecha_confirmacion,
      ruta_comprobante: row.ruta_comprobante,
      fecha_actualizacion: row.fecha_actualizacion,
    };
  }

  async cancelarSolicitud(userId: number, folio: string){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string | null }>
    >`
      SELECT mensaje FROM core.sp_cancel(
        ${userId}::INT,
        ${folio}::VARCHAR
      )
    `;

    const row = result[0];
    if(!row || row.mensaje)
      throw new HttpException(row?.mensaje || 'No se encontró la solicitud', HttpStatus.NOT_FOUND);

    return { mensaje: row.mensaje };
  }

  async gestionarAnticipo(
    userId: number,
    folio: string,
    fechaEntrega?: string,
    fechaConfirmacion?: string,
    rutaComprobante?: string,
    noRecibido?: boolean,
  ){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string | null }>
    >`
      SELECT mensaje FROM core.sp_anticipo(
        ${userId}::INT,
        ${folio}::VARCHAR,
        ${fechaEntrega || null}::DATE,
        ${fechaConfirmacion || null}::DATE,
        ${rutaComprobante || null}::VARCHAR,
        ${noRecibido ?? null}::BOOLEAN
      )`;
      
    const row = result[0];
    if(row?.mensaje)
      throw new HttpException(row.mensaje, HttpStatus.BAD_REQUEST);
    
    return { mensaje: row.mensaje };
  }

  async editarSolicitud(userId: number, dto: UpdateSolicitudeDto){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string | null }>
    >`
      SELECT mensaje FROM core.sp_editar_solicitud(
        ${userId}::INT,
        ${dto.folio}::VARCHAR,
        ${dto.inicio_viaje}::DATE,
        ${dto.fin_viaje}::DATE,
        ${dto.destino}::VARCHAR,
        ${dto.motivo}::TEXT,
        ${dto.monto_solicitado}::DECIMAL,
        ${dto.monto_moneda}::VARCHAR,
        ${dto.forma_pago}::VARCHAR
      )
    `;

    const row = result[0];
    if(row?.mensaje)
      throw new HttpException(row.mensaje, HttpStatus.BAD_REQUEST);

    return { mensaje: row.mensaje };
  }
}
