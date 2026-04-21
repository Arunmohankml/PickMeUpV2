#!/bin/bash
pip install -r requirements.txt
cd autoapp
python manage.py collectstatic --noinput
python manage.py migrate
