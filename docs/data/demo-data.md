# Demo 数据说明

本项目公开的是用于教学和工具链验证的 Demo 数据，不是可用于正式训练的完整机器人数据集。

## 获取入口

- Demo 数据站点：[robodata.archebase.ai](https://robodata.archebase.ai)
- 仓库内合成样例：`docs/public/downloads/sample-episodes.jsonl`
- 数据申请 / 合作表单：**链接待补**

## GitHub 仓库包含什么

- [`episode.schema.json`](./schema/episode.schema.json)：Episode 数据结构约定；
- 合成、无真实机器人隐私的 JSONL 样例；
- 数据格式校验脚本；
- 课程中与数据采集、评测和复现相关的说明。

仓库中的样例用于演示字段含义、解析流程和校验方式。样例规模、任务覆盖和数据分布不代表 ArcheBase 完整数据资产。

## 使用边界

1. 不把 Demo 数据描述为完整、免费或可直接用于生产训练的数据集。
2. 不根据 Demo 数据推断真实数据资产的数量、质量或覆盖范围。
3. Demo 数据的许可与课程代码许可分开管理。
4. 如需进一步的数据合作，通过申请表单与 ArcheBase 联系。
