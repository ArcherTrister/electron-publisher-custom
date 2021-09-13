import { CustomPublishOptions } from "builder-util-runtime";
export interface CustomConfig extends CustomPublishOptions {
    url: string;
    updaterPath?: string;
    channel?: string;
}
