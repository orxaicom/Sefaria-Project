#!/bin/bash

npm run watch-client &
/python3.8 manage.py migrate
/python3.8 manage.py runserver
