/// <reference types="node" />
import { Arch } from "builder-util";
import { CustomPublishOptions } from "builder-util-runtime";
import { ClientRequest } from "http";
import { HttpPublisher, PublishContext } from "electron-publish";
export interface CustomConfig extends CustomPublishOptions {
    url: string;
    updaterPath?: string;
}
export default class CustomPublisher extends HttpPublisher {
    private readonly configuration;
    readonly providerName = "custom";
    private readonly metadata;
    private readonly hostname;
    private readonly protocol;
    private readonly port;
    private readonly productName;
    private readonly version;
    constructor(context: PublishContext, configuration: CustomConfig);
    private isEmpty;
    protected doUpload(fileName: string, arch: Arch, dataLength: number, requestProcessor: (request: ClientRequest, reject: (error: Error) => void) => void, file?: string): Promise<any>;
    private doUploadFile;
    toString(): string;
}
