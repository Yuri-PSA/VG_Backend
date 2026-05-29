import { PartialType } from '@nestjs/mapped-types';
import { CreateComprobacioneDto } from './create-comprobacione.dto';

export class UpdateComprobacioneDto extends PartialType(CreateComprobacioneDto) {}
