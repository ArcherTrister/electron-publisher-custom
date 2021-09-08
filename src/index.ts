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
}

class CustomPublisher extends HttpPublisher {
  readonly providerName = "PrivateServer";
  private readonly metadata: Metadata;
  private readonly hostname: string | null;
  private readonly protocol: string | null;
  private readonly port: string | null;

  constructor(
    context: PublishContext,
    private readonly configuration: CustomConfig
  ) {
    super(context);
    const publishContext: any = context;
    this.metadata = publishContext?.packager?.metadata;
 
    if (
      this.configuration.url === null ||
      this.configuration.url === undefined ||
      this.configuration.url === ""
    ) {
      throw new Error(
        `The ${
          this.configuration?.provider ?? "custom"
        } configuration item URL cannot be null`
      );
    }
    const parsedUrl = parseUrl(this.configuration.url);
    this.hostname = parsedUrl.hostname;
    this.protocol = parsedUrl.protocol;
    this.port = parsedUrl.port;
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
    if (
      this.metadata?.version === null ||
      this.metadata?.version === undefined ||
      this.metadata?.version === ""
    ) {
      return Promise.reject(
        `The package configuration item Version cannot be null`
      );
    } else {
      let uploadPath;
      if (
        this.configuration.updaterPath === null ||
        this.configuration.updaterPath === undefined ||
        this.configuration.updaterPath === ""
      ) {
        uploadPath = `/api/app/upload/${this.metadata?.version}/${Arch[arch]}`;
      } else {
        uploadPath = `${this.configuration.updaterPath}/${this.metadata?.version}/${Arch[arch]}`;
      }
      return await this.doUploadFile(
        0,
        uploadPath,
        fileName,
        dataLength,
        requestProcessor
      );
    }
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
        return new Promise((resolve, reject_1) => {
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
              .catch(reject_1);
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
