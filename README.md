# Web PDF Merger

一个基于网页的PDF合并工具，允许用户选择多个PDF文件，指定每份文档的页面范围，并将它们合并成一个新的PDF文件。

## 功能特性

- 支持同时处理最多10个PDF文件
- 可以为每个文件指定页面范围（起始页和结束页）
- 动态添加/删除文件输入区域
- 实时预览和验证页面范围
- 完全在浏览器中运行，无需上传文件到服务器
- 纯前端实现，数据安全性高

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- [PDF-lib](https://github.com/Hopding/pdf-lib) - 用于PDF操作的JavaScript库

## 使用方法

### 本地运行

1. 克隆或下载此仓库
2. 启动HTTP服务器（如Python的内置服务器）

```bash
cd web-pdf-merger
python3 -m http.server 8000
```

3. 访问 `http://localhost:8000`

### 部署到服务器

将整个项目目录上传到任何支持HTTP服务的Web服务器即可。

## 注意事项

- 所有PDF处理都在客户端浏览器中进行，文件不会上传到任何服务器
- 建议使用现代浏览器以获得最佳体验
- 处理大文件时可能需要较长时间，请耐心等待

## 许可证

MIT License