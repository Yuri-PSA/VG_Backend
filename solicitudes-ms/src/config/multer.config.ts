import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const multerConfig = (subfolder: string, prefijo: string) => ({
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads', subfolder),
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `${prefijo}-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Aceptar imágenes y PDFs para comprobantes; para facturas además XML
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|xml)$/)) {
      return callback(new Error('Solo se permiten imágenes (jpg, jpeg, png, gif), PDFs y XMLs'), false);
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});