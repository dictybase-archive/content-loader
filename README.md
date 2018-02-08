# dictyBase content loader
Nodejs command line tool for uploading content to the API server

To get started:

```
npm install --save https://github.com/dictyBase/content-loader
```

The script accepts three arguments as such: `upload [-f|--file <file>]  [-h|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>]`. It converts the desired file into the appropriate JSON format for use with the dictyBase API server.

To run the script type:

```
upload [-f|--file <file>] [-h|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>]
```

Example:

```
upload -f example.json -h localhost -p 3000 -n example
```

For help type:

```
node index -?
```
