#!/bin/bash

mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db
redis-server --daemonize yes
cp sefaria/local_settings_example.py sefaria/local_settings.py
npm install
npm run setup
