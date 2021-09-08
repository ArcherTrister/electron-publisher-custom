"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const nodeHttpExecutor_1 = require("builder-util/out/nodeHttpExecutor");
const mime = __importStar(require("mime"));
const url_1 = require("url");
const electron_publish_1 = require("electron-publish");
class CustomPublisher extends electron_publish_1.HttpPublisher {
    constructor(context, configuration) {
        var _a, _b, _c;
        super(context);
        this.configuration = configuration;
        this.providerName = "PrivateServer";
        const publishContext = context;
        this.metadata = (_a = publishContext === null || publishContext === void 0 ? void 0 : publishContext.packager) === null || _a === void 0 ? void 0 : _a.metadata;
        if (this.configuration.url === null ||
            this.configuration.url === undefined ||
            this.configuration.url === "") {
            throw new Error(`The ${(_c = (_b = this.configuration) === null || _b === void 0 ? void 0 : _b.provider) !== null && _c !== void 0 ? _c : "custom"} configuration item URL cannot be null`);
        }
        const parsedUrl = (0, url_1.parse)(this.configuration.url);
        this.hostname = parsedUrl.hostname;
        this.protocol = parsedUrl.protocol;
        this.port = parsedUrl.port;
    }
    doUpload(fileName, arch, dataLength, requestProcessor, file) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.version) === null ||
                ((_b = this.metadata) === null || _b === void 0 ? void 0 : _b.version) === undefined ||
                ((_c = this.metadata) === null || _c === void 0 ? void 0 : _c.version) === "") {
                return Promise.reject(`The package configuration item Version cannot be null`);
            }
            else {
                let uploadPath;
                if (this.configuration.updaterPath === null ||
                    this.configuration.updaterPath === undefined ||
                    this.configuration.updaterPath === "") {
                    uploadPath = `/api/app/upload/${(_d = this.metadata) === null || _d === void 0 ? void 0 : _d.version}/${builder_util_1.Arch[arch]}`;
                }
                else {
                    uploadPath = `${this.configuration.updaterPath}/${(_e = this.metadata) === null || _e === void 0 ? void 0 : _e.version}/${builder_util_1.Arch[arch]}`;
                }
                return yield this.doUploadFile(0, uploadPath, fileName, dataLength, requestProcessor);
            }
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
                if (e.statusCode === 422 &&
                    e.description != null &&
                    e.description.errors != null &&
                    e.description.errors[0].code === "already_exists") {
                    builder_util_1.log.warn({ file: fileName, reason: "already exists on Custom" }, "overwrite published file");
                }
                if (attemptNumber > 3) {
                    return Promise.reject(e);
                }
                else {
                    return new Promise((resolve, reject_1) => {
                        const newAttemptNumber = attemptNumber + 1;
                        setTimeout(() => {
                            this.doUploadFile(newAttemptNumber, uploadPath, fileName, dataLength, requestProcessor)
                                .then(resolve)
                                .catch(reject_1);
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
module.exports = CustomPublisher;
