FROM node:7
LABEL maintainer "Eric Hartline <eric.hartline@northwestern.edu>"

# Create app directory
WORKDIR /app

# Add packages so Docker won't have to install dependencies again
COPY package.json /app
COPY package-lock.json /app

# Install necessary packages
RUN npm install

# Bundle app source
COPY . /app

ENTRYPOINT ["./contentmanager"]
