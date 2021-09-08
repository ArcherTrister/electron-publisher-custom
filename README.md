# electron-publisher-custom

先吐槽一番，实在不想要这个名字！！！！！！！！！！！！！！

不过我已经尽力了，issue不被采纳，可能是我撇脚的英语吧😂😂😂

[详情](https://github.com/electron-userland/electron-builder/issues/6098)

WebPack 打包暂未实现，请忽略掉

# Plan

1. 增加是否强制更新参数
2. 增加更新说明参数


## 使用方式

### 安装
### ①【npm版本大于等于7】

- 克隆本项目
  
> git clone https://github.com/ArcherTrister/electron-publisher-custom

- 全局 link

在本项目根目录下运行
> npm link

或直接执行 **package** 中的脚本 link

- 项目 link

转到自己项目根目录下运行

> npm link electron-publisher-custom --save

### ②【需注意link目录层级】

- 克隆本项目
  
> git clone https://github.com/ArcherTrister/electron-publisher-custom

- 项目 link

转到自己项目根目录下运行

> npm link ../../electron-publisher-custom

### ③ 【推荐】

- npm安装

> npm install github:ArcherTrister/electron-publisher-custom

or

> npm install git+https://github.com/ArcherTrister/electron-publisher-custom.git

### ④

- 修改tsconfig中outFile配置为 **electron-publisher-custom.js**，将生成的文件放到项目 **buildResourcesDir** 下

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
        "url": "http://localhost",
        "updaterPath": "/api/application/upload/${productName}/${os}"
      }
    ],
  }

  // 需注意，打包脚本需使用 -p 参数才能应用自定义发布
  // updaterPath 参数可为空，则使用默认值 `/api/app/upload/${this.metadata?.version}/${Arch[arch]}`
  // updaterPath 如需自定义请确认以 / 开头

```

### 后端示例

``` csharp

        /// <summary>
        /// ApplicationAutoUpload
        /// </summary>
        /// <param name="appName">Application Name</param>
        /// <param name="os"></param>
        /// <param name="version"></param>
        /// <param name="arch"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("upload/{appName}/{os}/{version}/{arch}", Name = "ApplicationAutoUploadByVersion")]
        [DisableRequestSizeLimit]
        //[DisableFormValueModelBinding]
        public async Task<IActionResult> Upload(string appName, string os, string version, string arch)
        {
            // TODO: token 限制上传 etc.

            Request.Headers.TryGetValue("X-File-Name", out StringValues hFileName);
            var fileName = StringValues.IsNullOrEmpty(hFileName) ? throw new System.ArgumentNullException("Request Header item X-File-Name value is null!") : hFileName.ToString();

            var filePath = Path.Combine(_webHostEnvironment.ContentRootPath, "Apps", appName, os, version, arch, fileName);
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
            // 入库操作，示例使用内存代替
            VersionInfo versionInfo = new()
            {
                AppName = appName,
                Version = new Version(version),
                Arch = arch,
                OS = os,
                FileName = fileName,
                FileType = Path.GetExtension(fileName)
            };
            versionDic.Add(versionInfo.Id, versionInfo);
            return Ok("上传完成！");
        }

```