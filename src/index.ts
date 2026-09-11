import { Arch, InvalidConfigurationError, isEmptyOrSpaces, log } from "builder-util"
import { httpExecutor } from "builder-util/out/nodeHttpExecutor";
import { configureRequestOptions, HttpExecutor, CustomPublishOptions } from "builder-util-runtime"
import FormData from "form-data"
import { readFile } from "fs-extra"
import * as mime from "mime";
import { ClientRequest } from "http"
import { parse as parseUrl } from "url";
import { HttpPublisher, PublishContext } from "electron-publish";

export interface CustomOptions extends CustomPublishOptions {
  endpoint: string;
  basePath?: string | null;
  projectId: string;
  secret: string;
  channel?: string | null;
  productVersion: string;
  authScheme?: string;
  headers?: { [key: string]: string } | null;
}

export default class CustomePublisher extends HttpPublisher {
  readonly providerName = "custom"

  private readonly info: CustomOptions
  private readonly auth: string | null

  constructor(context: PublishContext, info: CustomOptions) {
    super(context)

    if (isEmptyOrSpaces(info.endpoint)) {
      throw new InvalidConfigurationError(`PrivateServer endpoint is not set`)
    }

    if (isEmptyOrSpaces(info.projectId)) {
      throw new InvalidConfigurationError(`PrivateServer projectId is not set`)
    }

    if (isEmptyOrSpaces(info.secret)) {
      throw new InvalidConfigurationError(`PrivateServer secret is not set`)
    }

    if (isEmptyOrSpaces(info.productVersion)) {
      throw new InvalidConfigurationError(`PrivateServer productVersion is not set`)
    }
    if (info.productVersion.startsWith("v")) {
      throw new InvalidConfigurationError(`Version must not start with "v": ${info.productVersion}`)
    }

    if (isEmptyOrSpaces(info.channel)) {
      info.channel = "latest";
    }

    if (isEmptyOrSpaces(info.basePath))
    {
        info.basePath = "/api/public-app-edition";
    }

    this.info = info;
    if (isEmptyOrSpaces(info.authScheme)) {
      this.auth = CustomePublisher.convertAppPassword("", info.projectId, info.secret);
    } else {
      if (info.authScheme.startsWith("Basic") || info.authScheme.startsWith("Bearer")) {
        this.auth = CustomePublisher.convertAppPassword(info.authScheme, info.projectId, info.secret);
      } else {
        const headers = info.headers || {};
        this.info.headers = {
          "Authorization": `${info.authScheme} ${CustomePublisher.convertAppPassword("", info.projectId, info.secret)}`,
          ...headers,
        };
        this.auth = null; 
      }
    }

    log.info(this.info, "customOptions");
    log.info(null, `auth: ${this.auth}`);
  }

  protected doUpload(
    fileName: string,
    arch: Arch,
    _dataLength: number,
    _requestProcessor: (request: ClientRequest, reject: (error: Error) => void) => void,
    file: string
  ): Promise<any> {
    return HttpExecutor.retryOnServerError(async () => {
      const fileContent = await readFile(file)
      const form = new FormData()
      form.append("file", fileContent, fileName)
      form.append("arch", arch)
      form.append("channel", this.info.channel)
      form.append("productVersion", this.info.productVersion)

      const headers = { ...this.info.headers, ...form.getHeaders() };

      const url = parseUrl(`${this.info.endpoint}${this.info.basePath}/upload`)

      const opts = configureRequestOptions({
        hostname: url.hostname,
        path: url.path,
        protocol: url.protocol,
        port: url.port,
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'X-File-Name': fileName,
          "Content-Type": mime.getType(fileName) || "application/octet-stream",
          ...headers
        },
        timeout: this.info.timeout || undefined,
      }, this.auth);

      // log.info(opts, "upload requestOptions");

      await httpExecutor.doApiRequest(opts, this.context.cancellationToken, (request, reject) => {
        if (this.info.timeout) {
          request.setTimeout(this.info.timeout, () => {
            request.destroy();
            reject(new Error("Request timed out"));
          });
        }
        form.pipe(request)
      })
      return fileName
    })
  }

  async deleteRelease(fileName: string, channel?: string, version?: string): Promise<void> {

    const headers = this.info.headers || {};

    const url = parseUrl(`${this.info.endpoint}${this.info.basePath}?fileName=${fileName}&channel=${channel || this.info.channel}&productVersion=${version || this.info.productVersion}`);

    const opts = configureRequestOptions({
      hostname: url.hostname,
      path: url.path,
      protocol: url.protocol,
      port: url.port,
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        "Content-Type": "application/json",
        ...headers,
      },
      timeout: this.info.timeout || undefined,
    }, this.auth);

    // log.info(opts, "upload requestOptions");

    await httpExecutor.request(opts, this.context.cancellationToken);
  }

  static convertAppPassword(authScheme: string, projectId: string, secret: string) {
    const base64encodedData = Buffer.from(`${projectId}:${secret.trim()}`).toString("base64");
    return `${authScheme} ${base64encodedData}`.trim();
  }

  toString() {
    const { endpoint, projectId, channel, productVersion } = this.info
    return `Custom publisher(endpoint: ${endpoint}, projectId: ${projectId}, channel: ${channel}, version: ${productVersion})`;
  }
}