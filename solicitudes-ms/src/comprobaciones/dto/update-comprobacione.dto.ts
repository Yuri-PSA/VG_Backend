import { PartialType } from '@nestjs/mapped-types';
import { CreateComprobacioneDto, FacturaDto } from './create-comprobacione.dto';
import { IsArray, IsDateString, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateComprobacioneDto extends PartialType(CreateComprobacioneDto) {
    @IsNotEmpty()
    @IsString()
    folio_comp!: string;

    @IsDateString()
    @IsNotEmpty()
    fecha_comp!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FacturaDto)
    facturas!: FacturaDto[];
}