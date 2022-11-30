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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomPublisher = void 0;
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const nodeHttpExecutor_1 = require("builder-util/out/nodeHttpExecutor");
const mime = __importStar(require("mime"));
const url_1 = require("url");
const electron_publish_1 = require("electron-publish");
class CustomPublisher extends electron_publish_1.HttpPublisher {
    get providerName() {
        return "custom";
    }
    constructor(context, configuration) {
        var _a, _b, _c, _d, _e, _f;
        super(context);
        this.configuration = configuration;
        const publishContext = context;
        this.metadata = (_a = publishContext === null || publishContext === void 0 ? void 0 : publishContext.packager) === null || _a === void 0 ? void 0 : _a.metadata;
        // log.info(publishContext?.packager);
        // const appInfo = publishContext?.packager.appInfo;
        // console.log(appInfo);
        if (this.isEmpty(this.configuration.url)) {
            throw new Error(`The ${(_c = (_b = this.configuration) === null || _b === void 0 ? void 0 : _b.provider) !== null && _c !== void 0 ? _c : "custom"} configuration item URL cannot be null`);
        }
        this.version = ((_d = this.metadata) === null || _d === void 0 ? void 0 : _d.version) || "";
        if (this.isEmpty(this.version)) {
            throw new Error(`The package configuration item Version cannot be null`);
        }
        this.productName = ((_e = this.metadata) === null || _e === void 0 ? void 0 : _e.productName) || ((_f = this.metadata) === null || _f === void 0 ? void 0 : _f.name) || "";
        if (this.isEmpty(this.productName)) {
            throw new Error(`The package configuration item ProductName or Name cannot be null`);
        }
        const parsedUrl = (0, url_1.parse)(this.configuration.url);
        this.hostname = parsedUrl.hostname;
        this.protocol = parsedUrl.protocol;
        this.port = parsedUrl.port;
    }
    isEmpty(str) {
        if (str === "undefined" || !str || !/[^\s]/.test(str)) {
            return true;
        }
        else {
            return false;
        }
    }
    doUpload(fileName, arch, dataLength, requestProcessor, file) {
        return __awaiter(this, void 0, void 0, function* () {
            let uploadPath;
            let channel = "latest";
            let version;
            if (this.version.includes("-")) {
                const splits = this.version.split("-");
                version = splits[0];
                channel = splits[1];
            }
            else {
                version = this.version;
            }
            if (this.isEmpty(this.configuration.updaterPath)) {
                uploadPath = `/upload/${this.productName}/${version}/${process.platform}/${builder_util_1.Arch[arch]}/${channel}`;
            }
            else {
                uploadPath = `${this.configuration.updaterPath}/${this.productName}/${version}/${process.platform}/${builder_util_1.Arch[arch]}/${channel}`;
            }
            return yield this.doUploadFile(0, uploadPath, fileName, dataLength, requestProcessor);
        });
    }
    doUploadFile(attemptNumber, uploadPath, fileName, dataLength, requestProcessor) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return nodeHttpExecutor_1.httpExecutor.doApiRequest((0, builder_util_runtime_1.configureRequestOptions)({
                    hostname: this.hostname,
                    protocol: this.protocol,
                    port: this.port,
                    path: uploadPath,
                    method: "POST",
                    headers: {
                        "X-File-Name": fileName,
                        "Content-Type": mime.getType(fileName) || "application/octet-stream",
                        "Content-Length": dataLength,
                    },
                }), this.context.cancellationToken, requestProcessor);
            }
            catch (e) {
                if (e.statusCode === 422) {
                    builder_util_1.log.warn({ file: fileName, reason: "already exists on Custom" }, "overwrite published file");
                    return Promise.resolve();
                }
                if (e.statusCode === 423) {
                    builder_util_1.log.warn(`${fileName} upload fail`);
                }
                if (attemptNumber > 3) {
                    return Promise.reject(e);
                }
                else {
                    return new Promise((resolve, reject) => {
                        const newAttemptNumber = attemptNumber + 1;
                        setTimeout(() => {
                            this.doUploadFile(newAttemptNumber, uploadPath, fileName, dataLength, requestProcessor)
                                .then(resolve)
                                .catch(reject);
                        }, newAttemptNumber * 2000);
                    });
                }
            }
        });
    }
    toString() {
        var _a, _b, _c, _d;
        return `Custom (owner: ${(_b = (_a = this.metadata) === null || _a === void 0 ? void 0 : _a.author) === null || _b === void 0 ? void 0 : _b.name}, project: ${(_c = this.metadata) === null || _c === void 0 ? void 0 : _c.name}, version: ${(_d = this.metadata) === null || _d === void 0 ? void 0 : _d.version})`;
    }
}
exports.CustomPublisher = CustomPublisher;
