# ArcheBase Physical AI Handbook

Physical AI 学习手册：从公共概率语言出发，沿 VLA、世界模型、价值学习、分层智能、数据表征、动力学控制和可信系统七条路线学习机器人智能。

在线阅读：[archebase.github.io/physical-ai-handbook](https://archebase.github.io/physical-ai-handbook/)

## 本地运行

```bash
npm install
npm run sync
npm run dev
```

`npm run sync` 使用本机已授权的 `lark-cli`，从飞书文档目录同步正文、课程树、公式、Mermaid 图和内部链接。电子书仓库不依赖飞书运行；发布产物是普通静态站点。

## Demo 数据

本仓库只提供用于理解数据格式和跑通工具链的 Demo 数据、Schema、合成样例和校验工具，不包含可用于正式训练的完整机器人数据集。详见 [`docs/data/demo-data.md`](docs/data/demo-data.md)。

### Demo 数据与社区入口

- Demo 数据：[robodata.archebase.ai](https://robodata.archebase.ai)
- 飞书交流群：**链接待补**（替换为飞书群邀请链接）
- 数据申请 / 合作表单：**链接待补**（替换为申请表单链接）

`robodata.archebase.ai` 用于提供可公开体验的 Demo 数据，不是本电子书的部署域名。GitHub 仓库中的样例仅用于格式演示、解析测试和教学验证。

## 许可

课程正文和代码的最终许可需要 ArcheBase 确认后填写。Demo 数据必须单独声明许可，不因代码仓库公开而自动获得可再分发权或生产使用权。
