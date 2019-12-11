# Travelers Ask Kodiak blockchain app

## Development Prerequisites

1. Install [Node.js](https://nodejs.org/) by following the installation directions provided by Node. `npm` is also required, but is installed with node.
2. Install [Gulp](http://gulpjs.com/) version 4 globally by running `npm install gulp-cli -g`

## Running Locally

From within the project root directory run the command

```bash
npm install
```

This will install dependencies required.

Once dependencies have been installed, you can run the project at any time:

```bash
gulp
```

## Ask Kodiak API Configuration
Found in `/config/[env].js` under **ASKKODIAK_API_PARAMS**.  Update **key**, **group id**, and **url** to an appropriate environment.

## Google Places Configuration
Found in `/config/[env].js` under **GOOGLE_PLACES**.

## Travelers Customer API Configuration
Found in `/config/[env].js` under **CUSTOMER_API_PARAMS**.  Each entry consists of a key, which is a username currently setup for authentication.  The object associated with the key consists of **url** and **role** (agent or carrier).

The following accounts are available for authentication:

username | password
------------ | -------------
UserAgent1 | agent123
UserCarrier1 | carrier123
UserCarrier2 | carrier123
UserCarrier3 | carrier123

