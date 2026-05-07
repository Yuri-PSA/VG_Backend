import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudeDto } from './dto/create-solicitude.dto';
import { UpdateSolicitudeDto } from './dto/update-solicitude.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class SolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSolicitudeDto: CreateSolicitudeDto) {
    const result = await this.prisma.$queryRaw<
      Array<{ mensaje: string; enviado: boolean }>
    >`
      SELECT * FROM sp_crear_solicitud(
        ${createSolicitudeDto.usuario_id}::INT,
        ${createSolicitudeDto.inicio_viaje}::DATE,
        ${createSolicitudeDto.fin_viaje}::DATE,
        ${createSolicitudeDto.destino}::VARCHAR,
        ${createSolicitudeDto.motivo}::TEXT,
        ${createSolicitudeDto.monto_solicitado}::DECIMAL(10,2),
        ${createSolicitudeDto.monto_moneda}::VARCHAR,
        ${createSolicitudeDto.forma_pago}::VARCHAR
      )`;

      const respuesta = result[0];

      if(!respuesta.enviado)
        throw new HttpException(respuesta.mensaje, HttpStatus.BAD_REQUEST);

      return { message: respuesta.mensaje, success: respuesta.enviado };
  }

  async findAll() {
    return this.prisma.solicitud.findMany();
  }

  async findOne(solicitud_id: number) {
    return this.prisma.solicitud.findUnique({
      where: { solicitud_id },
    });
  }

  async update(solicitud_id: number, updateSolicitudeDto: UpdateSolicitudeDto) {
    return this.prisma.solicitud.update({
      where: { solicitud_id },
      data: updateSolicitudeDto,
    });
  }

  async remove(solicitud_id: number) {
    return this.prisma.solicitud.delete({
      where: { solicitud_id },
    });
  }
}
