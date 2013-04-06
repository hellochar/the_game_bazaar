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

Run the TEST bash file as so:

    ./TEST

To test the javascript models (unit tests), visit the domain /jasmine. Each line of text that is green is a successful test.

You may install phantomjs by downloading the binary from http://phantomjs.org/download.html and putting it in your PATH. Installing phantomjs
will have `./TEST` automatically run the jasmine tests from the CLI and output their status.

The TEST file will automatically generate a coverage report for the Django server and the information will be output to the terminal.

It is possible to view this coverage report in HTML format by opening htmlcov/index.html after the test is complete.

Miscellaneous Problems
=============

If you get errors related to 'permission denied', chances are the 'tgb_db_admin' user doesn't have createdb permission. To fix this, run a postgres shell with

    psql

You should be logged in as a superuser (the prompt will look like `username=#` instead of `username=>`). Then execute the following sql:

    ALTER USER tgb_db_admin CREATEDB;

You can now quit the shell with `\q`.

Resetting Your Database
==============
    python manage.py reset_db --router=default
    python manage.py syncdb
This will delete all your current data and update the db to have the new fields in the models.

Releasing
==============
1. First tag the release branch with a descriptive name of the release with `git tag -a <tagname> -m "message"`
1. Push it to github with `git push --tags`.
1. Then push to heroku with `git push heroku release`.
1. If you need to reset the database in heroku (which you most likely will), you can't `reset_db` since Heroku doesn't allow it. Instead use `heroku pg:reset DATABASE_URL`, followed by `heroku run python manage.py syncdb`.
