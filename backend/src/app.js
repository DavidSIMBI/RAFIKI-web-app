import express from 'express';
import databaseHealthRoutes from './routes/databaseHealthRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();
app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api', databaseHealthRoutes);

export default app;
