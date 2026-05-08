#!/bin/bash
set -e

DEPLOY_API=false
DEPLOY_CLIENT=false

for arg in "$@"; do
  case $arg in
    --api) DEPLOY_API=true ;;
    --client) DEPLOY_CLIENT=true ;;
  esac
done

if ! $DEPLOY_API && ! $DEPLOY_CLIENT; then
  DEPLOY_API=true
  DEPLOY_CLIENT=true
fi

if $DEPLOY_API; then
  echo "==> Building & deploying API (Firebase Functions)..."
  cd functions
  firebase deploy --only functions
  cd ..
  echo "==> API deployed."
fi

if $DEPLOY_CLIENT; then
  echo "==> Building & deploying client..."
  cd frontend
  npm run deploy
  cd ..
  echo "==> Client deployed."
fi

echo "==> Done."