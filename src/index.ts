import { Arch, log } from "builder-util";
import {
  configureRequestOptions,
  CustomPublishOptions,
} from "builder-util-runtime";
import { Metadata } from "app-builder-lib";
import { httpExecutor } from "builder-util/out/nodeHttpExecutor";
import { ClientRequest } from "http";
import * as mime from "mime";
import { parse as parseUrl } from "url";
import { HttpPublisher, PublishContext } from "electron-publish";

export interface CustomConfig extends CustomPublishOptions {
  url: string;
  updaterPath?: string;
  channel?: string;
}

class CustomPublisher extends HttpPublisher {
  readonly providerName = "PrivateServer";
  private readonly metadata: Metadata;
  private readonly hostname: string | null;
  private readonly protocol: string | null;
  private readonly port: string | null;
  private readonly productName: string;
  private readonly version: string;

  constructor(
    context: PublishContext,
    private readonly configuration: CustomConfig
  ) {
    super(context);
    const publishContext: any = context;
    this.metadata = publishContext?.packager?.metadata;
    // log.info(publishContext?.packager);

    if (this.isEmpty(this.configuration.url)) {
      throw new Error(
        `The ${
          this.configuration?.provider ?? "custom"
        } configuration item URL cannot be null`
      );
    }
    this.version = this.metadata?.version || "";
    if (this.isEmpty(this.version)) {
      throw new Error(`The package configuration item Version cannot be null`);
    }
    this.productName = this.metadata?.productName || this.metadata?.name || "";
    if (this.isEmpty(this.productName)) {
      throw new Error(
        `The package configuration item ProductName or Name cannot be null`
      );
    }

    const parsedUrl = parseUrl(this.configuration.url);
    this.hostname = parsedUrl.hostname;
    this.protocol = parsedUrl.protocol;
    this.port = parsedUrl.port;
  }

  private isEmpty(str: string | null | undefined) {
    if (str === "undefined" || !str || !/[^\s]/.test(str)) {
      return true;
    } else {
      return false;
    }
  }

  protected async doUpload(
    fileName: string,
    arch: Arch,
    dataLength: number,
    requestProcessor: (
      request: ClientRequest,
      reject: (error: Error) => void
    ) => void,
    file?: string
  ): Promise<any> {
    let uploadPath;
    if (this.isEmpty(this.configuration.updaterPath)) {
      uploadPath = `/upload/${this.productName}/${this.version}/${
        process.platform
      }/${Arch[arch]}/${this.configuration.channel || "latest"}`;
    } else {
      uploadPath = `${this.configuration.updaterPath}/${this.productName}/${
        this.version
      }/${process.platform}/${Arch[arch]}/${
        this.configuration.channel || "latest"
      }`;
    }
    return await this.doUploadFile(
      0,
      uploadPath,
      fileName,
      dataLength,
      requestProcessor
    );
  }

  private async doUploadFile(
    attemptNumber: number,
    uploadPath: string,
    fileName: string,
    dataLength: number,
    requestProcessor: (
      request: ClientRequest,
      reject: (error: Error) => void
    ) => void
  ): Promise<any> {
    try {
      return httpExecutor.doApiRequest(
        configureRequestOptions({
          hostname: this.hostname,
          protocol: this.protocol,
          port: this.port,
          path: uploadPath,
          method: "POST",
          headers: {
            "X-File-Name": fileName,
            "Content-Type":
              mime.getType(fileName) || "application/octet-stream",
            "Content-Length": dataLength,
          },
        }),
        this.context.cancellationToken,
        requestProcessor
      );
    } catch (e: any) {
      if (
        e.statusCode === 422 &&
        e.description != null &&
        e.description.errors != null &&
        e.description.errors[0].code === "already_exists"
      ) {
        log.warn(
          { file: fileName, reason: "already exists on Custom" },
          "overwrite published file"
        );
      }

      if (attemptNumber > 3) {
        return Promise.reject(e);
      } else {
        return new Promise((resolve, reject) => {
          const newAttemptNumber = attemptNumber + 1;
          setTimeout(() => {
            this.doUploadFile(
              newAttemptNumber,
              uploadPath,
              fileName,
              dataLength,
              requestProcessor
            )
              .then(resolve)
              .catch(reject);
          }, newAttemptNumber * 2000);
        });
      }
    }
  }

  toString() {
    return `Custom (owner: ${this.metadata?.author?.name}, project: ${this.metadata?.name}, version: ${this.metadata?.version})`;
  }
}

module.exports = CustomPublisher;
