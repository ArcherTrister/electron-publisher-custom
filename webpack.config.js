const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/, // ts-loader是官方提供的处理tsx的文件
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx'], //后缀名自动补全
  },
  // node: {
  //   fs:'empty'
  // },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "electron-publisher-custom.js",
  },
};
