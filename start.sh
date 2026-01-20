#!/bin/sh
set -e

echo "Pushing database schema..."
prisma db push --skip-generate

echo "Starting server..."
exec node server.js
