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
        ${createSolicitudeDto.forma_pago}::VARCHAR
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
}
