/// <reference types="node" />
import { Arch } from "builder-util";
import { CustomPublishOptions } from "builder-util-runtime";
import { ClientRequest } from "http";
import { HttpPublisher, PublishContext } from "electron-publish";
export interface CustomOptions extends CustomPublishOptions {
    endpoint: string;
    basePath?: string | null;
    projectId: string;
    secret: string;
    channel?: string | null;
    productVersion: string;
    authScheme?: string;
    headers?: {
        [key: string]: string;
    } | null;
}
export default class CustomePublisher extends HttpPublisher {
    readonly providerName = "custom";
    private readonly info;
    private readonly auth;
    constructor(context: PublishContext, info: CustomOptions);
    protected doUpload(fileName: string, arch: Arch, _dataLength: number, _requestProcessor: (request: ClientRequest, reject: (error: Error) => void) => void, file: string): Promise<any>;
    deleteRelease(fileName: string, channel?: string, version?: string): Promise<void>;
    static convertAppPassword(authScheme: string, projectId: string, secret: string): string;
    toString(): string;
}
