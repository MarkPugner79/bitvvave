# Bitvvave

This is a hardfork of the original project with an aim at making it configurable and focused on FOSS technologies.

This is a front end that is intended to be use with fedwave (A backend streaming and chat platform that is opensource with a focus on federation)

Most of the API calls are designed to work with fedwave's api (which should match everything in this project)

# Configuration

`.env` Has a bunch of configuration options that need to be configured for this to work.
Everything from Chat,API,Signaling server, branding.


# Local development

If you are just getting started consider setting up npm via nvm (node version manager) [[nvm]](https://github.com/nvm-sh/nvm)


## Dev Setup

``` bash
# install dependencies
$ npm ci

# serve with hot reload at localhost:3000
$ npm run dev
```

## Production Setup

```bash
# install dependencies
$ npm ci

# build for production and launch server
$ npm run build
$ npm start
```

# Security

If you find a security problem please contact the project or pay attention to the dependencies in use.
This is a large codebase, please consider that it has components that are out of date, and has been under
active development since 2021.

# TODO

One of the main focuses is on replacing and removing all of the data collection and event management tools
Firebase, 



# Deployment

The best way to run this is via a remote repo in production that you can push to, there will be
a sample script and further setup info bellow.