import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import todoRoutes from './routes/todoRoutes';
import errorHandler from './middlewares/errorHandler';
import notFound from './middlewares/notFound';

const app = express();
const corsOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:3000'];

app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '100kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}


app.use('/api/v1/todos', todoRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
