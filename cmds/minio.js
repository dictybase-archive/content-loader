const fs = require("fs")
const Minio = require("minio")
const bunyan = require("bunyan")
const { Writable } = require("stream")
const filepath = require("path")
const fetch = require("node-fetch")
const tmp = require("tmp")

exports.command = "minio [host] [port] [secret] [access] [bucket] [path] [chost] [cport] [n] [u]"
exports.describe = "download data from minio and upload to content API server"
exports.builder = yargs => {
  yargs
    .env("MINIO_SERVICE_HOST")
    .positional("host", {
      alias: "H",
      type: "string",
      describe: "minio s3 host",
    })
    .env("MINIO_SERVICE_PORT")
    .positional("port", {
      alias: "P",
      type: "number",
      describe: "minio server port",
    })
    .env("S3_ACCESS_KEY")
    .positional("secret", {
      type: "string",
      describe: "server secret key",
    })
    .env("S3_SECRET_KEY")
    .positional("access", {
      type: "string",
      describe: "server access key",
    })
    .positional("bucket", {
      alias: "b",
      type: "string",
      describe: "storage bucket",
    })
    .positional("path", {
      alias: "p",
      type: "string",
      describe: "folder path",
    })
    .env("CONTENT_API_SERVICE")
    .positional("chost", {
      type: "string",
      default: "content-api",
      describe: "the server to upload to",
    })
    .env("CONTENT_API_SERVICE")
    .positional("cport", {
      type: "number",
      describe: "the port for the server",
    })
    .positional("namespace", {
      alias: "n",
      type: "string",
      describe: "the namespace for the folder",
    })
    .positional("user", {
      alias: "u",
      type: "number",
      describe: "the user who is uploading the content",
    })
    .demandOption(["H", "P", "secret", "access", "p", "b", "chost", "cport", "n", "u"])
    .help("h")
    .example(
      "minio -H play.minio.io --port 9000 --secret 48kjpqr3u --access furiwer02 -b mybucket -p /content --chost 192.168.99.100 --cport 30999 -n dsc -u 999",
    )
}

class FileUploader {
  constructor({ url, namespace, user, logger }) {
    this.url = url
    this.namespace = namespace
    this.user = user
    this.logger = logger
  }

  printError(res, json) {
    this.logger.error(
      "http response: %s\ttitle: %s\t detail: %s",
      res.status,
      json.errors[0].title,
      json.errors[0].detail,
    )
  }

  async postContent(body) {
    try {
      //get the response (resolves the first promise)
      const res = await fetch(this.url, {
        method: "POST",
        body: JSON.stringify(body),
      })
      if (res.ok) {
        //successful http response
        //now get the json (resolves the second promise)
        const json = await res.json()
        this.logger.info(`ID #${json.data.id} successfully uploaded`)
      } else {
        //this is an http error (error response from server)
        //comes in JSONAPI error format
        const json = await res.json() //this is the error json (same second promise)
        this.printError(res, json)
      }
    } catch (err) {
      //possibly a network error or something
      this.logger.error(`network error: ${err.message}`)
    }
  }

  upload(folder) {
    const { logger } = this
    //read folder
    const files = fs.readdirSync(folder)
    if (files.length === 0) {
      logger.error("no files found to upload")
      return
    }
    //for each file in folder, run this script
    files.forEach(file => {
      //read file and convert to string
      const fileContent = fs.readFileSync(filepath.join(folder, file)).toString()
      //set object to match dictybase content API
      const body = {
        data: {
          type: "contents",
          attributes: {
            name: filepath.basename(file, filepath.extname(file)),
            created_by: this.user,
            content: fileContent,
            namespace: this.namespace,
          },
        },
      }
      this.postContent(body)
    })
  }
}

class S3Writer extends Writable {
  constructor({ client, bucket, logger, folder, uploader }) {
    super({ objectMode: true })
    this.client = client
    this.bucket = bucket
    this.logger = logger
    this.folder = folder
    this.uploader = uploader
  }

  //This method saves each file in the tmp folder
  //It gets called on reading every file from s3
  async _write(object, _, done) {
    try {
      const fullPath = filepath.join(this.folder, filepath.basename(object.name))
      await this.client.fGetObject(this.bucket, object.name, fullPath)
      this.logger.debug("saved %s", fullPath)
      done()
    } catch (error) {
      this.logger.error("unable to write the file %s %s", object.name, error.message)
      done(error)
    }
  }

  //This method gets called after all files have been read and
  //processed by the writer
  _final(done) {
    try {
      this.uploader.upload(this.folder)
      done()
    } catch (error) {
      this.logger.error("unable to upload file", error.message)
      done(error)
    }
  }
}

const getS3Client = options => {
  return new Minio.Client({
    endPoint: options.host,
    port: options.port,
    accessKey: options.access,
    secretKey: options.secret,
    useSSL: false,
  })
}

const loadFiles = options => {
  const logger = bunyan.createLogger({
    name: "uploader",
    //The log level should be configurable from command line
    streams: [{ level: "debug", stream: process.stderr }],
  })
  const client = getS3Client(options)
  const tmpObj = tmp.dirSync({ prefix: "minio-" })
  const folder = tmpObj.name
  const { bucket, path, chost, cport, user, namespace } = options
  const stream = client.listObjects(bucket, path, true)
  const url = `http://${chost}:${cport}/contents`
  //encapsulated the upload process with a simple class
  const uploader = new FileUploader({
    url,
    namespace,
    user,
    logger,
  })
  stream.pipe(
    new S3Writer({
      client,
      bucket,
      folder,
      logger,
      uploader,
    }),
  )
}

exports.handler = argv => {
  loadFiles(argv)
}
