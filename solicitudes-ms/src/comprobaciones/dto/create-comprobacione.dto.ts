import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class FacturaDto {
    @IsNotEmpty()
    @IsString()
    folio_factura!: string;

    @IsDateString() 
    @IsNotEmpty()
    fecha_factura!: string;

    @IsNotEmpty() 
    @IsString()
    proveedor!: string;

    @IsNotEmpty() 
    @IsString()
    concepto!: string;

    @IsNotEmpty() 
    @IsString()
    descripcion!: string;

    @IsNumber() 
    @IsNotEmpty()
    importe!: number;

    @IsNumber() 
    @IsNotEmpty()
    iva!: number;

    @IsNumber()
    otros_montos: number = 0;

    @IsNumber() 
    @IsNotEmpty()
    total_moneda!: number;

    @IsNotEmpty() 
    @IsString()
    tipo_moneda!: string;

    @IsOptional() 
    @IsString()
    ruta_xml?: string;

    @IsOptional() 
    @IsString()
    ruta_pdf?: string;

    @IsOptional() 
    @IsString()
    ruta_jpg?: string;

    @IsOptional() 
    @IsNumber()
    tipo_cambio?: number;
}


export class CreateComprobacioneDto {
    @IsNotEmpty()
    @IsString()
    folio_solicitud!: string;

    @IsDateString() @IsNotEmpty()
    fecha_comprobacion!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FacturaDto)
    facturas!: FacturaDto[];
}