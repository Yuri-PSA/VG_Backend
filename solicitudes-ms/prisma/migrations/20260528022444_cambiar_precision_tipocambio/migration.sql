/*
  Warnings:

  - You are about to alter the column `tipo_cambio` on the `tipos_cambio` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.

*/
-- AlterTable
ALTER TABLE "core"."tipos_cambio" ALTER COLUMN "tipo_cambio" SET DATA TYPE DECIMAL(10,4);
