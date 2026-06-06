import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  editorOrigin: process.env.EDITOR_ORIGIN ?? 'http://localhost:5173',
  viewerOrigin: process.env.VIEWER_ORIGIN ?? 'http://localhost:5174',
  databaseUrl: process.env.DATABASE_URL ?? '',
  staticDir: process.env.STATIC_DIR ?? './public',
  uploadsDir: process.env.UPLOADS_DIR ?? './public/uploads',
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'lightglass',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
  },
};
