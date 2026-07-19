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

## 数据开放

本仓库只放公开可复现所需的目录、Schema、样例和校验工具；大体量机器人数据不放进 Git 历史，按照 [`docs/data/open-data-plan.md`](docs/data/open-data-plan.md) 通过 GitHub Release、对象存储或 Hugging Face 分发，并附带版本、校验和、许可及脱敏说明。

### Demo 数据与申请入口

- Demo 数据：[robodata.archebase.ai](https://robodata.archebase.ai)
- 飞书交流群：**链接待补**（替换为飞书群邀请链接）
- 免费数据申请表单：**链接待补**（替换为申请表单链接）

`robodata.archebase.ai` 用于提供可公开体验的 Demo 数据，不是本电子书的部署域名。免费数据的实际开放范围以授权、脱敏、质量检查和申请审核结果为准。

## 许可

课程正文和代码的最终许可需要 ArcheBase 确认后填写。数据集必须单独声明许可，不因代码仓库公开而自动获得可再分发权。
