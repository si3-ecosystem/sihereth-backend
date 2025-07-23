import { IncomingMessage, ServerResponse } from 'http'

// Minimal stub definitions for the @vercel/node package

declare module '@vercel/node' {
  export interface VercelRequest extends IncomingMessage {
    query: Record<string, string | string[]>
    body?: any
    cookies: Record<string, string>
  }

  export interface VercelResponse extends ServerResponse {
    status(code: number): VercelResponse
    json(data: any): VercelResponse
    send(data: any): VercelResponse
    setHeader(name: string, value: number | string | string[]): void
  }
} 