/*
  Warnings:

  - You are about to drop the column `total_moneda` on the `factura` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "core"."comprobacion" ADD COLUMN     "total_otros" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "core"."factura" DROP COLUMN "total_moneda";
