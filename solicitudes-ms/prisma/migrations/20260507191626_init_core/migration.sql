-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateEnum
CREATE TYPE "core"."FormaPago" AS ENUM ('Transferencia', 'Efectivo');

-- CreateEnum
CREATE TYPE "core"."EstadoSol" AS ENUM ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada');

-- CreateEnum
CREATE TYPE "core"."EstadoFinanciero" AS ENUM ('Pendiente', 'Liquidada');

-- CreateEnum
CREATE TYPE "core"."EstadoCmp" AS ENUM ('Pendiente', 'Aprobada', 'Rechazada');

-- CreateEnum
CREATE TYPE "core"."Acciones" AS ENUM ('Aprobar', 'Rechazar');

-- CreateEnum
CREATE TYPE "core"."TipoNotificacion" AS ENUM ('Solicitud', 'Comprobación', 'Anticipo');

-- CreateEnum
CREATE TYPE "core"."EventoNotificacion" AS ENUM ('Aprobada', 'Rechazada', 'Enviada', 'Cancelada', 'Modificada', 'Vencida', 'Recordatorio', 'Liquidada');

-- CreateEnum
CREATE TYPE "core"."TipoAjuste" AS ENUM ('Devolución', 'Reembolso', 'Sin_diferencia');

-- CreateEnum
CREATE TYPE "core"."EstadoLiquidacion" AS ENUM ('Pendiente', 'Pagado', 'Devuelto', 'Saldado');

-- CreateTable
CREATE TABLE "core"."Solicitud" (
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
    "forma_pago" "core"."FormaPago" NOT NULL,
    "estado" "core"."EstadoSol" NOT NULL DEFAULT 'Pendiente',
    "estado_financiero" "core"."EstadoFinanciero",
    "fecha_entrega" TIMESTAMP(3),
    "fecha_confirmacion" TIMESTAMP(3),
    "ruta_comprobante" TEXT,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("solicitud_id")
);

-- CreateTable
CREATE TABLE "core"."Comprobacion" (
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
    "estado" "core"."EstadoCmp" NOT NULL DEFAULT 'Pendiente',
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comprobacion_pkey" PRIMARY KEY ("comprobacion_id")
);

-- CreateTable
CREATE TABLE "core"."Factura" (
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

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("factura_id")
);

-- CreateTable
CREATE TABLE "core"."TiposCambio" (
    "tipos_cambio_id" SERIAL NOT NULL,
    "factura_id" INTEGER NOT NULL,
    "fecha_tipo_cambio" TIMESTAMP(3) NOT NULL,
    "moneda" TEXT NOT NULL,
    "tipo_cambio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TiposCambio_pkey" PRIMARY KEY ("tipos_cambio_id")
);

-- CreateTable
CREATE TABLE "core"."Aprobacion" (
    "aprobacion_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "solicitud_id" INTEGER,
    "comprobacion_id" INTEGER,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" "core"."Acciones" NOT NULL,
    "motivo_rechazo" TEXT,

    CONSTRAINT "Aprobacion_pkey" PRIMARY KEY ("aprobacion_id")
);

-- CreateTable
CREATE TABLE "core"."Notificacion" (
    "notificacion_id" SERIAL NOT NULL,
    "tipo" "core"."TipoNotificacion" NOT NULL,
    "evento" "core"."EventoNotificacion" NOT NULL,
    "asunto" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("notificacion_id")
);

-- CreateTable
CREATE TABLE "core"."NotificacionUsuario" (
    "notificacion_usuario_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "notificacion_id" INTEGER NOT NULL,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacionUsuario_pkey" PRIMARY KEY ("notificacion_usuario_id")
);

-- CreateTable
CREATE TABLE "core"."Liquidacion" (
    "liquidacion_id" SERIAL NOT NULL,
    "solicitud_id" INTEGER NOT NULL,
    "total_autorizado" DECIMAL(10,2) NOT NULL,
    "total_comprobado" DECIMAL(10,2) NOT NULL,
    "diferencia" DECIMAL(10,2) NOT NULL,
    "tipo_ajuste" "core"."TipoAjuste" NOT NULL,
    "estado" "core"."EstadoLiquidacion" NOT NULL,
    "fecha_calculo" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "fecha_recibido" TIMESTAMP(3),
    "ruta_comprobacion" TEXT,

    CONSTRAINT "Liquidacion_pkey" PRIMARY KEY ("liquidacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_folio_solicitud_key" ON "core"."Solicitud"("folio_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobacion_solicitud_id_key" ON "core"."Comprobacion"("solicitud_id");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobacion_folio_comprobacion_key" ON "core"."Comprobacion"("folio_comprobacion");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_folio_factura_key" ON "core"."Factura"("folio_factura");

-- CreateIndex
CREATE UNIQUE INDEX "TiposCambio_factura_id_key" ON "core"."TiposCambio"("factura_id");

-- CreateIndex
CREATE UNIQUE INDEX "Liquidacion_solicitud_id_key" ON "core"."Liquidacion"("solicitud_id");

-- AddForeignKey
ALTER TABLE "core"."Comprobacion" ADD CONSTRAINT "Comprobacion_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "core"."Solicitud"("solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Factura" ADD CONSTRAINT "Factura_comprobacion_id_fkey" FOREIGN KEY ("comprobacion_id") REFERENCES "core"."Comprobacion"("comprobacion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."TiposCambio" ADD CONSTRAINT "TiposCambio_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "core"."Factura"("factura_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Aprobacion" ADD CONSTRAINT "Aprobacion_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "core"."Solicitud"("solicitud_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Aprobacion" ADD CONSTRAINT "Aprobacion_comprobacion_id_fkey" FOREIGN KEY ("comprobacion_id") REFERENCES "core"."Comprobacion"("comprobacion_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."NotificacionUsuario" ADD CONSTRAINT "NotificacionUsuario_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "core"."Notificacion"("notificacion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Liquidacion" ADD CONSTRAINT "Liquidacion_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "core"."Solicitud"("solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;
