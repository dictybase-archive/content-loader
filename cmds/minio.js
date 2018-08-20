const fs = require("fs")
const Minio = require("minio")
const bunyan = require("bunyan")
const { Writable } = require("stream")
const filepath = require("path")
const fetch = require("node-fetch")
const moment = require("moment")
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

const getLogger = () => {
  return bunyan.createLogger({ name: "listobject" })
}

const tmpObj = tmp.dirSync({ prefix: "minio-" })
const folder = tmpObj.name

const printContent = json => {
  const logger = getLogger()
  let output = `resource link: ${json.links.self}
      id: ${json.data.id}
      namespace: ${json.data.attributes.namespace}
      slug: ${json.data.attributes.slug}
         `
  const created = moment(json.data.attributes.created_at)
  if (created.isValid()) {
    output += `created on: ${created.fromNow()}`
  } else {
    logger.info("error in parsing date")
  }
  logger.info(output)
}

const printError = (res, json) => {
  const logger = getLogger()
  logger.error(
    `http response: ${res.status}
           title: ${json.errors[0].title}
           detail: ${json.errors[0].detail}
          `,
  )
}

const postContent = async (url, body) => {
  const logger = getLogger()
  try {
    // get the response(resolves the first promise)
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (res.ok) {
      // successful http response
      // now get the json (resolves the second promise)
      const json = await res.json()
      printContent(json)
    } else {
      // this is an http error (error response from server)
      // comes in JSONAPI error format
      const json = await res.json() // this is the error json (same second promise)
      printError(res, json)
    }
  } catch (err) {
    // possibly a network error or something
    logger.error(`network error: ${err.message}`)
  }
}

const uploadFiles = argv => {
  const logger = getLogger()

  // read folder
  fs.readdir(`${folder}`, (err, files) => {
    if (err) {
      logger.error(err)
      process.exit(1) // stop the script
    }
    // for each file in folder, run this script
    files.forEach(file => {
      // read file and convert to string
      const fileContent = fs.readFileSync(`${folder}/${file}`).toString()
      const url = `http://${argv.chost}:${argv.cport}/contents`
      // set object to match dictybase content API
      const body = {
        data: {
          type: "contents",
          attributes: {
            name: filepath.basename(file, filepath.extname(file)),
            created_by: argv.user,
            content: fileContent,
            namespace: argv.namespace,
          },
        },
      }
      postContent(url, body)
    })
  })
}

class S3Writer extends Writable {
  constructor({ client, bucket, logger }) {
    super({ objectMode: true })
    this.client = client
    this.bucket = bucket
    this.logger = logger
  }

  async _write(object, _, done) {
    try {
      const fullPath = filepath.join(folder, filepath.basename(object.name))
      await this.client.fGetObject(this.bucket, object.name, fullPath)
      this.logger.info("saved %s", fullPath)
    } catch (error) {
      this.logger.error("unable to write the file %s", object.name)
    }
    done()
    // below is the problematic line -- how to upload files only after ALL files are downloaded?
    // uploadFiles()
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
  const { bucket, path } = options
  const stream = client.listObjects(bucket, path, true)
  stream.pipe(
    new S3Writer({
      client,
      bucket,
      folder,
      logger,
    }),
  )
}

exports.handler = argv => {
  listObjects(argv)
  // uploadFiles(argv)
}
