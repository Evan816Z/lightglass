import { bootstrap } from './app';

bootstrap().catch((err) => {
  console.error('failed to start server', err);
  process.exit(1);
});
