import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudeDto } from './dto/create-solicitude.dto';
import { UpdateSolicitudeDto } from './dto/update-solicitude.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';


@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createSolicitudeDto: CreateSolicitudeDto, @Req() req) {
    // req.user contiene { usuario_id, correo, rol }
    return this.solicitudesService.create(createSolicitudeDto, req.user.usuario_id);
  }

  @Get('listar')
  @UseGuards(JwtAuthGuard)
  async listar(
    @Req() req,
    @Query('estado') estado?: string,
    @Query('folio') folio?: string,
    @Query('fechaIni') fechaIni?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('colaborador') colaborador?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('orden') orden?: string,
    @Query('ordenMonto') ordenMonto?: string,
  ){
    const userId = req.user.usuario_id;
    
    return this.solicitudesService.listarSolicitudes(
      userId,
      estado,
      folio,
      fechaIni,
      fechaFin,
      colaborador,
      limit ? parseInt(limit, 10) : 7,
      offset ? parseInt(offset, 10) : 0,
      orden || 'DESC',
      ordenMonto,
    );
  }

  @Patch('estado')
  @UseGuards(JwtAuthGuard)
  async updateState(
    @Req() req,
    @Body() body: { folio: string; accion: string; motivoRechazo?: string },
  ){
    const userId = req.user.usuario_id;
    return this.solicitudesService.updateSolicitud(
      userId, 
      body.folio, 
      body.accion, 
      body.motivoRechazo,
    );
  }

  @Get('detalle')
  @UseGuards(JwtAuthGuard)
  async obtenerDetalle(
    @Req() req,
    @Query('folio') folio: string,
  ){
    const userId = req.user.usuario_id;
    return this.solicitudesService.detalleSolicitud(userId, folio);
  }

  @Patch('cancelar')
  @UseGuards(JwtAuthGuard)
  async cancelarSolicitud(
    @Req() req,
    @Body() body: { folio: string },
  ){
    const userId = req.user.usuario_id;
    return this.solicitudesService.cancelarSolicitud(userId, body.folio);
  }

  @Patch('anticipo')
  @UseGuards(JwtAuthGuard)
  async gestionarAnticipo(
    @Req() req,
    @Body() body: { 
      folio: string; 
      fechaEntrega?: string; 
      fechaConfirmacion?: string; 
      rutaComprobante?: string; 
      noRecibido?: boolean;
    },
  ){
    const userId = req.user.usuario_id;
    
    return this.solicitudesService.gestionarAnticipo(
      userId,
      body.folio,
      body.fechaEntrega,
      body.fechaConfirmacion,
      body.rutaComprobante,
      body.noRecibido,
    );
  }

  @Patch('editar')
  @UseGuards(JwtAuthGuard)
  async editarSolicitud(
    @Req() req,
    @Body() editDto: UpdateSolicitudeDto,
  ){
    const userId = req.user.usuario_id;
    return this.solicitudesService.editarSolicitud(userId, editDto);
  }

  @Post('upload-comprobante')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadComprobante(@UploadedFile() file: Express.Multer.File){
    if(!file)
      throw new BadRequestException('No se ha enviado ningún archivo');

    // Construir la ruta relativa que se guardará en la BD
    const rutaRelativa = `uploads/comprobantes/${file.filename}`;
    return { ruta: rutaRelativa };
  }
}
