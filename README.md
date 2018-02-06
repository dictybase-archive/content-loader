# dictyBase content loader
Nodejs command line tool for uploading content to the API server

To get started:

```
npm install --save https://github.com/dictyBase/content-loader
```

The script accepts three arguments as such: `upload [-f|--file=<file>]  [-s|--server=<server>] [-n|--namespace=<namespace>]`. It converts the desired file into the appropriate JSON format for use with the dictyBase API server.

To run the script type:

```
node index upload|u [-f|--file=<file>]  [-s|--server=<server>] [-n|--namespace=<namespace>]
```

Example:

```
node upload file=example.json server=localhost:3000 namespace=example
```

For help type:

```
node index -h
```
