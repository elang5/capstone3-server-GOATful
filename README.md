# Laconic Api (URL: [https://laconic-api.herokuapp.com/api](https://laconic-api.herokuapp.com/api))

Laconic enables Youtube creators to optimize their videos click rates by allowing them to rapidly test how their video appears on Youtube's search result page.  A creator can easily test out multiple custom thumbnails, titles, descriptions and more while seeing how the results render in desktop, iphone or android app.

This is the backend for `Laconic`.  A live version of the app can be found at [https://laconic.now.sh/](https://laconic.now.sh/)

The code for the front end client can be found at [https://github.com/thinkful-ei-cheetah/capstone3-client-GOATful](https://github.com/thinkful-ei-cheetah/capstone3-client-GOATful).
 
## Quick App Demo

put gif here

## Technology

#### Back End

* Node and Express
  * Authentication via Google OAuth and JWT
  * RESTful Api
* Testing
  * Supertest (integration)
  * Mocha and Chai (unit)
* Database
  * Postgres
  * Knex.js - SQL wrapper

#### Production

Deployed via Heroku


## Set up

Major dependencies for this repo include Postgres and Node.

To get setup locally, do the following:

1. Clone this repository to your machine, `cd` into the directory and run `npm install`
2. Create the dev and test databases: `createdb -U postgres laconic-dev` and `createdb -U postgres laconic-test`

3. Create a `.env` and a `.env.test` file in the project root

Inside these files you'll need the following:

````
NODE_ENV=development
PORT=8000

MIGRATION_DB_HOST=localhost
MIGRATION_DB_PORT=5432
MIGRATION_DB_NAME=laconic-dev
MIGRATION_DB_USER=postgres
DEV_DB_URL="postgresql://postgres@localhost/laconic-dev"

JWT_SECRET=laconic-jwt-secret
JWT_EXPIRY='1w'
````

Your `.env.test` will be the same except your database name will be `MIGRATION_DB_NAME=laconic-test` and database url will be called `TEST_DB_URL="postgresql://postgres@localhost/laconic-test"`

4. Run the migrations for dev - `npm run migrate`
5. Run the migrations for test - `NODE_ENV=test npm run migrate`
6. Seed the database for dev

* `psql -U postgres -d laconic-dev -f ./seeds/seed.user-video-preview.sql`

7. Run the tests - `npm t`
8. Start the app - `npm run dev`
