# electron-publisher-custom

先吐槽一番，实在不想要这个名字！！！！！！！！！！！！！！

不过我已经尽力了，issue 不被采纳，可能是我撇脚的英语吧 😂😂😂

[详情](https://github.com/electron-userland/electron-builder/issues/6098)

WebPack 打包暂未实现，请忽略掉

# Plan

1. 增加是否强制更新参数
2. 增加更新说明参数
3. 增加上传 auth

## 使用方式

### 安装

### ①【npm 版本大于等于 7】

- 克隆本项目

> git clone https://github.com/ArcherTrister/electron-publisher-custom

> git clone https://gitee.com/ArcherTrister/electron-publisher-custom

- 全局 link

在本项目根目录下运行

> npm link

或直接执行 **package** 中的脚本 link

- 项目 link

转到自己项目根目录下运行

> npm link electron-publisher-custom --save

### ②【需注意 link 目录层级】

- 克隆本项目

> git clone https://github.com/ArcherTrister/electron-publisher-custom

> git clone https://gitee.com/ArcherTrister/electron-publisher-custom

- 项目 link

转到自己项目根目录下运行

> npm link ../../electron-publisher-custom

### ③ 【推荐】

- npm 安装

> npm install github:ArcherTrister/electron-publisher-custom

or

> npm install git+https://github.com/ArcherTrister/electron-publisher-custom.git

or

> npm install git+https://gitee.com/ArcherTrister/electron-publisher-custom.git

### ④

～～ - 修改 tsconfig 中 outFile 配置为 **electron-publisher-custom.js**，将生成的文件放到项目 **buildResourcesDir** 下 ～～

- 检查`node_modules`文件夹下刚刚安装的`electron-publisher-custom`包，如果这个包的依赖没有安装成功，在此包文件夹下执行 `npm i` or `yarn` 安装一下依赖
- 在 build 文件夹下创建`electron-publisher-custom.js`文件，并拷贝下面代码到此文件

```javascript
// build/electron-publisher-custom.js
const CustomPublisher = require("electron-publisher-custom");
module.exports = CustomPublisher;
```

### 配置

package.json

```json
  "scripts": {
    "dist:win:ia32": "electron-builder -w --ia32 -p always"
  },
  "build": {
    "publish": [
      {
        "provider": "custom",
        "providerName": "PrivateServer",
        "channel": "latest",
        "url": "http://localhost:port",
        "updaterPath": "/upload"
      }
    ],
  }

```

```

  // 需注意，打包脚本需使用 -p 参数才能应用自定义发布
  // eg: electron-builder -w --ia32 -p always
  // channel 为空，则使用默认值 `latest`
  // updaterPath 为空，则使用默认值 `/upload`
  // updaterPath 如需自定义请确认以 / 开头
  // 最终上传路由 `{updaterPath}/{productName|name}/{version}/{platform}/{arch}/{channel}`

```

### 后端示例

```csharp

        /// <summary>
        /// Electron Uploader
        /// </summary>
        /// <param name="appName">Application Name</param>
        /// <param name="version"></param>
        /// <param name="platform"></param>
        /// <param name="arch"></param>
        /// <param name="channel"></param>
        /// <returns></returns>
        [HttpPost("/upload/{appName}/{version}/{platform}/{arch}/{channel}", Name = "ElectronUploader")]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> ElectronUploader(string appName, string version, string platform, string arch, string channel)
        {
            // TODO: token 限制上传 etc.

            Request.Headers.TryGetValue("X-File-Name", out StringValues hFileName);
            var fileName = StringValues.IsNullOrEmpty(hFileName) ? throw new System.ArgumentNullException("Request Header item X-File-Name value is null!") : hFileName.ToString();

            var filePath = Path.Combine(_webHostEnvironment.ContentRootPath, "Apps", appName, platform, version, arch, fileName);
            if (System.IO.File.Exists(filePath))
            {
                return Ok("文件已存在！");
            }
            var dir = Path.GetDirectoryName(filePath);
            if (!System.IO.Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
            using (var targetStream = System.IO.File.Create(filePath))
            {
                await Request.Body.CopyToAsync(targetStream);
            }
            // string[] fileTypes = new string[] { ".dmg",".zip",".deb",".exe",".pkg" };
            var fileType = Path.GetExtension(fileName);
            if (fileTypes.Contains(fileType))
            {
                VersionInfo versionInfo = new()
                {
                    AppName = appName,
                    Version = new Version(version),
                    Arch = arch,
                    Platform = platform,
                    Channel = channel,
                    FileName = fileName,
                    FileType = fileType,
                    Size = Request.Body.Length,
                    Hash = GetHash(Request.Body.ToBytes(), "sha512", "base64"),
                    ReleaseDate = DateTime.Now
                };
                versionDic.Add(versionInfo.Id, versionInfo);
            }
            return Ok();
        }

        /// <summary>
        /// Mac App Check Updater
        /// </summary>
        /// <param name="appName"></param>
        /// <param name="platform"></param>
        /// <param name="arch"></param>
        /// <param name="channel"></param>
        /// <returns></returns>
        [HttpGet("/update/{appName}/{platform}/{arch}/{channel}-mac.yml", Name = "ElectronUpdaterMac")]
        public async Task<IActionResult> ElectronUpdaterMac(string appName, string platform, string arch, string channel)
        {
            // TODO: token 限制访问 etc.
            var versionInfo = versionDic.Values?.Where(p => p.AppName.Equals(appName, StringComparison.OrdinalIgnoreCase)
            && p.Platform.Equals(platform, StringComparison.OrdinalIgnoreCase) && p.Arch.Equals(arch, StringComparison.OrdinalIgnoreCase)).OrderByDescending(p=>p.Version).FirstOrDefault();
            if (versionInfo != null)
            {
                var downloadPath = $"/download/{appName}/{versionInfo.Version}/{platform}/{arch}/{channel}/{versionInfo.FileName}";
                var latestMacYml = $"version: {versionInfo.Version}"+
                                $"\nfiles:"+
                                $"\n  - url: {downloadPath}"+
                                $"\n    sha512: {versionInfo.Hash}"+
                                $"\n    size: {versionInfo.Size}"+
                                $"\npath: {downloadPath}"+
                                $"\nsha512: {versionInfo.Hash}"+
                                $"\nreleaseDate: '{versionInfo.ReleaseDate}'";
                return Content(await Task.FromResult(latestMacYml));
            }
            return NotFound();
        }

        /// <summary>
        /// Electron Downloader
        /// </summary>
        /// <param name="appName"></param>
        /// <param name="platform"></param>
        /// <param name="arch"></param>
        /// <param name="channel"></param>
        /// <returns></returns>
        [HttpGet("/download/{appName}/{platform}/{arch}/{channel}/{filename?}", Name = "ElectronDownloader")]
        public async Task<IActionResult> ElectronDownloader(string appName, string platform, string arch, string channel)
        {
            var versionInfo = versionDic.Values?.Where(p => p.AppName.Equals(appName, StringComparison.OrdinalIgnoreCase)
            && p.Platform.Equals(platform, StringComparison.OrdinalIgnoreCase) && p.Arch.Equals(arch, StringComparison.OrdinalIgnoreCase)).OrderByDescending(p => p.Version).FirstOrDefault();
            if (versionInfo != null)
            {
                var filePath = Path.Combine(_webHostEnvironment.ContentRootPath, "Apps", appName, platform, versionInfo.Version.ToString(), arch, versionInfo.FileName);
                return File(filePath, MediaTypeNames.Application.Octet, versionInfo.FileName);
            }
            return NotFound();
        }

```
