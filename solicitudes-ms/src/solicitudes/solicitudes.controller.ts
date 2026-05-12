import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudeDto } from './dto/create-solicitude.dto';
import { UpdateSolicitudeDto } from './dto/update-solicitude.dto';

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
}
