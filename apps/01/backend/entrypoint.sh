#!/bin/sh
set -e

# Run the ETL seed script to populate products from JSON into the DB
echo "Running ETL seed script..."
python etl_migrate_products.py
echo "Seed complete. Starting server..."

# Execute the CMD (uvicorn)
exec "$@"