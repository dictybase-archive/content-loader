const fs = require("fs")
const Minio = require("minio")
const bunyan = require("bunyan")
const { Writable } = require("stream")
const filepath = require("path")
const fetch = require("node-fetch")
const moment = require("moment")
const tmp = require("tmp")

const argv = yargs // eslint-disable-line
  .usage(
    "Usage: $0 [options] - download data from minio and upload to content API server",
  )
  .option("host", {
    alias: "H",
    type: "string",
    describe: "minio s3 host",
  })
  .option("port", {
    alias: "P",
    type: "number",
    describe: "minio server port",
  })
  .option("secret", {
    type: "string",
    describe: "server secret key",
  })
  .option("access", {
    type: "string",
    describe: "server access key",
  })
  .option("bucket", {
    alias: "b",
    type: "string",
    describe: "storage bucket",
  })
  .option("path", {
    alias: "p",
    type: "string",
    describe: "folder path",
  })
  .env("CONTENT_API_SERVICE")
  .option("chost", {
    type: "string",
    default: "content-api",
    describe: "the server to upload to",
  })
  .env("CONTENT_API_SERVICE")
  .option("cport", {
    type: "number",
    describe: "the port for the server",
  })
  .option("namespace", {
    alias: "n",
    type: "string",
    describe: "the namespace for the folder",
  })
  .option("user", {
    alias: "u",
    type: "number",
    describe: "the user who is uploading the content",
  })
  .demandOption([
    "H",
    "P",
    "secret",
    "access",
    "p",
    "b",
    "chost",
    "cport",
    "n",
    "u",
  ])
  .help("h")
  .example(
    "$0 -H play.minio.io --port 9000 --secret 48kjpqr3u --access furiwer02 -b mybucket -p content --chost 192.168.99.100 --cport 30999 -n dsc -u 999",
  ).argv

const getLogger = () => {
  return bunyan.createLogger({
    name: "uploader",
    streams: [{ level: "debug", stream: process.stderr }],
  })
}

class FileUploader {
  constructor({ url, namespace, user, logger }) {
    this.url = url
    this.namespace = namespace
    this.user = user
    this.logger = logger
  }

  printContent(json) {
    let output = `resource link: ${json.links.self}
id: ${json.data.id}
namespace: ${json.data.attributes.namespace}
slug: ${json.data.attributes.slug}
`
    const created = moment(json.data.attributes.created_at)
    if (created.isValid()) {
      output += `created on: ${created.fromNow()}`
    } else {
      logger.warn("error in parsing date")
    }
    this.logger.info(output)
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
    this.logger.info("going to upload %s", this.url)
    return
    try {
      // get the response(resolves the first promise)
      const res = await fetch(this.url, {
        method: "POST",
        body: JSON.stringify(body),
      })
      if (res.ok) {
        // successful http response
        // now get the json (resolves the second promise)
        const json = await res.json()
        this.printContent(json)
      } else {
        // this is an http error (error response from server)
        // comes in JSONAPI error format
        const json = await res.json() // this is the error json (same second promise)
        this.printError(res, json)
      }
    } catch (err) {
      // possibly a network error or something
      this.logger.error(`network error: ${err.message}`)
    }
  }

  upload(folder) {
    const logger = this.logger
    // read folder
    const files = fs.readdirSync(folder)
    if (files.length === 0) {
      logger.error("no files found to upload")
      return
    }
    // for each file in folder, run this script
    files.forEach(file => {
      // read file and convert to string
      const fileContent = fs
        .readFileSync(filepath.join(folder, file))
        .toString()
      // set object to match dictybase content API
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
    super({
      objectMode: true,
    })
    this.client = client
    this.bucket = bucket
    this.logger = logger
    this.folder = folder
    this.uploader = uploader
  }

  async _write(object, _, done) {
    try {
      const fullPath = filepath.join(
        this.folder,
        filepath.basename(object.name),
      )
      await this.client.fGetObject(this.bucket, object.name, fullPath)
      this.logger.debug("saved %s", fullPath)
      done()
    } catch (error) {
      this.logger.error(
        "unable to write the file %s %s",
        object.name,
        error.message,
      )
      done(error)
    }
  }

  _final(done) {
    this.uploader.upload(this.folder)
    done()
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

const listObjects = options => {
  const logger = getLogger()
  const client = getS3Client(options)
  const tmpObj = tmp.dirSync({ prefix: "minio-" })
  const folder = tmpObj.name
  const { bucket, path, host, port, chost, cport, user, namespace } = options
  const stream = client.listObjects(bucket, path, true)
  const url = `http://${chost}:${cport}/contents`
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
  listObjects(argv)
  // uploadFiles(argv)
}
