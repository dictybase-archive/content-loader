FROM node:alpine
LABEL maintainer "Eric Hartline <erichartline@northwestern.edu>"

# Create app directory
WORKDIR /app

# Add packages so Docker won't have to install dependencies again
COPY package.json /app
COPY package-lock.json /app

# Install necessary packages
RUN npm install

# Bundle app source
COPY . /app

EXPOSE 9930
ENTRYPOINT ["node", "index.js"]