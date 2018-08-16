# dictyBase content loader

Nodejs command line tool for using CRUD with the API server

### Commands:

1.  **[Upload](#upload)**
2.  **[Upload All](#upload-all)**
3.  **[Fetch by Id](#fetch-by-id)**
4.  **[Fetch by Slug](#fetch-by-slug)**
5.  **[Remove](#remove)**
6.  **[Update](#update)**
7.  **[Minio](#minio)**

To get started:

```
npm install https://github.com/dictyBase/content-loader
```

For help type:

```
node index -h
```

## UPLOAD

The script accepts five arguments: `[-f|--file <file>] [-H|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>] [-u|--user <user>]`. It converts the desired file into the appropriate JSON format for use with the dictyBase API server.

Example:

```
upload -f example.json -H localhost -p 3000 -n example -u 99
```

## UPLOAD ALL

The script accepts five arguments: `[-f|--folder <folder>] [-H|--host <host>] [-p|--port <port>] [-n|--namespace <namespace>] [-u|--user <user>]`. It converts the files inside a specified folder into the appropriate JSON format for use with the dictyBase API server.

Example:

```
uploadAll -f data -H localhost -p 3000 -n example -u 99
```

## FETCH BY ID

The script accepts four arguments: `fetch [-id|--identifier <ID>] [-H|--host <host>] [-p|--port <port>] [-pc|--print-content <print serialized JSON content>]`. It retrieves content by ID from the API server.

Example:

```
fetch -id 3 -H localhost -p 31827 --pc
```

## FETCH BY SLUG

The script accepts three arguments: `fetch [-s|--slug <slug name>] [-H|--host <host>] [-p|--port <port>]`. It retrieves content by slug name from the API server.

Example:

```
fetchbyslug -s dsc-faq -H localhost -p 31827
```

## REMOVE

The script accepts three arguments: `delete [-id|--identifier <ID>] [-H|--host <host>] [-p|--port <port>]`. It removes content with specified ID from the dictyBase API server.

Example:

```
delete -id 3 -H localhost -p 31827
```

## UPDATE

The script accepts five arguments: `update [-id|--identifier <ID>] [-f|--file <file>] [-H|--host <host>] [-p|--port <port>] [-u|--user <user>]`. It updates existing content by ID on the dictyBase API server.

Example:

```
update -id 3 -f example.json -H localhost -p 31827 -u 99
```

## MINIO

The script accepts nine arguments: `[-p|--path <path>] [--mh|--miniohost <miniohost>] [--mp|--minioport <minioport>] [--akey|--accesskey <accesskey>] [--skey|--secretkey <secretkey>] [--ch|--chost <chost>] [--cp|--cport <cport>] [-n|--namespace <namespace>] [-u|--user <user>]`. It downloads files from a Minio bucket and object, then uploads them to the content API server.

Example:

```
minio -p contents/frontpageV1 --mh 192.168.99.100 --mp 33377 --akey qwerty --skey asdf --ch localhost --cp 31827 -n example -u 999
```
