#!/bin/sh
set -e

echo ">>> Starting app in $NODE_ENV"

echo "Running DB Migration!𝌏 ..."
npm run migrate
echo "DB Migration Successful ✅!"

# revert migration
# npm run migration:revert

echo "Running seeders...⛓⚙️"
npm run db:seed -- seed:categories
echo "DB Seeders ✅"


if [ "$NODE_ENV" == "production" ] || [ "$NODE_ENV" == "staging" ] ; then
  echo ">>> run commands for production and staging"
  node dist/main.js
elif [ "$NODE_ENV" == "test" ]; then
  npm run test
else
  npm run start:dev
fi
