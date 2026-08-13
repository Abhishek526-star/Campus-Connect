#!/usr/bin/env bash
# Sandbox helper: ensure a local MongoDB instance is running on 127.0.0.1:27017.
# Downloads mongod to /tmp when it is missing (the workspace cannot ship binaries).
# Usage: bash scripts/start-mongo.sh
set -euo pipefail

MONGO_BIN=/tmp/mongodb/bin/mongod
DATA_DIR=/tmp/mongo-data
MONGO_VERSION=7.0.39
URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian12-${MONGO_VERSION}.tgz"

if [ ! -x "$MONGO_BIN" ]; then
  echo "[mongo] downloading mongod ${MONGO_VERSION}..."
  cd /tmp
  curl -fsSL -o mongo.tgz "$URL"
  tar xzf mongo.tgz
  mkdir -p /tmp/mongodb/bin
  mv "mongodb-linux-x86_64-debian12-${MONGO_VERSION}/bin/mongod" "$MONGO_BIN"
  rm -rf "mongodb-linux-x86_64-debian12-${MONGO_VERSION}" mongo.tgz
fi

if pgrep -f "mongod --dbpath $DATA_DIR" > /dev/null 2>&1; then
  echo "[mongo] already running on 127.0.0.1:27017"
  exit 0
fi

mkdir -p "$DATA_DIR"
"$MONGO_BIN" --dbpath "$DATA_DIR" --port 27017 --bind_ip 127.0.0.1 --fork --logpath "$DATA_DIR/mongod.log"
echo "[mongo] started (pid $(pgrep -f 'mongod --dbpath /tmp/mongo-data' | head -1))"
