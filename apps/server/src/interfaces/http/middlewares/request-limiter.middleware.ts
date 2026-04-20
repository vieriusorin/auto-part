import express from 'express'
import { apiSlowDown } from './security.middleware.js'

export const payloadLimiter = express.json({ limit: '5mb' })
export const speedLimiter = apiSlowDown
