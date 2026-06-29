import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ComprobacionesService } from './comprobaciones.service';
import { CreateComprobacioneDto } from './dto/create-comprobacione.dto';
import { UpdateComprobacioneDto } from './dto/update-comprobacione.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';


@Controller('comprobaciones')
export class ComprobacionesController {
  constructor(private readonly comprobacionesService: ComprobacionesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createComprobacioneDto: CreateComprobacioneDto, @Req() req){
    return this.comprobacionesService.create(createComprobacioneDto, req.user.usuario_id);
  }

  // Factura PDF
  @Post('upload/factura/pdf')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig('facturas/pdf', 'pdf')))
  async uploadFacturaPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se ha enviado ningún archivo');
    const ruta = `uploads/facturas/pdf/${file.filename}`;
    return { ruta };
  }

  // Factura XML
  @Post('upload/factura/xml')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig('facturas/xml', 'xml')))
  async uploadFacturaXml(@UploadedFile() file: Express.Multer.File) {
    if(!file) throw new BadRequestException('No se ha enviado ningún archivo'); 
    const ruta = `uploads/facturas/xml/${file.filename}`;
    return { ruta };
  }

  // Factura Imagen
  @Post('upload/factura/img')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig('facturas/img', 'img')))
  async uploadFacturaImg(@UploadedFile() file: Express.Multer.File) {
    if(!file) throw new BadRequestException('No se ha enviado ningún archivo');
    const ruta = `uploads/facturas/img/${file.filename}`;
    return { ruta };
  }

  @Get('listar')
  @UseGuards(JwtAuthGuard)
  async listar(
    @Req() req,
    @Query('vista') vista?: string,
    @Query('estado') estado?: string,
    @Query('folio') folio?: string,
    @Query('fechaIni') fechaIni?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('solicitud') solicitud?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('orden') orden?: string,
    @Query('ordenSols') ordenSols?: string,
    @Query('ordenTotal') ordenTotal?: string,
    @Query('ordenSaldo') ordenSaldo?: string,
  ){
    const userId = req.user.usuario_id;

    return this.comprobacionesService.listarComprobaciones(
      userId,
      vista,
      estado,
      folio,
      fechaIni,
      fechaFin,
      solicitud,
      limit ? parseInt(limit, 10) : 7,
      offset ? parseInt(offset, 10) : 0,
      orden,
      ordenSols,
      ordenTotal,
      ordenSaldo,
    );
  }

  @Patch('estado')
  @UseGuards(JwtAuthGuard)
  async updateState(
    @Req() req,
    @Body() body: { folio: string; accion: string; motivoRechazo?: string },
  ){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.updateComprobacion(
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
    @Query('vista') vista?: string,
  ){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.detalleComprobacion(userId, folio, vista);
  }

  @Patch('editar')
  @UseGuards(JwtAuthGuard)
  async editarComp(
    @Req() req,
    @Body() dto: UpdateComprobacioneDto,
  ){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.editarComp(userId, dto);
  }

  // Dashboard
  @Get('dashboard/estados')
  @UseGuards(JwtAuthGuard)
  async getEstadosMensuales(
    @Req() req,
    @Query('vista') vista?: string
  ){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.getEstadosMensuales(userId, vista);
  }

  // colaboradores
  @Get('dashboard/years')
  @UseGuards(JwtAuthGuard)
  async getRangeYears(@Req() req){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.getRangeYears(userId);
  }

  @Get('dashboard/comprobado')
  @UseGuards(JwtAuthGuard)
  async getTotalComprobado(
    @Req() req, 
    @Query('year') year: number
  ){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.getTotalComprobado(userId, year);
  }

  // tesoreros
  @Get('dashboard/years-tes')
  @UseGuards(JwtAuthGuard)
  async getRangeYearsTes(@Req() req){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.getRangeYearsTes(userId);
  }

  @Get('dashboard/comprobado-tes')
  @UseGuards(JwtAuthGuard)
  async getComprobadoTes(
    @Req() req, 
    @Query('year') year: number
  ){
    const userId = req.user.usuario_id;
    return this.comprobacionesService.getComprobadoTes(userId, year);
  }
}