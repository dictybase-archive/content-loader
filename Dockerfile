FROM node:8.11.2-alpine
LABEL maintainer "Eric Hartline <eric.hartline@northwestern.edu>"
LABEL maintainer "Siddhartha Basu <siddhartha-basu@northwestern.edu>"

# Create app directory
WORKDIR /app

# Add packages so Docker won't have to install dependencies again
COPY package.json /app
COPY package-lock.json /app
# Bundle app source
COPY . /app

# Install necessary packages and link the runner
RUN npm install && npm link

ENTRYPOINT ["content-manager"]
