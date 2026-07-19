---
title: "A3.6｜OpenPI 实践：从数据契约到机器人闭环"
sourceToken: LJ64dCo1pocD71xb2XvcPN9lndr
sourceRevision: 8
license: Apache-2.0
---

> [飞书原文](https://archebase.feishu.cn/docx/LJ64dCo1pocD71xb2XvcPN9lndr) · 源修订 8

::: tip 💡
**本章目标：** 把论文机制映射到可执行的训练管线，并明确 ArcheBase 应该生产什么数据、元数据和评测证据。
:::

# 1. OpenPI 当前提供什么

- **公开模型：** π0、π0-FAST 和 π0.5；当前 openpi 不等于 Physical Intelligence 全部已发布模型。
- **π0.5 限制：** 公开仓库的 π0.5 训练与推理目前只支持 Flow Matching head，不提供完整 FAST 预训练配方。
- **框架：** 原生 JAX 路径与 π0、π0.5 的 PyTorch 实现；PyTorch 当前不支持 π0-FAST、LoRA、FSDP、混合精度和 EMA。
- **基础 checkpoint：** 官方说明使用超过一万小时机器人数据预训练，并提供 DROID、ALOHA、LIBERO 等适配或微调示例。
- **资源门槛：** 官方单卡估计为推理超过 8 GB、LoRA 微调超过 22.5 GB、全量微调超过 70 GB 显存；实际消耗随配置变化。
- **系统接口：** LeRobot 数据转换、归一化资产、训练配置和远程 Policy Server。

这些是当前公开 README 的能力边界。课程不把未进入 openpi 的 π0.6\*、π0.7 功能写成开源仓库已支持。

# 2. 最小训练闭环

1. 将原始数据转成 LeRobot Dataset。
2. 定义 observation、state、action 与 prompt 的字段映射。
3. 计算状态和动作归一化统计。
4. 选择 π0 或 π0.5 Base Checkpoint。
5. 执行 LoRA 或全量微调。
6. 启动 Policy Server，在仿真或真实机器人上闭环评测。

```bash
uv run scripts/compute_norm_stats.py --config-name pi05_libero
XLA_PYTHON_CLIENT_MEM_FRACTION=0.9 uv run scripts/train.py pi05_libero --exp-name=my_experiment
uv run scripts/serve_policy.py policy:checkpoint --policy.config=pi05_libero --policy.dir=checkpoints/pi05_libero/my_experiment/20000
```

## 2.1 归一化是模型与机器人之间的契约

OpenPI 同时支持标准分数归一化和分位数归一化。标准分数形式为：

$$\tilde a_j=\frac{a_j-\mu_j}{\sigma_j+10^{-6}}$$

> **读法：** 第 j 维动作减去训练数据均值，再除以标准差和一个防止除零的小常数。

**推导：** 中心化消除不同动作维度的偏置，除以标准差使各维度具有近似相同尺度，避免大数值维度主导损失。

分位数形式使用训练集第 1 和第 99 百分位：

$$\tilde a_j=2\frac{a_j-q_{01,j}}{q_{99,j}-q_{01,j}+10^{-6}}-1$$

> **读法：** 把动作相对第 1 和第 99 百分位的位置线性映射到约负一到正一的范围。

**推导：** 先把分位区间映射到零到一，再乘二减一。分位数比最小最大值更不容易被少量离群点控制，但超出区间的值仍需在数据和控制端明确处理。

推理必须使用与 checkpoint 绑定的同一统计量进行反归一化。维度顺序、单位或 gripper 方向错误不会触发张量报错，却会直接改变真实动作。

## 2.2 远程 Policy Server 的延迟预算

$$T_{\mathrm{loop}}=T_{\mathrm{capture}}+T_{\mathrm{encode}}+T_{\mathrm{network}}+T_{\mathrm{infer}}+T_{\mathrm{decode}}+T_{\mathrm{control}}$$

> **读法：** 机器人完整闭环延迟等于采集、预处理、网络传输、模型推理、动作解码和控制执行各阶段延迟之和。

**推导：** 这些阶段在一次请求链中串行发生，因此总延迟相加。部署应报告 P50、P95 和 P99，而不是只报告平均推理时间。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBSW+WOn+WniyBFcGlzb2RlIOS4juaXtumXtOaIs10gLS0+IExbTGVSb2JvdCDmlbDmja7pm4ZdCiAgICBMIC0tPiBNW+Wtl+auteaYoOWwhOS4juWKqOS9nOivreS5iV0KICAgIE0gLS0+IE5b5b2S5LiA5YyW57uf6K6hXQogICAgTiAtLT4gVFvlvq7osIPphY3nva7kuI4gQ2hlY2twb2ludF0KICAgIFQgLS0+IFNbUG9saWN5IFNlcnZlcl0KICAgIFMgLS0+IEFb5Y+N5b2S5LiA5YyWL+WdkOagh+mAgumFjS/pmZDkvY1dCiAgICBBIC0tPiBDW+acuuWZqOS6uuaOp+WItuWZqF0KICAgIEMgLS0+IE9b6Zet546v5pel5b+X5LiO5aSx6LSlXQogICAgTyAtLT4gUg==" />

# 3. 数据格式不是最难的部分

把数据转换成 LeRobot 只能解决“能否读入”。真正决定训练结果的是动作坐标系、控制频率、相机标定、时间同步、任务语言、失败标签和训练测试切分。

# 4. ArcheBase 应该沉淀的最小数据对象

| 数据对象 | 为什么重要 |
|-|-|
| 逐帧多视角图像 | 支持单帧语义、视觉状态和跨视角判断 |
| 机器人与穿戴设备状态 | 提供动作、姿态、接触和人类操作上下文 |
| 统一时间轴 | 保证图像、动作、力和事件可对齐 |
| 任务与子任务边界 | 训练 π0.5 式层级策略 |
| 失败与人工接管 | 支持 π0.6\* 的纠正和经验学习 |
| 质量与策略元数据 | 支持 π0.7 式 steerable conditioning |
| 数据血缘和版本 | 定位训练样本、算子、模型和评测结果 |

# 5. QC 与 VLM 算子如何进入生产

单帧 QC 算子检查模糊、遮挡和曝光；单帧 VLM 算子判断物体、手和接触状态；相邻帧算子判断动作前后的状态变化；多模态算子对齐视频、手套、机器人日志和任务阶段。

关键不是把所有数据一次性标完，而是让每个算子只读取所需的帧、时间窗口、视角与传感器字段，并保留输出版本。模型变化时只重跑受影响的数据切片。

# 6. 面向 π 系列的数据生产路线

1. **π0 阶段：** 生产高质量动作块、多视角观测和具身归一化。
2. **π0.5 阶段：** 增加子任务语言、跨环境和跨具身数据。
3. **π0.6\* 阶段：**系统记录自主失败、任务奖励与人工接管。
4. **π0.7 阶段：** 增加视觉子目标、质量、策略类型和控制模式元数据。

# 7. 建议的验证实验

- 同等轨迹数量下，有无子任务标注的开放环境泛化。
- 逐帧细粒度读取与整段视频重复解码的生产成本对比。
- 加入失败和接管数据后，恢复成功率与人工接管率变化。
- 元数据条件能否稳定控制速度、安全和策略选择。

::: tip ✅
最终目标不是“兼容 OpenPI 数据格式”，而是建立能够持续生产任务语义、失败经验和可验证评测资产的数据系统。
:::

## 原始资料

<bookmark name="OpenPI GitHub" href="https://github.com/Physical-Intelligence/openpi"></bookmark>

<bookmark name="OpenPI 官方介绍" href="https://physicalintelligence.company/blog/openpi"></bookmark>

<bookmark name="LeRobot" href="https://github.com/huggingface/lerobot"></bookmark>
