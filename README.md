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

Testing Instructions
=============

Make sure that TEST in the top level directory is executable with the following command:

    chmod 777 TEST

Then run the TEST bash file as so:

    ./TEST

If you get errors related to 'permission denied', chances are the 'tgb_db_admin' user doesn't have createdb permission. To fix this, run a postgres shell with

    psql

You should be logged in as a superuser (the prompt will look like `username=#` instead of `username=>`). Then execute the following sql:

    ALTER USER tgb_db_admin CREATEDB;

You can now quit the shell with `\q`.
