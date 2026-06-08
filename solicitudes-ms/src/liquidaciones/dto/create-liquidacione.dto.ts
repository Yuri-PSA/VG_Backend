import { IsInt, IsNotEmpty } from "class-validator";

export class CreateLiquidacioneDto {
    @IsInt()
    @IsNotEmpty()
    solicitud_id!: number;
}