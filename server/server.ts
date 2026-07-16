const express = require('express');
import type { NextFunction, Request, Response } from 'express';
const rateLimit = require('express-rate-limit');
const logger = require('morgan');
const jwt = require('jsonwebtoken');
const path = require('path')
const User = require('./models/userModel')
const routes = require('./routes/route');
const adminRouter = require('./routes/admin');
const adoptionRouter = require('./routes/adoptions');
const errorHandler = require('./middleware/errorHandler');
const { connectDatabase } = require('../config/database');
require("dotenv").config({
  path: path.join(__dirname, "../.env")
});
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../tmp/swagger/swagger.json');
const options = require('../tmp/swagger/custom');
const cors = require('cors');




const app = express();
app.disable('x-powered-by');
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
});
const apiRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(apiRequestLimiter);

const PORT = process.env.PORT || 3000;
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(
  "/files",
  express.static(path.resolve(__dirname, "..", "tmp", "uploads"))
);


app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers["x-access-token"]) {
    try {
      await connectDatabase();
      const accessToken = req.headers["x-access-token"];
      const { userId, exp } = await jwt.verify(accessToken, process.env.JWT_SECRET);
      // If token has expired
      if (exp < Date.now().valueOf() / 1000) {
        return res.status(401).json({
          error: "JWT token has expired, please login to obtain a new one"
        });
      }
      res.locals.loggedInUser = await User.findById(userId);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});
app.get('/docs/swagger-ui.css', (_req: Request, res: Response) => {
  res.type('text/css').sendFile(require.resolve('swagger-ui-dist/swagger-ui.css'));
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await connectDatabase();
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error: unknown) {
    console.error('MongoDB health check failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});
app.get('/', (_req: Request, res: Response) => {
  const databaseConnected = require('mongoose').connection.readyState === 1;

  res.status(200).json({
    name: 'amormiau-backend',
    status: 'ok',
    database: databaseConnected ? 'connected' : 'disconnected',
    docs: '/docs'
  });
});

app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDatabase();
    next();
  } catch (error: unknown) {
    console.error('MongoDB request connection failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.use('/', routes);
app.use('/adoptions', adoptionRouter);
app.use('/admin', adminRouter);
app.use(errorHandler);





if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Server is listening on Port:', PORT)
  });
}


module.exports = app;
