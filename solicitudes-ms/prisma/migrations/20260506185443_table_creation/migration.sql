-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('Transferencia', 'Efectivo');

-- CreateEnum
CREATE TYPE "EstadoSol" AS ENUM ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoFinanciero" AS ENUM ('Pendiente', 'Liquidada');

-- CreateEnum
CREATE TYPE "EstadoCmp" AS ENUM ('Pendiente', 'Aprobada', 'Rechazada');

-- CreateEnum
CREATE TYPE "Acciones" AS ENUM ('Aprobar', 'Rechazar');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('Solicitud', 'Comprobación', 'Anticipo');

-- CreateEnum
CREATE TYPE "EventoNotificacion" AS ENUM ('Aprobada', 'Rechazada', 'Enviada', 'Cancelada', 'Modificada', 'Vencida', 'Recordatorio', 'Liquidada');

-- CreateEnum
CREATE TYPE "TipoAjuste" AS ENUM ('Devolución', 'Reembolso', 'Sin_diferencia');

-- CreateEnum
CREATE TYPE "EstadoLiquidacion" AS ENUM ('Pendiente', 'Pagado', 'Devuelto', 'Saldado');

-- CreateTable
CREATE TABLE "SOLICITUD" (
    "solicitud_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "folio_solicitud" TEXT NOT NULL,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inicio_viaje" TIMESTAMP(3) NOT NULL,
    "fin_viaje" TIMESTAMP(3) NOT NULL,
    "destino" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "monto_solicitado" DECIMAL(10,2) NOT NULL,
    "monto_moneda" TEXT NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "estado" "EstadoSol" NOT NULL DEFAULT 'Pendiente',
    "estado_financiero" "EstadoFinanciero",
    "fecha_entrega" TIMESTAMP(3),
    "fecha_confirmacion" TIMESTAMP(3),
    "ruta_comprobante" TEXT,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOLICITUD_pkey" PRIMARY KEY ("solicitud_id")
);

-- CreateTable
CREATE TABLE "COMPROBACION" (
    "comprobacion_id" SERIAL NOT NULL,
    "solicitud_id" INTEGER NOT NULL,
    "folio_comprobacion" TEXT NOT NULL,
    "fecha_comprobacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_importe" DECIMAL(10,2) NOT NULL,
    "total_iva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "total_moneda" TEXT NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "saldo_moneda" TEXT NOT NULL,
    "estado" "EstadoCmp" NOT NULL DEFAULT 'Pendiente',
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "COMPROBACION_pkey" PRIMARY KEY ("comprobacion_id")
);

-- CreateTable
CREATE TABLE "FACTURA" (
    "factura_id" SERIAL NOT NULL,
    "comprobacion_id" INTEGER NOT NULL,
    "folio_factura" TEXT NOT NULL,
    "fecha_factura" TIMESTAMP(3) NOT NULL,
    "proveedor" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(10,2) NOT NULL,
    "otros_montos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "total_moneda" DECIMAL(10,2) NOT NULL,
    "tipo_moneda" TEXT NOT NULL,
    "ruta_xml" TEXT,
    "ruta_pdf" TEXT,
    "ruta_jpg" TEXT,

    CONSTRAINT "FACTURA_pkey" PRIMARY KEY ("factura_id")
);

-- CreateTable
CREATE TABLE "TIPOS_CAMBIO" (
    "tipos_cambio_id" SERIAL NOT NULL,
    "factura_id" INTEGER NOT NULL,
    "fecha_tipo_cambio" TIMESTAMP(3) NOT NULL,
    "moneda" TEXT NOT NULL,
    "tipo_cambio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TIPOS_CAMBIO_pkey" PRIMARY KEY ("tipos_cambio_id")
);

-- CreateTable
CREATE TABLE "APROBACION" (
    "aprobacion_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "solicitud_id" INTEGER,
    "comprobacion_id" INTEGER,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" "Acciones" NOT NULL,
    "motivo_rechazo" TEXT,

    CONSTRAINT "APROBACION_pkey" PRIMARY KEY ("aprobacion_id")
);

-- CreateTable
CREATE TABLE "NOTIFICACION" (
    "notificacion_id" SERIAL NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "evento" "EventoNotificacion" NOT NULL,
    "asunto" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,

    CONSTRAINT "NOTIFICACION_pkey" PRIMARY KEY ("notificacion_id")
);

-- CreateTable
CREATE TABLE "NOTIFICACION_USUARIO" (
    "notificacion_usuario_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "notificacion_id" INTEGER NOT NULL,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NOTIFICACION_USUARIO_pkey" PRIMARY KEY ("notificacion_usuario_id")
);

-- CreateTable
CREATE TABLE "LIQUIDACION" (
    "liquidacion_id" SERIAL NOT NULL,
    "solicitud_id" INTEGER NOT NULL,
    "total_autorizado" DECIMAL(10,2) NOT NULL,
    "total_comprobado" DECIMAL(10,2) NOT NULL,
    "diferencia" DECIMAL(10,2) NOT NULL,
    "tipo_ajuste" "TipoAjuste" NOT NULL,
    "estado" "EstadoLiquidacion" NOT NULL,
    "fecha_calculo" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "fecha_recibido" TIMESTAMP(3),
    "ruta_comprobacion" TEXT,

    CONSTRAINT "LIQUIDACION_pkey" PRIMARY KEY ("liquidacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SOLICITUD_folio_solicitud_key" ON "SOLICITUD"("folio_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "COMPROBACION_solicitud_id_key" ON "COMPROBACION"("solicitud_id");

-- CreateIndex
CREATE UNIQUE INDEX "COMPROBACION_folio_comprobacion_key" ON "COMPROBACION"("folio_comprobacion");

-- CreateIndex
CREATE UNIQUE INDEX "FACTURA_folio_factura_key" ON "FACTURA"("folio_factura");

-- CreateIndex
CREATE UNIQUE INDEX "TIPOS_CAMBIO_factura_id_key" ON "TIPOS_CAMBIO"("factura_id");

-- CreateIndex
CREATE UNIQUE INDEX "LIQUIDACION_solicitud_id_key" ON "LIQUIDACION"("solicitud_id");

-- AddForeignKey
ALTER TABLE "COMPROBACION" ADD CONSTRAINT "COMPROBACION_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "SOLICITUD"("solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FACTURA" ADD CONSTRAINT "FACTURA_comprobacion_id_fkey" FOREIGN KEY ("comprobacion_id") REFERENCES "COMPROBACION"("comprobacion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TIPOS_CAMBIO" ADD CONSTRAINT "TIPOS_CAMBIO_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "FACTURA"("factura_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APROBACION" ADD CONSTRAINT "APROBACION_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "SOLICITUD"("solicitud_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APROBACION" ADD CONSTRAINT "APROBACION_comprobacion_id_fkey" FOREIGN KEY ("comprobacion_id") REFERENCES "COMPROBACION"("comprobacion_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOTIFICACION_USUARIO" ADD CONSTRAINT "NOTIFICACION_USUARIO_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "NOTIFICACION"("notificacion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LIQUIDACION" ADD CONSTRAINT "LIQUIDACION_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "SOLICITUD"("solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;
