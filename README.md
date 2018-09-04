**DESCRIPTION**

This is a server part for chat application.

**BEFORE START**

1. You have to install docker (https://docs.docker.com/install/)
2. You have to install and launch chat-db from this repo: https://bitbucket.org/punkkk/chat-db

**START**

1. sudo dockebuild -t chat/server .
2. sudo docker run --link mongo:mongo -it --rm --name server chat/server
3. 