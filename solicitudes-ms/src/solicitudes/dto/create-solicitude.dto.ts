import { IsInt, IsNotEmpty, IsString, IsIn, IsDateString, IsNumber } from 'class-validator';

export class CreateSolicitudeDto {
    @IsInt()
    @IsNotEmpty()
    usuario_id!: number;

    @IsDateString()
    @IsNotEmpty()
    inicio_viaje!: string;

    @IsDateString()
    @IsNotEmpty()
    fin_viaje!: string;

    @IsString()
    @IsNotEmpty()
    destino!: string;

    @IsString()
    @IsNotEmpty()
    motivo!: string;

    @IsNumber()
    @IsNotEmpty()
    monto_solicitado!: number;

    @IsString()
    @IsNotEmpty()
    monto_moneda!: string;

    @IsIn(['Transferencia', 'Efectivo'])
    @IsNotEmpty()
    forma_pago!: 'Transferencia' | 'Efectivo';
}