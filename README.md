# Bitvvave

This is a hardfork of the original project with an aim at making it configurable and focused on FOSS technologies.

This is a front end that is intended to be use with fedwave (A backend streaming and chat platform that is opensource with a focus on federation)

Most of the API calls are designed to work with fedwave's api (which should match everything in this project)

# Configuration

`.env` Has a bunch of configuration options that need to be configured for this to work.
Everything from Chat,API,Signaling server, branding.

Start by copying the `.env.example` to `.env`

`cp .env.example .env`


# Local development

If you are just getting started consider setting up npm via nvm (node version manager) [[nvm]](https://github.com/nvm-sh/nvm)

Install node js 16 with npm
`nvm install 16`

Example of how it should be ran, modify this in post-receive to work as a production/dev environment.
`nvm exec 16 npm run dev`

## Dev Setup

``` bash
# install dependencies
$ npm ci --force

# serve with hot reload at localhost:3000
$ npm run dev
```

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

# TODO

One of the main focuses is on replacing and removing all of the data collection and event management tools
Firebase, 

Probably need to also fork and update the chat api client stuff so we can get to a modern secure build of socket.io



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