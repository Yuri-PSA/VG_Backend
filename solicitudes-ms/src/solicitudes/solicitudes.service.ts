import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudeDto } from './dto/create-solicitude.dto';
import { UpdateSolicitudeDto } from './dto/update-solicitude.dto';

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
    ordenFinanza?: string,
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
        ${ordenMonto || null}::VARCHAR,
        ${ordenFinanza || null}::VARCHAR
      )`;

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
      )`;

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

  async getSolicitudesAprobadas(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string | null; folio_solicitud: string | null; monto_moneda: string | null }>
    >`
      SELECT * FROM core.sp_approved_requests(${userId}::INT)
    `;

    if(result.length > 0 && result[0].mensaje)
      throw new HttpException(result[0].mensaje, HttpStatus.BAD_REQUEST);

    return result
      .filter(r => r.folio_solicitud !== null && r.monto_moneda !== null)
      .map(r => ({
        folio: r.folio_solicitud,
        moneda: r.monto_moneda,
    }));
  }

  async getTipoCambio(moneda: string, fecha?: string){
    if(moneda === 'MXN')
      return { tipoCambio: 1.0000, moneda: 'MXN' };

    const BANXICO_TOKEN = process.env.BANXICO_TOKEN;
    if(!BANXICO_TOKEN)
      throw new HttpException('Token de Banxico no configurado', HttpStatus.INTERNAL_SERVER_ERROR);

    const BANXICO_SERIES: Record<string, string> = {
      USD: 'SF43718',
      EUR: 'SF46410',
      JPY: 'SF46406',
      GBP: 'SF46407',
      CAD: 'SF60632',
    };

    const serie = BANXICO_SERIES[moneda];
    if(!serie)
      throw new HttpException(
        `Moneda ${moneda} no disponible en Banxico`,
        HttpStatus.NOT_FOUND,
      );
    
    try {
      let url: string;

      if(fecha) {
        const fechaFin = fecha;
        const fechaIni = new Date(new Date(fecha).getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${serie}/datos/${fechaIni}/${fechaFin}`;
      } else
          url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${serie}/datos/oportuno`;
        
      const response = await fetch(url, {
        headers: { 'Bmx-Token': BANXICO_TOKEN } as HeadersInit,
      });


      if(!response.ok)
        throw new HttpException('Error al consultar Banxico', HttpStatus.BAD_GATEWAY);

      const data = await response.json();
      const datos = data.bmx.series[0].datos;

      if(!datos?.length)
            throw new HttpException('Sin datos para esa fecha', HttpStatus.NOT_FOUND);

      const ultimo = datos[datos.length - 1];

      return {
        tipoCambio: parseFloat(ultimo.dato),
        fecha: ultimo.fecha,
        moneda,
      };
    } catch(error) {
      if(error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getEstadoFinan(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        mensaje: string | null;
        estado_financiero: string | null;
      }>
    >`
      SELECT * FROM core.sp_obtener_financiero( ${userId}::INT )
    `;

    if(result.length > 0 && result[0].mensaje)
      throw new HttpException(result[0].mensaje, HttpStatus.BAD_REQUEST);

    return result
      .filter(r => r.estado_financiero !== null)
      .map(r => r.estado_financiero);
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
      WHERE tipo = 'Solicitud'
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
      WHERE tipo = 'Solicitud'
    `;

    return result.map(row => ({
      tipo: row.tipo,
      min_anio: Number(row.min_anio),
      max_anio: Number(row.max_anio)
    }));
  }

  async getMontosAprobados(userId: number, year: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        mes: number | null;
        monto: number | null;
        moneda: string | null;
      }>
    >`
      SELECT * FROM core.sp_totalapr_colab(
        ${userId}::INT,
        ${year}::INT
      )`;

    return result.map(row => ({
      mes: Number(row.mes),
      monto: row.monto ? Number(row.monto) : 0,
      moneda: row.moneda,
    }));
  }

  // jefes
  async getCantidadesJefe(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        estado: string | null;
        cantidad: bigint | null;
      }>
    >`
      SELECT * FROM core.sp_cantidad_sols_jefe( ${userId}::INT )
    `;

    return result.map(row => ({
      estado: row.estado,
      cantidad: row.cantidad ? Number(row.cantidad) : 0,
    }));
  }

  async getRangeYearsJefe(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        tipo: string | null;
        min_anio: number | null;
        max_anio: number | null;
      }>
    >`
      SELECT * FROM core.sp_rangeyears_jefe( ${userId}::INT )
    `;

    const rangos: { 
      enviadas?: { min: number; max: number }; 
      aprobadas?: { min: number; max: number } 
    } = {};

    for(const row of result) {
      if(row.tipo === 'Enviadas' && row.min_anio && row.max_anio)
        rangos.enviadas = { min: Number(row.min_anio), max: Number(row.max_anio) };

      else if(row.tipo === 'Aprobadas' && row.min_anio && row.max_anio)
        rangos.aprobadas = { min: Number(row.min_anio), max: Number(row.max_anio) };
    }

    return rangos;
  }

  async getTendMensuales(userId: number, year: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        mes: number | null;
        solicitudes: number | null;
      }>
    >`
      SELECT * FROM core.sp_tendencia_sols_jefe(
        ${userId}::INT,
        ${year}::INT 
      )`;
    
    return result.map(row => ({
      mes: Number(row.mes),
      solicitudes: row.solicitudes ? Number(row.solicitudes) : 0,
    }));
  }

  async getGastoMensual(userId: number, year: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        mes: number | null;
        monto: number | null;
        moneda: string | null;
      }>
    >`
      SELECT * FROM core.sp_gasto_jefe(
        ${userId}::INT,
        ${year}::INT
      )`;

    return result.map(row => ({
      mes: Number(row.mes),
      monto: row.monto ? Number(row.monto) : 0,
      moneda: row.moneda,
    }));
  }

  // tesoreros
  async getCantidadesTes(userId: number){
    const result = await this.prisma.$queryRaw<
      Array<{
        anticipos: bigint | null;
        comprobaciones: bigint | null;
        liquidaciones: bigint | null;
      }>
    >`
      SELECT * FROM core.sp_cantidad_cards_tes( ${userId}::INT )
    `;

    return result.map(row => ({
      anticipos: row.anticipos ? Number(row.anticipos) : 0,
      comprobaciones: row.comprobaciones ? Number(row.comprobaciones) : 0,
      liquidaciones: row.liquidaciones ? Number(row.liquidaciones) : 0
    }));
  }
}
