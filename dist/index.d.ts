import { CustomPublishOptions } from "builder-util-runtime";
export interface CustomConfig extends CustomPublishOptions {
    url: string;
    uploadPath?: string;
}
