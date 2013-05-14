Prerequisites
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

We are currently deployed on EC2 at [http://ec2-50-112-229-141.us-west-2.compute.amazonaws.com](http://ec2-50-112-229-141.us-west-2.compute.amazonaws.com); a nice aliased URL is [http://tinyurl.com/169tgb](http://tinyurl.com/169tgb)

1. Update the release branch to master with `git checkout release && git merge master` (make sure your local copy is up to date).
1. Push the released branch to github with `git push`.
1. (optionally) Tag this commit with a descriptive name of the release with `git tag -a <tagname> -m "message"`
1. Push the tag to github with `git push --tags`.
1. If you don't already, get the game\_bazaar.pem (from Facebook or ask someone) and put it in `~/.ssh/`
1. Log in to the EC2 instance with `ssh -i ~/.ssh/game_bazaar.pem ubuntu@ec2-50-112-229-141.us-west-2.compute.amazonaws.com`. (assuming the `game_bazaar.pem` is in your `~/.ssh/`)
1. `cd the_game_bazaar`
1. `git status` to make sure you're on the `release` branch.
1. `git pull`
1. Get the location and credentials of the monit server from Facebook or ask someone.
1. Restart gunicorn by visiting the monit server, clicking on the entry for gunicorn, and clicking 'Restart service'.

You're done!
