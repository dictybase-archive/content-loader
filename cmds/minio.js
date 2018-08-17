const Minio = require("minio")
const yargs = require("yargs")
const bunyan = require("bunyan")
const { Writable } = require("stream")
const filepath = require("path")
const tmp = require("tmp")

const argv = yargs // eslint-disable-line
  .usage("Usage: $0 [options] - list all objects in the given path")
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
  .demandOption(["H", "P", "secret", "access", "p", "b"])
  .help("h")
  .example(
    "$0 -H play.minio.io --port 9000 --secret 48kjpqr3u --access furiwer02 -b mybucket -p /content",
  ).argv

class S3Writer extends Writable {
  constructor({ client, folder, bucket, logger }) {
    super({ objectMode: true })
    this.folder = folder
    this.client = client
    this.bucket = bucket
    this.logger = logger
  }

  async _write(object, _, done) {
    try {
      const fullPath = filepath.join(this.folder, filepath.basename(object.name))
      await this.client.fGetObject(this.bucket, object.name, fullPath)
      this.logger.info("saved %s", fullPath)
    } catch (error) {
      this.logger.error("unable to write the file %s", object.name)
    }
    done()
  }
}

const getLogger = () => {
  return bunyan.createLogger({ name: "listobject" })
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
  const tmpObj = tmp.dirSync({ prefix: "minio-" })
  const folder = tmpObj.name
  stream.pipe(
    new S3Writer({
      client,
      bucket,
      folder,
      logger,
    }),
  )
}

listObjects(argv)
