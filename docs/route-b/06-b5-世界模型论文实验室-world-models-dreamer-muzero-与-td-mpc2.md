---
title: "B5｜世界模型论文实验室：World Models、Dreamer、MuZero 与 TD-MPC2"
sourceToken: ENq7dECdwoOAFxxDYDxcruNBniB
sourceRevision: 12
---

> [飞书原文](https://archebase.feishu.cn/docx/ENq7dECdwoOAFxxDYDxcruNBniB) · 源修订 12

::: tip 🔬
**论文实验室：** 本课不按发布时间复述摘要，而用“表示什么、预测什么、动作如何产生、证据是什么”比较主要世界模型路线，并说明哪些机制适合机器人。
:::

# 统一比较框架

| 问题 | 需要定位的证据 |
|-|-|
| 状态表示 | 像素、随机 latent、确定 latent、对象状态 |
| 动力学 | 动作条件转移是否随机、是否多步训练 |
| 预测头 | 观测、奖励、终止、价值、策略 |
| 决策 | 在线规划、树搜索、想象 Actor-Critic |
| 数据 | 真实、仿真、离线、在线交互 |
| 证据 | 预测、样本效率、真实控制、分布外 |

# 1. World Models：压缩、记忆与控制器

经典 World Models 将系统拆成：

- V：VAE 把图像编码成 latent。
- M：RNN 动力学预测 latent 变化。
- C：小控制器在 latent 和记忆状态上行动。

核心思想是策略不必在像素空间直接学习，可以在压缩的“梦境”中训练。但早期方法的世界模型容易被控制器利用，且视觉重建目标未必保留控制相关细节。

# 2. PlaNet / Dreamer：随机状态空间与想象学习

RSSM 结合确定性记忆和随机 latent：

$$h_t=f_\phi(h_{t-1},z_{t-1},a_{t-1})$$

> **读法：** RSSM 的确定性记忆 h_t 由上一记忆、上一随机状态和上一动作递推得到。

**推导：** 循环状态负责压缩长期历史，随机状态负责表达当前不确定性；把三者送入递归函数可形成动作条件的预测记忆。

$$z_t\sim p_\phi(z_t\mid h_t)$$

> **读法：** 在还没有看到当前观测时，动力学先验根据确定性记忆 h_t 预测当前随机潜在状态。

**推导：** 这是 RSSM 的预测步骤：过去观测和动作已被 h_t 汇总，因此 prior 只以 h_t 为条件。

观测后验：

$$z_t\sim q_\psi(z_t\mid h_t,o_t)$$

> **读法：** 看到当前观测 o_t 后，推断后验根据预测记忆和新观测校正随机潜在状态。

**推导：** 这对应贝叶斯滤波的更新步骤；训练通过 KL 等目标让后验既解释当前观测，又不要偏离仅凭动力学得到的 prior。

PlaNet 在 latent 中在线规划；Dreamer 在 latent imagination 中训练 Actor-Critic。路线变化的关键不是更逼真，而是把模型变成高效的决策学习环境。

# 3. DreamerV3：统一尺度与稳定训练

DreamerV3 关注不同领域和奖励尺度下的统一训练配方，包括：

- symlog 等变换处理不同数值尺度。
- 离散随机 latent。
- 归一化与正则化提高稳定性。
- 统一 Actor-Critic 和世界模型目标。

判断其对机器人的意义，需要区分仿真 benchmark 的样本效率与真实接触、延迟和视觉分布的可迁移性。

# 4. MuZero：不重建观测的决策模型

MuZero 学习：

- representation：观测历史到 latent。
- dynamics：latent 和动作到下一 latent 与奖励。
- prediction：latent 到策略和价值。

它不要求预测真实下一图像，只要求 latent 支持奖励、价值和策略搜索。这说明世界模型可以是“决策充分”的，而不是“视觉完整”的。

MuZero 使用树搜索，适合离散动作和已定义规则。连续高维机器人动作需要动作离散化、采样搜索或技能层级。

# 5. TD-MPC / TD-MPC2：任务导向 latent 与短时 MPC

TD-MPC 学习任务导向 latent dynamics、奖励和价值，并用短 horizon MPC 规划。它把模型学习和 TD 价值紧密连接：

$$\begin{aligned}z_{t+1}&=f_\phi(z_t,a_t),\\ \hat r_t&=r_\phi(z_t,a_t),\\ \hat Q_t&=Q_\xi(z_t,a_t)\end{aligned}$$

> **读法：** TD-MPC 类方法分别用潜在动力学预测下一状态、奖励头预测即时奖励、价值头估计当前状态动作的长期价值。

**推导：** 这三项来自控制导向的监督分解：动力学保持可预测性，奖励提供局部任务信号，Q 用 TD 目标补足规划 horizon 之后的长期影响。

规划目标结合预测奖励和终点 Q。相比像素重建，表示直接受控制目标约束；代价是对未定义的新目标可能缺少通用信息。

# 6. 视频世界模型路线

视频生成模型利用大规模人类和互联网视频学习视觉未来。它们可能提供：

- 对象运动和交互先验。
- 语言条件视觉计划。
- 跨本体视觉子目标。
- 具身环境生成和数据扩展。

主要缺口是动作因果、可控性、接触力学和真实机器人接口。没有动作条件的视频模型更接近运动先验，而不是完整可规划动力学。

# 7. 路线对比

| 方法 | 是否重建观测 | 决策方式 | 主要优势 | 主要风险 |
|-|-|-|-|-|
| World Models | 是 | 梦境中训练控制器 | 模块清晰 | 控制器利用模型 |
| PlaNet | 是/latent | latent MPC | 在线规划 | 计算与模型偏差 |
| Dreamer | 是/latent | 想象 Actor-Critic | 样本效率 | 想象偏差 |
| MuZero | 否 | 树搜索 | 决策充分表示 | 连续机器人动作适配 |
| TD-MPC2 | 否 | 短时 MPC + 价值 | 任务导向控制 | 目标特化 |
| 视频世界模型 | 生成视觉 | 视觉计划/子目标 | 数据规模与语义 | 动作和物理一致性 |

## 7.1 事实、作者解释与课程判断

| 方法 | 论文事实 | 作者解释 | 课程判断 |
|-|-|-|-|
| World Models | VAE、循环动力学与小控制器分开训练，控制器可在学习模型中优化 | 压缩后的内部世界足以支持策略学习 | 提出了范式，但模型利用偏差和控制相关表示仍需专门检验 |
| DreamerV3 | 在 RSSM 想象轨迹上使用 Actor-Critic，并采用统一数值尺度与训练配方 | 单一配置可在多类 benchmark 上稳定工作 | 强样本效率证据主要来自受控 benchmark；真实接触、延迟和安全不能外推得到 |
| MuZero | 潜在模型预测奖励、价值和策略，并配合树搜索，不重建观测 | 决策所需模型不必复原环境全部细节 | 支持决策充分性观点，但连续机器人动作与新目标迁移需要额外接口和证据 |
| TD-MPC2 | 联合学习任务导向 latent、奖励、价值和策略先验，并执行短 horizon 规划 | 模型式 RL 可扩展到多任务和更大容量 | 公平比较必须固定真实交互量、模型容量、规划预算和控制频率 |

# 8. 机器人研究的决定性问题

1. 模型是否预测接触事件，而不只是像素？
2. 改变动作后，未来是否发生正确反事实变化？
3. 模型中的高回报轨迹在真实机器人是否仍然高回报？
4. 多步误差和不确定性是否校准？
5. 推理速度是否满足控制周期？
6. 真实数据收益是否超过直接策略基线？
7. 任务留出是否包含新的物理结构，而不只是视觉变化？

# 9. 实验作业

1. 在同一 toy environment 上实现像素重建 latent 和任务导向 latent。
2. 比较 latent MPC 与 imagined Actor-Critic。
3. 加入模型误差，检查规划器利用偏差。
4. 把连续动作改成技能 token，尝试 MuZero 风格搜索。
5. 为视频模型加入动作条件，验证反事实预测。
6. 制作一张论文证据矩阵，区分仿真和真实机器人结论。

# 原始资料

<bookmark name="World Models" href="https://arxiv.org/abs/1803.10122"></bookmark>

<bookmark name="PlaNet" href="https://arxiv.org/abs/1811.04551"></bookmark>

<bookmark name="Dreamer" href="https://arxiv.org/abs/1912.01603"></bookmark>

<bookmark name="DreamerV3" href="https://arxiv.org/abs/2301.04104"></bookmark>

<bookmark name="MuZero" href="https://arxiv.org/abs/1911.08265"></bookmark>

<bookmark name="TD-MPC2" href="https://arxiv.org/abs/2310.16828"></bookmark>

# 实验室加深｜统一公式、可视化与复现

把 World Models、Dreamer、MuZero 与 TD-MPC2 放到同一接口中，需要先区分它们是否学习下列对象，而不能因为都使用 latent 就视为同一种方法。

$$\begin{aligned}z_t&=e_\psi(o_{\le t}),\\ z_{t+1}&\sim p_\phi(z_{t+1}\mid z_t,a_t),\\ \hat r_t&=r_\phi(z_t,a_t),\\ \hat V_t&=V_\xi(z_t)\end{aligned}$$

> **读法：** 统一接口依次包含历史观测到状态表示、动作条件潜在转移、奖励预测和价值预测。

**推导：** 这不是声称所有论文都实现四项，而是把决策系统按数学对象拆开；某项缺失时，论文会用搜索、控制器或其他监督替代。

统一比较目标可以写为：

$$\hat G_H=\sum_{k=0}^{H-1}\gamma^k\hat r_{t+k}+\gamma^H\hat V(z_{t+H})$$

> **读法：** 统一的 H 步预测回报等于模型 rollout 中 H 个折扣奖励，加上第 H 步状态的折扣终点价值。

**推导：** 把无限回报在 H 处截断，前半段由模型显式预测，后半段由价值函数近似。各论文的主要差别在于状态怎样学、动作怎样选以及梯度和真实数据怎样进入。

不同论文的关键区别，是怎样学 $z$、怎样防止 rollout 偏差、怎样搜索动作，以及真实数据与想象数据各自在哪里进入。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBPW+ecn+Wunuingua1i+WOhuWPsl0gLS0+IFpb5a2m5Lmg5r2c5Zyo54q25oCBXQogICAgWiAtLT4gRFvliqjkvZzmnaHku7bmvZzlnKjliqjlipvlraZdCiAgICBBW+WAmemAieWKqOS9nOaIluetlueVpeWKqOS9nF0gLS0+IEQKICAgIEQgLS0+IFJb6aKE5rWL5aWW5YqxIC8g5Lu35YC8IC8g57uI5q2iXQogICAgUiAtLT4gUHvliqjkvZzmgI7moLfkuqfnlJ99CiAgICBQIC0tPiBNW01QQyAvIENFTV0KICAgIFAgLS0+IEFDW+aDs+ixoSBBY3Rvci1Dcml0aWNdCiAgICBQIC0tPiBUU1vmoJHmkJzntKJdCiAgICBNIC0tPiBYW+ecn+WunueOr+Wig+aJp+ihjF0KICAgIEFDIC0tPiBYCiAgICBUUyAtLT4gWAogICAgWCAtLT4gTw==" />

## 统一复现实验

1. 在同一部分可观测控制任务中固定编码器容量、真实交互量和规划预算。
2. 分别实现纯 latent MPC、想象 Actor-Critic 与带价值引导的规划。
3. 画预测误差随 rollout horizon 的曲线，并与真实控制回报对照。
4. 对模型容量、规划步数和真实数据量做三轴消融，区分模型收益与计算收益。

## 实验室练习

1. 解释低像素预测误差为什么不必然带来高控制回报。
2. 推导模型误差在多步 rollout 中可能怎样累积。
3. 设计一个区分“价值函数救了错误模型”与“模型真的更准”的实验。
4. 比较 MuZero 不重建观测与 Dreamer 重建观测各自保留的监督。
