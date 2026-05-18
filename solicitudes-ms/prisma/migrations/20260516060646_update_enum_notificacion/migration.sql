/*
  Warnings:

  - The values [Vencida,Liquidada] on the enum `EventoNotificacion` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "core"."EventoNotificacion_new" AS ENUM ('Aprobada', 'Rechazada', 'Enviada', 'Cancelada', 'Modificada', 'Recordatorio', 'Entregado', 'Confirmado', 'Pendiente');
ALTER TABLE "core"."notificacion" ALTER COLUMN "evento" TYPE "core"."EventoNotificacion_new" USING ("evento"::text::"core"."EventoNotificacion_new");
ALTER TYPE "core"."EventoNotificacion" RENAME TO "EventoNotificacion_old";
ALTER TYPE "core"."EventoNotificacion_new" RENAME TO "EventoNotificacion";
DROP TYPE "core"."EventoNotificacion_old";
COMMIT;
