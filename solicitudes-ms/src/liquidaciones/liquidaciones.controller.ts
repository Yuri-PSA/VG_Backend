import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';


@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly liquidacionesService: LiquidacionesService) {}

  @Get('listar')
  @UseGuards(JwtAuthGuard)
  async listar(
    @Req() req,
    @Query('estado') estado?: string,
    @Query('solicitud') solicitud?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('orden') orden?: string,
    @Query('ordenAnt') ordenAnt?: string,
    @Query('ordenCmp') ordenCmp?: string,
    @Query('ordenSaldo') ordenSaldo?: string,
    @Query('ordenAjuste') ordenAjuste?: string,
  ){
    const userId = req.user.usuario_id;

    return this.liquidacionesService.listarLiquid(
      userId,
      estado,
      solicitud,
      limit ? parseInt(limit, 10) : 7,
      offset ? parseInt(offset, 10) : 0,
      orden,
      ordenAnt,
      ordenCmp,
      ordenSaldo,
      ordenAjuste,
    );
  }

  @Post('upload/comprobante/liquidacion')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig('comprobantes/liquidaciones', 'liq')))
  async uploadLiquidacion(@UploadedFile() file: Express.Multer.File) {
    if(!file) throw new BadRequestException('No se ha enviado ningún archivo');
    const ruta = `uploads/comprobantes/liquidaciones/${file.filename}`;
    return { ruta };
  }

  @Patch('comprobante')
  @UseGuards(JwtAuthGuard)
  async gestionarLiquid(
    @Req() req,
    @Body() body: {
      solicitud: string;
      fechaPago?: string;
      fechaRecibido?: string;
      rutaComprobante?: string;
      noRecibido?: boolean;
    },
  ){
    const userId = req.user.usuario_id;

    return this.liquidacionesService.gestionarLiquid(
      userId,
      body.solicitud,
      body.fechaPago,
      body.fechaRecibido,
      body.rutaComprobante,
      body.noRecibido,
    );
  }

  @Get('detalle')
  @UseGuards(JwtAuthGuard)
  async obtenerDetalle(
    @Req() req,
    @Query('solicitud') solicitud: string,
  ){
    const userId = req.user.usuario_id;
    return this.liquidacionesService.detalleLiquidacion(userId, solicitud);
  }

  @Get('ajustes')
  @UseGuards(JwtAuthGuard)
  async obtenerAjuste(@Req() req){
    const userId = req.user.usuario_id;
    return this.liquidacionesService.obtenerAjuste(userId);
  }

  // Dashboard
  // colaborador
  @Get('dashboard/reem-dev')
  @UseGuards(JwtAuthGuard)
  async getCardLiquids(@Req() req){
    const userId = req.user.usuario_id;
    return this.liquidacionesService.getCardLiquids(userId);
  }

  // tesorero
  @Get('dashboard/liquidaciones')
  @UseGuards(JwtAuthGuard)
  async getAjustesMens(
    @Req() req, 
    @Query('year') year: number
  ){
    const userId = req.user.usuario_id;
    return this.liquidacionesService.getAjustesMens(userId, year);
  }

  @Get('dashboard/years-liq')
  @UseGuards(JwtAuthGuard)
  async getYearsTes(@Req() req){
    const userId = req.user.usuario_id;
    return this.liquidacionesService.getYearsTes(userId);
  }
}