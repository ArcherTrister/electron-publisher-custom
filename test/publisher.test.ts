// import { Platform } from "app-builder-lib"
// import { createPublisher } from "app-builder-lib/out/publish/PublishManager"
// import { BitbucketPublisher } from "app-builder-lib/out/publish/BitbucketPublisher"
// import { KeygenPublisher } from "app-builder-lib/out/publish/KeygenPublisher"
// import { SnapStorePublisher } from "app-builder-lib/out/publish/SnapStorePublisher"
// import { ExpectStatic } from "vitest"
// import http from "http";
// import { GitHubPublisher } from "electron-publish/out/gitHubPublisher"
import { Arch } from "builder-util"
import { BitbucketOptions, CancellationToken, HttpError, KeygenOptions, S3Options, SpacesOptions } from "builder-util-runtime"
import { publishArtifactsWithOptions } from "electron-builder"
import { PublishContext } from "electron-publish"
import * as path from "path"
import * as CustomePublisher from "../src/index"


function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function versionNumber() {
  return `${getRandomInt(0, 99)}.${getRandomInt(0, 99)}.${getRandomInt(0, 99)}`
}

//noinspection SpellCheckingInspection
const token = Buffer.from("Y2Y5NDdhZDJhYzJlMzg1OGNiNzQzYzcwOWZhNGI0OTk2NWQ4ZDg3Yg==", "base64").toString()
const icnsPath = path.join(__dirname, "files", "icon.icns")
const icoPath = path.join(__dirname, "files", "icon.ico")

const publishContext: PublishContext = {
  cancellationToken: new CancellationToken(),
  progress: null,
}

describe('PrivateServer upload', () => {
  const version = versionNumber();
  test('upload', async () => {
    const timeout = 0
    const config: CustomePublisher.CustomOptions = {
      endpoint: "http://localhost:5500",
      projectId: "3a1aff52-e734-8081-3196-40dcf886c941",
      secret: "a4ccaf061fb1a713ed5798bc13e96ea13ec28b0762a020278c6653ccae8097b1",
      channel: "stable",
      productVersion: version,
      authScheme: "VmBasic",
      provider: "custom",
      timeout,
    }
    const publisher = new CustomePublisher.default(publishContext, config)
    const filename = await publisher.upload({ file: icnsPath, arch: Arch.x64, timeout })
    expect(filename).toEqual("icon.icns");
  });

  test('delete release', async () => {
    const timeout = 0
    const config: CustomePublisher.CustomOptions = {
      endpoint: "http://localhost:5500",
      projectId: "3a1aff52-e734-8081-3196-40dcf886c941",
      secret: "a4ccaf061fb1a713ed5798bc13e96ea13ec28b0762a020278c6653ccae8097b1",
      channel: "stable",
      productVersion: version,
      authScheme: "VmBasic",
      provider: "custom",
      timeout,
    }
    const publisher = new CustomePublisher.default(publishContext, config)
    await publisher.deleteRelease("icon.icns")
  });

  // test('upload', async () => {
  //   const timeout = 10
  //   const publisher = new CustomePublisher(publishContext, {
  //     endpoint: "http://localhost:5500",
  //     appId: "CDD76FBA-6217-F1F8-E5D5-CDA070D4DC3A",
  //     secret: "qwe",
  //     productVersion: versionNumber(),
  //     provider: "custom",
  //     timeout,
  //   } as CustomOptions)
  //   //const filename = await publisher.upload({ file: icoPath, arch: Arch.x64, timeout })
  //   //expect(filename).toEqual("icon.ico");
  //   expect(await publisher.upload({ file: icoPath, arch: Arch.x64, timeout })).toThrow("Request timed out");
  // });

  test('show custom publisher', async () => {
    const timeout = 0
    const config: CustomePublisher.CustomOptions = {
      endpoint: "http://localhost:5500",
      projectId: "3a1aff52-e734-8081-3196-40dcf886c941",
      secret: "a4ccaf061fb1a713ed5798bc13e96ea13ec28b0762a020278c6653ccae8097b1",
      channel: "stable",
      productVersion: version,
      authScheme: "VmBasic",
      headers: { __tenant: "123" },
      provider: "custom",
      timeout,
    }
    const publisher = new CustomePublisher.default(publishContext, config)
    
    expect(publisher.toString()).toMatch(config.endpoint);
  })
})