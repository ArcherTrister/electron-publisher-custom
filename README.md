# electron-publisher-custom

# CustomPublisher 使用说明文档

## 概述

`CustomPublisher` 是一个用于 Electron 应用的自定义发布器，它允许用户将构建好的应用上传到指定的服务器端点。该类继承自 `electron-publish` 中的 `HttpPublisher` 类，并提供了特定于应用程序的配置选项和方法。

## 安装依赖

确保你的项目中已经安装了以下依赖：

```bash
npm install builder-util builder-util-runtime electron-publish form-data mime fs-extra
```

## 配置 CustomPublisher

### 构造函数参数

要使用 `CustomPublisher`，你需要提供一个包含必要信息的 `CustomOptions` 对象给构造函数。这些信息包括但不限于：

- `endpoint`: 发布目标的 API 端点。
- `basePath`: 基础路径 (如 `/api/repositories`)，默认为 `/api/public-app-edition`。
- `projectId`: 仓库 ID。
- `secret`: 密钥。
- `channel`: 发布通道（如 `stable`, `beta`），默认为 `latest`。
- `productVersion`: 产品的版本号（不能以 "v" 开头）。
- `authScheme`（可选）: 认证方案，默认为 `token`。
- `headers`（可选）: 自定义 HTTP 头部信息。

### 示例配置

```javascript
const { CustomPublisher } = require("./path/to/CustomPublisher");
const { PublishContext } = require("electron-publish");

const publishContext = new PublishContext(/* context options */);
const customOptions = {
  endpoint: "https://your-custom-server.com",
  projectId: "yourRepositoryId",
  secret: "yourSecretKey",
  channel: "stable",
  productVersion: "1.0.0",
  authScheme: "Bearer",
  headers: {
    "X-Custom-Header": "customHeaderValue"
  }
};

const publisher = new CustomPublisher(publishContext, customOptions);
```

## 主要功能

### 上传文件

通过 `doUpload` 方法可以将文件上传到指定的服务器端点。

#### 参数

- `fileName`: 文件名。
- `arch`: 架构类型（如 `x64`, `arm64`）。
- `_dataLength`: 数据长度（内部使用）。
- `_requestProcessor`: 请求处理器（内部使用）。
- `file`: 文件路径。

#### 示例

```javascript
await publisher.doUpload("app-x64.zip", "x64", null, null, "/path/to/app-x64.zip");
```

### 删除发布

使用 `deleteRelease` 方法可以从服务器上删除某个版本的应用。

#### 参数

- `fileName`: 文件名。
- `channel`（可选）: 发布通道，默认为配置中的值。
- `version`（可选）: 版本号，默认为配置中的值。

#### 示例

```javascript
await publisher.deleteRelease("app-x64.zip", "beta", "1.0.0");
```

## 辅助方法

### convertAppPassword

静态方法，用于生成基于用户名和密码的 Base64 编码认证字符串。

#### 参数

- `authScheme`: 认证方案。
- `projectId`: 仓库 ID。
- `secret`: 密钥。

#### 示例

```javascript
const authString = CustomPublisher.convertAppPassword("Basic", "yourOwnerId", "yourSecretKey");
console.log(authString); // 输出类似 "Basic dXNlck9iamVjdDpzZWNyZXQ="
```

## 注意事项

- 确保提供的版本号不以 "v" 开头，否则会抛出异常。
- 在上传大文件时，考虑设置合理的超时时间以避免请求被中断。
- 完整的上传路径为 `${basePath}/upload`

## 使用方式

### 安装

### ① 【推荐】

- npm 安装

> npm install github:ArcherTrister/electron-publisher-custom#v1.0.0


### ②【npm 版本大于等于 7】

- 克隆本项目

> git clone https://github.com/ArcherTrister/electron-publisher-custom


- 全局 link

在本项目根目录下运行

> npm link

或直接执行 **package** 中的脚本 link

- 项目 link

转到自己项目根目录下运行

> npm link electron-publisher-custom --save

### ③【需注意 link 目录层级】

- 克隆本项目

> git clone https://github.com/ArcherTrister/electron-publisher-custom


- 项目 link

转到自己项目根目录下运行

> npm link ../../electron-publisher-custom


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
        "channel": "latest",
        "endpoint": "http://localhost:5500",
        "basePath": "/api/app",
        "projectId": "3a1aff52-e734-8081-3196-40dcf886c941",
        "secret": "123456",
        "productVersion": ${version},
        "authScheme": "VmBasic",
        "headers": { "xxx": "123" },
      }
    ],
  }

```

### 后端示例
