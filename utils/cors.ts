import { CorsOptions } from 'cors'

const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5500/temp/Kara-Howard.html',
  'https://siher.si3.space',
  'https://backend.si3.space'
]

const allowedDomainSuffixes: string[] = ['.siher.eth.link', '.siher.eth.limo']

/**
 * CORS options for the application
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      allowedDomainSuffixes.some((suffix) => origin.endsWith(suffix))
    ) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}
