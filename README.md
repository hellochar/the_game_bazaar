Prerequisites
=============
foreman
local virtualenv install
postgresql

Installation Instructions
=============
To set up the local database for development, perform the following commands in the terminal after installing postgres.

1. psql -Upostgres
2. CREATE USER tgb_db_admin with PASSWORD 'ilovetgb';
3. CREATE DATABASE tgb_db with owner tgb_db_admin;
4. \q
5. ???
6. Profit!


To run locally:

    foreman start

Will look at the Procfile and start it correctly
