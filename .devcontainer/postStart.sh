#!/bin/bash

mkdir log && chmod 777 log
mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db
redis-server --daemonize yes
cp .devcontainer/local_settings.py sefaria
npm install
npm run setup
npm run build-client
npm run build
/python3.8 manage.py migrate
/python3.8 manage.py runserver
