FROM node:alpine

# Create app directory
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# Install necessary packages
RUN npm install

# Bundle app source
COPY . .
