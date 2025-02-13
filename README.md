# Bitvvave

This is a hardfork of the original project with an aim at making it configurable and focused on FOSS technologies.

This is a front end that is intended to be use with fedwave (A backend streaming and chat platform that is opensource with a focus on federation)

Most of the API calls are designed to work with fedwave's api (which should match everything in this project)

# To do

## hlsp2p video playback (with clappr or videojs)

## support for mpegts

## Fix token parsing for user info (for what it displays in chat) that should be handled by the login process iirc

# Configuration

`.env` Has a bunch of configuration options that need to be configured for this to work.
Everything from Chat,API,Signaling server, branding.

Start by copying the `.env.example` to `.env`

`cp .env.example .env`


# Local development

If you are just getting started consider setting up npm via nvm (node version manager) [[nvm]](https://github.com/nvm-sh/nvm)

Install node js 16 with npm
`nvm install 16`

Or do:
`nvm install`
since there should be a .nvmrc with the version number of 16 in it.

Example of how it should be ran, modify this in post-receive to work as a production/dev environment.
`nvm exec 16 npm run dev`

## Dev Setup

``` bash
# install dependencies
$ npm ci --force

# serve with hot reload at localhost:3000
$ npm run dev
```
Alternatively you can bind it to your LAN address for local testing using
`HOST=0 PORT=3000 npm run dev`
However keep in mind that this does not seem to work with Node Version Manager.

## Production Setup

```bash
# install dependencies
$ npm ci --force

# build for production and launch server
$ npm run build
$ npm start
```

# Security

If you find a security problem please contact the project or pay attention to the dependencies in use.
This is a large codebase, please consider that it has components that are out of date, and hasn't been under
active development since 2021.

Hey just so you know this is a nightmare and no one should in their right mind run this at this point.
There will be a few more features added and then porting the UI to something that is still supported via another
project will eventually be started.

# TODO

One of the main focuses is on replacing and removing all of the data collection and event management tools
Firebase, 

Probably need to also fork and update the chat api client stuff so we can get to a modern secure build of socket.io

Only Show messages from people you know, you will only see a username or partial username, messages will not be rendered or cached if you don't know them.

No images chat mode []

Images only from DOMAIN LIST []
    Should allow you to add that domain []


# Deployment

The best way to run this is via a remote repo in production that you can push to, there will be
a sample script and further setup info bellow.

Setup a user account. (recommended)
`adduser bitvvave`

```
mkdir bitvvave.git
cd bitvvave.git
git init --bare
nano hooks/post-receive
chmod +x hooks/post-receive
mkdir bitvvave
```

### Setup your reference to remote production for your local git
```
git remote add production ssh://user@server:/full/path/to/bare.git
git push production
```

Uses the post-receive.example file to configur and setup your deployment

### Setup PM2
```
nvm exec 16 npm i pm2@latest -g
nvm exec 16 pm2 startup systemd
# Then you need to run the sudo as your user if you have permissions or as root to enable the startup
sudo systemctl start pm2-bitvvave.service
```

Initial service start:
```
pm2 start "npm run dev" --name bitvvave
```

```
pm2 start npm run dev --name bitvvave
pm2 save
```

Cleanup a bad pm2 service name instance
```
pm2 delete bitvvave
```
