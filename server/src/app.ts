import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import todoRoutes from './routes/todoRoutes';
import errorHandler from './middlewares/errorHandler';
import notFound from './middlewares/notFound';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
    },
  });
});

app.use('/api/v1/todos', todoRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
