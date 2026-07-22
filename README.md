# ArcheBase Physical AI Handbook

Physical AI 学习手册：从公共概率语言出发，沿 VLA、世界模型、价值学习、分层智能、数据表征、动力学控制和可信系统七条路线学习机器人智能。站点提供完整的中英文版本。

在线阅读：[archebase.github.io/physical-ai-handbook](https://archebase.github.io/physical-ai-handbook/)

## 本地运行

```bash
npm install
npm run sync
npm run translate:en
npm run dev
```

`npm run sync` 使用本机已授权的 `lark-cli`，从飞书文档目录同步正文、课程树、公式、Mermaid 图和内部链接。电子书仓库不依赖飞书运行；发布产物是普通静态站点。

## 中英文内容工作流

中文正文以飞书课程树为内容源，发布在站点根路径；英文版发布在 `/en/`，由仓库中的翻译脚本和 manifest 独立维护：

- `npm run sync`：只更新中文正文，不覆盖英文文件。
- `npm run translate:en`：仅翻译新增或中文哈希已变化的页面；需要 `OPENAI_API_KEY`，可用 `OPENAI_TRANSLATION_MODEL` 指定模型。
- `npm run validate:i18n`：检查中英文页面一一对应、翻译是否过期、英文内部链接和明显的未翻译中文。
- `npm run build`：构建两个 locale；CI 构建不需要翻译 API 或飞书凭证。

翻译过程会保护公式、代码、URL、资源路径和源修订元数据，并翻译 Mermaid 图中的可读标签。英文页面与中文页面保持相同相对路径，以便语言切换器在对应章节间跳转。

## Demo 数据

本仓库只提供用于理解数据格式和跑通工具链的 Demo 数据、Schema、合成样例和校验工具，不包含可用于正式训练的完整机器人数据集。详见 [`docs/data/demo-data.md`](docs/data/demo-data.md)。

### Demo 数据与社区入口

- Demo 数据：[robodata.archebase.ai](https://robodata.archebase.ai)
- 飞书交流群（仅限 ArcheBase 企业内部成员）：[加入群聊](https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=5acga295-8b98-476b-83a9-c07cb2453cea&qr_code=true)
- 数据申请 / 合作表单：[填写申请表](https://archebase.feishu.cn/share/base/shrcnsMcwWICUVdNeutlRWhqyD5)

`robodata.archebase.ai` 用于提供可公开体验的 Demo 数据，不是本电子书的部署域名。GitHub 仓库中的样例仅用于格式演示、解析测试和教学验证。

## 许可

除另有注明的第三方引用和素材外，本电子书所有课程文章正文均采用 [Apache License 2.0](LICENSE-CONTENT) 发布，Copyright 2026 ArcheBase。

该许可不自动适用于 ArcheBase Logo、商标、第三方图片与引用内容。Demo 数据按其自身记录的许可使用；当前合成样例声明为 `CC0-1.0`。
