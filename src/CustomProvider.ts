// "electron-updater": "^5.3.0",

// import {
//   CustomPublishOptions,
//   UpdateInfo,
//   HttpError,
//   newError,
// } from "builder-util-runtime";
// import { AppUpdater } from "electron-updater/out/AppUpdater";
// import {
//   parseUpdateInfo,
//   Provider,
//   ProviderRuntimeOptions,
//   resolveFiles,
// } from "electron-updater/out/providers/Provider";
// import { getChannelFilename, newUrlFromBase } from "electron-updater/out/util";
// import { ResolvedUpdateFileInfo } from "electron-updater";
// import { URL } from "url";

// export function newBaseUrl(url: string): URL {
//   const result = new URL(url);
//   if (!result.pathname.endsWith("/")) {
//     result.pathname += "/";
//   }
//   return result;
// }

// export class CustomProvider extends Provider<UpdateInfo> {
//   private readonly baseUrl = newBaseUrl(this.configuration.url);

//   constructor(
//     private readonly configuration: CustomPublishOptions,
//     private readonly updater: AppUpdater,
//     runtimeOptions: ProviderRuntimeOptions
//   ) {
//     super(runtimeOptions);
//   }

//   private get channel(): string {
//     const result = this.updater.channel || this.configuration.channel;
//     return result == null
//       ? this.getDefaultChannelName()
//       : this.getCustomChannelName(result);
//   }

//   async getLatestVersion(): Promise<UpdateInfo> {
//     const channelFile = getChannelFilename(this.channel);
//     const channelUrl = newUrlFromBase(channelFile, this.baseUrl, true);
//     for (let attemptNumber = 0; ; attemptNumber++) {
//       try {
//         return parseUpdateInfo(
//           await this.httpRequest(channelUrl),
//           channelFile,
//           channelUrl
//         );
//       } catch (e: any) {
//         if (e instanceof HttpError && e.statusCode === 404) {
//           throw newError(
//             `Cannot find channel "${channelFile}" update info: ${
//               e.stack || e.message
//             }`,
//             "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND"
//           );
//         } else if (e.code === "ECONNREFUSED") {
//           if (attemptNumber < 3) {
//             await new Promise((resolve, reject) => {
//               try {
//                 setTimeout(resolve, 1000 * attemptNumber);
//               } catch (e) {
//                 reject(e);
//               }
//             });
//             continue;
//           }
//         }
//         throw e;
//       }
//     }
//   }

//   resolveFiles(updateInfo: UpdateInfo): Array<ResolvedUpdateFileInfo> {
//     return resolveFiles(updateInfo, this.baseUrl);
//   }
// }
