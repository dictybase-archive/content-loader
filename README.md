# dictyBase content loader

Nodejs command line tool for using CRUD with the API server

### Commands:

1.  **[Upload](#upload)**
2.  **[Upload All](#upload-all)**
3.  **[Fetch by Id](#fetch-by-id)**
4.  **[Fetch by Slug](#fetch-by-slug)**
5.  **[Remove](#remove)**
6.  **[Update](#update)**

To get started:

```
npm install https://github.com/dictyBase/content-loader
```

For help type:

```
node index -h
```

## UPLOAD

The script accepts four arguments: `upload [-f|--file <file>] [-H|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>]`. It converts the desired file into the appropriate JSON format for use with the dictyBase API server.

To run the script type:

```
upload [-f|--file <file>] [-H|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>]
```

Example:

```
upload -f example.json -H localhost -p 3000 -n example
```

## UPLOAD ALL

The script accepts four arguments: `uploadAll [-f|--folder <folder>] [-H|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>]`. It converts the files inside a specified folder into the appropriate JSON format for use with the dictyBase API server.

To run the script type:

```
uploadAll [-f|--folder <folder>] [-H|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>]
```

Example:

```
uploadAll -f data -H localhost -p 3000 -n example
```

## FETCH BY ID

The script accepts four arguments: `fetch [-id|--identifier <ID>] [-H|--host <host>] [-p|--port <port>] [-pc|--print-content <print serialized JSON content>]`. It retrieves content by ID from the API server.

To run the script type:

```
fetch [-id|--identifier <file>]  [-H|--host <host>] [-p|--port <port>] [-pc|--print-content <print serialized JSON content>]
```

Example:

```
fetch -id 3 -H localhost -p 31827 --pc
```

## FETCH BY SLUG

The script accepts three arguments: `fetch [-s|--slug <slug name>] [-H|--host <host>] [-p|--port <port>]`. It retrieves content by slug name from the API server.

To run the script type:

```
fetchbyslug [-s|--slug <slug name>]  [-H|--host <host>] [-p|--port <port>]
```

Example:

```
fetchbyslug -s dsc-faq -H localhost -p 31827
```

## REMOVE

The script accepts three arguments: `delete [-id|--identifier <ID>] [-H|--host <host>] [-p|--port <port>]`. It removes content with specified ID from the dictyBase API server.

To run the script type:

```
delete [-id|--identifier <ID>]  [-H|--host <host>] [-p|--port <port>]
```

Example:

```
delete -id 3 -H localhost -p 31827
```

## UPDATE

The script accepts four arguments: `update [-id|--identifier <ID>] [-f|--file <file>] [-H|--host <host>] [-p|--port <port>]`. It updates existing content by ID on the dictyBase API server.

To run the script type:

```
update [-id|--identifier <ID>]  [-f|--file <file>]  [-H|--host <host>] [-p|--port <port>]
```

Example:

```
update -id 3 -f example.json -H localhost -p 31827
```
