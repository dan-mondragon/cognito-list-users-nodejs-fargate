FROM node:14

# Create app directory
WORKDIR /usr/src

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY src/ ./

EXPOSE 8080
RUN npm install pm2 -g
CMD [ "pm2-runtime", "list-all-users.js" ]
