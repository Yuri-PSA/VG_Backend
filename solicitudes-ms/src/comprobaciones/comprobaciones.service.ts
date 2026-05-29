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
}
