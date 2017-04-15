Prerequisites!
=============
    1. python 2.7
    2. foreman
    3. gunicorn
    4. local virtualenv install
    5. postgresql 9.1
    6. phantomjs

Installation Instructions
=============

1. Install virtualenv: `sudo apt-get install python-virtualenv`.

1. Install foreman: `gem install foreman`
> You may need to first install `gem` with `sudo apt-get install ruby1.9.1`.

1. Install gunicorn dependencies: `sudo apt-get install -y libevent-dev python-gevent`.

1. Install postgresql: `sudo apt-get install postgresql-9.1 postgresql-client-9.1 postgresql-server-dev-9.1`.
> You may want to change the default password for the postgres user with `sudo -u postgres psql` - this will get you into the psql shell as the postgres user. Then you can `alter password postgres password 'some_pass';` to give the postgres user an actual password.
1. Set up the local database for development, perform the following commands in the terminal after installing postgres.
    1. `psql -Upostgres` or `sudo -u postgres psql`
    2. `CREATE USER tgb_db_admin with PASSWORD 'ilovetgb';`
    3. `ALTER USER tgb_db_admin CREATEDB;`
    4. `CREATE DATABASE tgb_db with OWNER tgb_db_admin;`
    5. `\q`

1. Download and install the python dev package with `sudo apt-get install python-dev`.

1. Clone the\_game\_bazaar repo into a directory with `git clone https://github.com/hellochar/the_game_bazaar.git`.

1. Create and activate virtualenv within the cloned repository by doing `virtualenv --distribute venv` and then `source venv/bin/activate`. Then install dependencies with `pip install -r requirements.txt`.

1. Populate the database model with `python manage.py syncdb`.


To run locally: `foreman start` and then visit [http://localhost:5000](http://localhost:5000)

You will have to `source venv/bin/activate` in each terminal you want to develop in.


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
