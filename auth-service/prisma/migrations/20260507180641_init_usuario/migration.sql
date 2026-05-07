-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('Tesorería', 'Jefe', 'Colaborador', 'Administrador');

-- CreateTable
CREATE TABLE "Usuario" (
    "usuario_id" SERIAL NOT NULL,
    "jefe_directo_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "departamento" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_jefe_directo_id_fkey" FOREIGN KEY ("jefe_directo_id") REFERENCES "Usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;
