Prerequisites
=============
    1. foreman
    2. gunicorn
    3. local virtualenv install
    4. postgresql
    5. phantomjs

Installation Instructions
=============

Create and source virtualenv. Then install dependencies with `pip install -r requirements.txt`. 

To set up the local database for development, perform the following commands in the terminal after installing postgres.

    1. psql -Upostgres
    2. CREATE USER tgb_db_admin with PASSWORD 'ilovetgb';
    3. ALTER USER tgb_db_admin CREATEDB;
    4. CREATE DATABASE tgb_db with OWNER tgb_db_admin;
    5. \q


To run locally:

    foreman start

Testing Instructions
=============

Install phantomjs with `sudo apt-get install phantomjs`

Run the TEST bash file as so:

    ./TEST

To test the javascript models (unit tests), visit the domain /jasmine. Each line of text that is green is a successful test.

Miscellaneous Problems
=============

If you get errors related to 'permission denied', chances are the 'tgb_db_admin' user doesn't have createdb permission. To fix this, run a postgres shell with

    psql

You should be logged in as a superuser (the prompt will look like `username=#` instead of `username=>`). Then execute the following sql:

    ALTER USER tgb_db_admin CREATEDB;

You can now quit the shell with `\q`.

Resetting Your Database
==============
psql -d tbg_db
drop table <table name> cascade;
\q
python manage.py syncdb
