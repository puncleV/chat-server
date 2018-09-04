**DESCRIPTION**

This is a server part for chat application.

**BEFORE START**

1. You have to install docker (https://docs.docker.com/install/)
2. You have to install and launch chat-db from this repo: https://github.com/punkkk/chat-db

**START**

1. `sudo docker build -t chat/server .`
2. `sudo docker run --link mongo:mongo -it --rm --name server chat/server`
3. Now you can use chat-front from https://github.com/punkkk/chat-front

Or you simply can use `yarn install && yarn run dev`