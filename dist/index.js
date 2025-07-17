"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const nodeHttpExecutor_1 = require("builder-util/out/nodeHttpExecutor");
const builder_util_runtime_1 = require("builder-util-runtime");
const form_data_1 = __importDefault(require("form-data"));
const fs_extra_1 = require("fs-extra");
const mime = __importStar(require("mime"));
const url_1 = require("url");
const electron_publish_1 = require("electron-publish");
class CustomePublisher extends electron_publish_1.HttpPublisher {
    constructor(context, info) {
        super(context);
        this.providerName = "custom";
        if ((0, builder_util_1.isEmptyOrSpaces)(info.endpoint)) {
            throw new builder_util_1.InvalidConfigurationError(`PrivateServer endpoint is not set`);
        }
        if ((0, builder_util_1.isEmptyOrSpaces)(info.projectId)) {
            throw new builder_util_1.InvalidConfigurationError(`PrivateServer projectId is not set`);
        }
        if ((0, builder_util_1.isEmptyOrSpaces)(info.secret)) {
            throw new builder_util_1.InvalidConfigurationError(`PrivateServer secret is not set`);
        }
        if ((0, builder_util_1.isEmptyOrSpaces)(info.productVersion)) {
            throw new builder_util_1.InvalidConfigurationError(`PrivateServer productVersion is not set`);
        }
        if (info.productVersion.startsWith("v")) {
            throw new builder_util_1.InvalidConfigurationError(`Version must not start with "v": ${info.productVersion}`);
        }
        if ((0, builder_util_1.isEmptyOrSpaces)(info.channel)) {
            info.channel = "latest";
        }
        if ((0, builder_util_1.isEmptyOrSpaces)(info.basePath)) {
            info.basePath = "/api/public-app-edition";
        }
        this.info = info;
        if ((0, builder_util_1.isEmptyOrSpaces)(info.authScheme)) {
            this.auth = CustomePublisher.convertAppPassword("", info.projectId, info.secret);
        }
        else {
            if (info.authScheme.startsWith("Basic") || info.authScheme.startsWith("Bearer")) {
                this.auth = CustomePublisher.convertAppPassword(info.authScheme, info.projectId, info.secret);
            }
            else {
                const headers = info.headers || {};
                this.info.headers = Object.assign({ "Authorization": `${info.authScheme} ${CustomePublisher.convertAppPassword("", info.projectId, info.secret)}` }, headers);
                this.auth = null;
            }
        }
        builder_util_1.log.info(this.info, "customOptions");
        builder_util_1.log.info(null, `auth: ${this.auth}`);
    }
    doUpload(fileName, arch, _dataLength, _requestProcessor, file) {
        return builder_util_runtime_1.HttpExecutor.retryOnServerError(() => __awaiter(this, void 0, void 0, function* () {
            const fileContent = yield (0, fs_extra_1.readFile)(file);
            const form = new form_data_1.default();
            form.append("file", fileContent, fileName);
            form.append("arch", arch);
            form.append("channel", this.info.channel);
            form.append("productVersion", this.info.productVersion);
            const headers = Object.assign(Object.assign({}, this.info.headers), form.getHeaders());
            const url = (0, url_1.parse)(`${this.info.endpoint}${this.info.basePath}/upload`);
            const opts = (0, builder_util_runtime_1.configureRequestOptions)({
                hostname: url.hostname,
                path: url.path,
                protocol: url.protocol,
                port: url.port,
                method: 'POST',
                headers: Object.assign({ 'Accept': '*/*', 'X-File-Name': fileName, "Content-Type": mime.getType(fileName) || "application/octet-stream" }, headers),
                timeout: this.info.timeout || undefined,
            }, this.auth);
            // log.info(opts, "upload requestOptions");
            yield nodeHttpExecutor_1.httpExecutor.doApiRequest(opts, this.context.cancellationToken, (request, reject) => {
                if (this.info.timeout) {
                    request.setTimeout(this.info.timeout, () => {
                        request.destroy();
                        reject(new Error("Request timed out"));
                    });
                }
                form.pipe(request);
            });
            return fileName;
        }));
    }
    deleteRelease(fileName, channel, version) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = this.info.headers || {};
            const url = (0, url_1.parse)(`${this.info.endpoint}${this.info.basePath}?fileName=${fileName}&channel=${channel || this.info.channel}&productVersion=${version || this.info.productVersion}`);
            const opts = (0, builder_util_runtime_1.configureRequestOptions)({
                hostname: url.hostname,
                path: url.path,
                protocol: url.protocol,
                port: url.port,
                method: 'DELETE',
                headers: Object.assign({ 'Accept': 'application/json', "Content-Type": "application/json" }, headers),
                timeout: this.info.timeout || undefined,
            }, this.auth);
            // log.info(opts, "upload requestOptions");
            yield nodeHttpExecutor_1.httpExecutor.request(opts, this.context.cancellationToken);
        });
    }
    static convertAppPassword(authScheme, projectId, secret) {
        const base64encodedData = Buffer.from(`${projectId}:${secret.trim()}`).toString("base64");
        return `${authScheme} ${base64encodedData}`.trim();
    }
    toString() {
        const { endpoint, projectId, channel, productVersion } = this.info;
        return `Custom publisher(endpoint: ${endpoint}, projectId: ${projectId}, channel: ${channel}, version: ${productVersion})`;
    }
}
exports.default = CustomePublisher;
