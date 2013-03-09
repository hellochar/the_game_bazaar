Prerequisites
=============
    1. foreman
    2. gunicorn
    3. local virtualenv install
    4. postgresql

Installation Instructions
=============

Create and source virtualenv. Then install dependencies with `pip install -r requirements.txt`. 

To set up the local database for development, perform the following commands in the terminal after installing postgres.

    1. psql -Upostgres
    2. CREATE USER tgb_db_admin with PASSWORD 'ilovetgb';
    3. CREATE DATABASE tgb_db with OWNER tgb_db_admin;
    4. \q
    5. ???
    6. Profit!


To run locally:

    foreman start

Will look at the Procfile and start it correctly
