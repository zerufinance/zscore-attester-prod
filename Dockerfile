FROM node:18-alpine AS build

RUN npm install -g npm@10.5.0

WORKDIR /usr/src/app

RUN npm i -g @othentic/othentic-cli

ENTRYPOINT [ "othentic-cli" ]
