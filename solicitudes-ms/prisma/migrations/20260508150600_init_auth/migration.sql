-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateEnum
CREATE TYPE "auth"."Rol" AS ENUM ('Tesorería', 'Jefe', 'Colaborador', 'Administrador');

-- CreateTable
CREATE TABLE "auth"."usuario" (
    "usuario_id" SERIAL NOT NULL,
    "jefe_directo_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "auth"."Rol" NOT NULL,
    "departamento" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "auth"."usuario"("correo");

-- AddForeignKey
ALTER TABLE "auth"."usuario" ADD CONSTRAINT "usuario_jefe_directo_id_fkey" FOREIGN KEY ("jefe_directo_id") REFERENCES "auth"."usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;
