#!/bin/bash

mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db
redis-server --daemonize yes
cp .devcontainer/local_settings.py sefaria
npm install
npm run setup
