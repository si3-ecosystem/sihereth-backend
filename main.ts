// src/index.ts
import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import auth from './middlewares/auth'
import { corsOptions } from './utils/cors'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/users.routes'
import webContentRoutes from './routes/webcontent.routes'
import domainRoutes from './routes/domain.routes'
import testRoutes from './routes/test.routes'

dotenv.config()

const app = express()

app.use(helmet())
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/webcontent', auth, webContentRoutes)
app.use('/domain', auth, domainRoutes)
app.use('/test', testRoutes)

app.get('/', (_req: Request, res: Response) => {
  return res.send('Server is running')
})

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000
const DB_URL: string = process.env.DB_URL!

mongoose
  .connect(DB_URL)
  .then(() => console.log('MongoDB connected'))
  .catch((err: Error) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

  export default app
