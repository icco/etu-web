#!/usr/bin/env node
/**
 * Standalone gRPC server for Etu
 * Run with: node grpc-server.js
 */

require('dotenv').config({ path: '.env.local' })

const { startGrpcServer } = require('./lib/grpc-server')

const port = process.env.GRPC_PORT || 50051

console.log('Starting Etu gRPC server...')
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`Port: ${port}`)

const server = startGrpcServer(port)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.tryShutdown(() => {
    console.log('gRPC server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  server.tryShutdown(() => {
    console.log('gRPC server closed')
    process.exit(0)
  })
})
