---
title: "C4｜价值与经验学习论文实验室：SAC、CQL、IQL、DAgger 与 RECAP"
sourceToken: S5SbdMthCouZYHx9L6zcV4Wqn7f
sourceRevision: 11
license: Apache-2.0
---

> [飞书原文](https://archebase.feishu.cn/docx/S5SbdMthCouZYHx9L6zcV4Wqn7f) · 源修订 11

::: tip 🔬
**论文实验室：** 用统一坐标比较在线 Actor-Critic、离线价值学习、纠正式模仿和大型 VLA 经验改进。重点不是算法缩写，而是数据来自哪里、价值在哪估计、策略如何受约束。
:::

# 统一比较坐标

| 维度 | 问题 |
|-|-|
| 交互 | 是否能在线采样新动作 |
| 数据 | 专家、混合质量、失败、纠正还是偏好 |
| 价值 | Q、V、Advantage 或奖励模型 |
| 策略更新 | 最大化 Q、加权模仿、条件化或直接偏好 |
| 约束 | 熵、KL、行为支持或保守 Q |
| 证据 | 仿真、离线指标、真实机器人和安全 |

# 1. SAC：最大熵在线 Actor-Critic

SAC 优化奖励与策略熵：

$$J_{\mathrm{SAC}}=\mathbb E\!\left[\sum_{t=0}^{T-1}\gamma^t\left(r_t+\alpha\mathcal H(\pi_\theta(\cdot\mid s_t))\right)\right]$$

> **读法：** SAC 最大化 T 步折扣奖励与策略熵奖励之和，alpha 控制随机动作的价值。

**推导：** 在普通 RL 回报中加入每个状态的策略熵即可得到最大熵目标；它促进探索，但真实机器人还需动作范围和安全约束。

优势是连续动作、off-policy 和较高样本效率。真实机器人限制在于在线探索安全、重置成本和高频动作。

# 2. DAgger：让专家标注策略自己的状态

DAgger 直接针对行为克隆的分布偏移，让当前策略访问状态，专家提供正确动作。它不需要奖励和价值函数，但需要持续专家参与。

适合真实机器人恢复数据：策略走偏时接管，记录接管前状态和恢复动作。

# 3. CQL：对数据外动作保持保守

CQL 在 TD 目标之外惩罚策略动作高 Q，使数据动作相对更高。它适合混合质量离线数据，但保守强度决定是否能超越行为策略。

# 4. IQL：不对分布外动作显式最大化

IQL 用 expectile 学习高价值数据动作的状态价值，再对数据动作做 Advantage 加权回归。它避免 Actor 查询任意 OOD 动作，工程上简单稳定。

# 5. AWR / AWAC：价值加权的行为克隆

$$\mathcal L_{\mathrm{AWR}}=-\mathbb E_{(s,a)\sim\mathcal D}\!\left[\exp(A(s,a)/\beta)\log\pi_\theta(a\mid s)\right]$$

> **读法：** AWR 仍拟合离线数据动作，但用 Advantage 的温度指数权重强调更优动作。

**推导：** KL 正则策略改进的非参数解相对行为策略按 exp(A/beta) 重加权，将该目标投影到参数策略即得到加权最大似然。

它保持在数据支持内，同时提高高 Advantage 动作概率，是连接模仿学习与 RL 的重要桥梁。

# 6. Decision Transformer：回报条件序列模型

把目标回报、状态和动作作为序列：

$$p_\theta(a_t\mid G_{\le t},s_{\le t},a_{<t})$$

> **读法：** Decision Transformer 根据截至当前的 return-to-go、状态历史与此前动作预测当前动作。

**推导：** 把回报、状态和动作交错成因果序列后，RL 数据可转化为条件序列建模；请求高于数据支持的回报并没有对应监督。

它不显式做 Bellman backup，但受数据中的回报覆盖约束。高目标回报不等于模型能外推新策略。

# 7. RECAP：大型 VLA 的经验改进

RECAP 收集当前策略的真实执行、成功失败和人工纠正，训练价值/Advantage 信号，再通过条件策略请求更优行为。

关键研究问题：

- 收益来自更多数据还是 Advantage 机制？
- 价值函数是否在任务阶段和新状态上校准？
- 失败与人工纠正如何分别贡献？
- 吞吐提升是否牺牲安全和动作质量？

# 8. 方法谱系

| 方法 | 在线交互 | 策略更新 | 主要风险 |
|-|-|-|-|
| SAC | 需要 | 最大熵 Q 优化 | 探索安全 |
| DAgger | 策略执行 + 专家 | 聚合行为克隆 | 专家成本 |
| CQL | 不需要 | 保守 Q + Actor | 过度保守 |
| IQL | 不需要 | expectile + 加权 BC | 受数据动作限制 |
| Decision Transformer | 不需要 | 回报条件序列预测 | 高回报外推 |
| RECAP | 真实部署循环 | Advantage 条件/重加权 | 价值偏差和数据混淆 |

# 9. 最小实验：统一机器人对照

在同一任务、同一数据预算下比较：

1. 专家 BC。
2. 专家 + 自主失败的普通 SFT。
3. DAgger / 人工接管纠正。
4. IQL 或 AWR。
5. RECAP 风格 Advantage 条件。
6. 允许安全在线交互时的 SAC。

同时报告成功率、恢复率、碰撞、接管、数据成本、训练稳定性和置信区间。

# 10. 本实验室作业

1. 制作六种方法的数据-目标-策略更新图。
2. 设计等量数据与等量人类时间对照。
3. 画价值校准曲线。
4. 检查分布外动作的 Q 值。
5. 对任务阶段做 Advantage 分层。
6. 写出 RECAP 结论的事实、解释和未证明主张。

# 11. 失败模式与公平比较门槛

| 混淆 | 错误结论 | 必须控制 |
|-|-|-|
| 在线交互量不同 | SAC 或部署循环算法天然更优 | 真实步数、重置次数、安全事件与墙钟时间 |
| 新增数据量不同 | RECAP 的价值机制带来全部收益 | 与等量普通 SFT、新增成功数据和失败数据分别对照 |
| 专家时间不同 | DAgger 比离线方法数据效率更高 | 标注、接管、监控和恢复所需人类分钟数 |
| 模型容量不同 | 算法目标而非模型规模造成提升 | 编码器、Actor、Critic 容量及预训练初始化 |
| 任务切片不同 | 平均成功率代表真实泛化 | 新物体、接触阶段、失败恢复与最坏任务切片 |
| 价值未校准 | 高 Q 或高 Advantage 就是更好行为 | 预测分桶、真实结果和 OOD 动作比例 |

# 12. 论文事实、作者解释与课程判断

| 工作 | 论文事实 | 作者解释 | 课程判断 |
|-|-|-|-|
| SAC | 最大熵 off-policy Actor-Critic，在连续控制 benchmark 上展示较高样本效率 | 熵正则带来探索与鲁棒性 | 真实机器人结论必须加入探索安全、重置和控制频率成本 |
| DAgger | 聚合当前策略状态上的专家动作以缓解模仿分布偏移 | 交互式监督可降低复合误差 | 人类时间和安全门控是算法成本的一部分，不能视为免费标签 |
| CQL | 通过保守正则降低数据外动作的 Q 值 | 保守价值可支持离线策略改进 | 需报告是否过度保守，以及相对 BC 的真实改进 |
| IQL | 用 expectile V 和 Advantage 加权回归避免显式数据外最大化 | 可提供简单稳定的离线学习配方 | 能力上限仍受数据动作覆盖限制 |
| Decision Transformer | 把 return-to-go、状态与动作建模为条件序列 | 序列建模可替代显式 Bellman backup | 高 return 请求只有在数据支持内才可靠，似然不能证明闭环最优 |
| RECAP | 利用通用 VLA 部署产生的成功、失败和纠正经验继续改进策略 | 经验学习循环可扩展通用机器人能力 | 必须用等量数据 SFT、价值加权和反馈类型消融识别真正贡献 |

<bookmark name="Soft Actor-Critic" href="https://arxiv.org/abs/1801.01290"></bookmark>

<bookmark name="DAgger" href="https://proceedings.mlr.press/v15/ross11a.html"></bookmark>

<bookmark name="Conservative Q-Learning" href="https://arxiv.org/abs/2006.04779"></bookmark>

<bookmark name="Implicit Q-Learning" href="https://arxiv.org/abs/2110.06169"></bookmark>

<bookmark name="Decision Transformer" href="https://arxiv.org/abs/2106.01345"></bookmark>

[π0.6\* / RECAP：VLA 如何从部署经验中学习](/route-a/06-a3-4-π0-6-recap-机器人如何从成功-失败和纠正中改进)

# 实验室加深｜统一公式、可视化与复现

把 SAC、CQL、IQL、DAgger 与 RECAP 放进同一条经验学习链：数据来自谁，价值怎样估计，策略怎样被更新，部署状态分布怎样改变。

统一的 advantage 加权策略更新可写为：

$$\mathcal L_\pi=-\mathbb E_{(s,a)\sim\mathcal D}\!\left[w(s,a)\log\pi_\theta(a\mid s)\right]$$

> **读法：** 统一的加权策略损失在固定数据动作上做最大似然，每条样本由权重 w 决定重要性。

**推导：** 普通行为克隆令所有权重相同；价值或 Advantage 方法只改变样本权重，因此能够在不直接生成 OOD 动作的情况下重排数据行为。

$$w(s,a)=\exp\!\left(A(s,a)/\beta\right)$$

> **读法：** 样本权重是 Advantage 除以温度 beta 后的指数。

**推导：** 该形式来自 KL 正则策略改进；beta 越小，高优势样本权重差距越大。为与 C0、C2 保持一致，本课程统一使用 beta 作为温度而非逆温度。

读作：“仍然模仿数据里的动作，但更重视估计为优于基线的动作。”CQL 重点压低分布外动作价值，IQL 避免显式查询分布外最大值，DAgger 通过专家纠正改变数据分布，RECAP 则把部署经验重新条件化和训练。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBCW+WIneWni+S4k+WutuS4juihjOS4uuaVsOaNrl0gLS0+IFZb5Lu35YC8IC8g5aWW5YqxIC8g5YGP5aW95Lyw6K6hXQogICAgViAtLT4gVVvnrZbnlaXmm7TmlrDvvJpTQUMgLyBDUUwgLyBJUUwgLyDliqDmnYPmqKHku79dCiAgICBVIC0tPiBEW+ecn+WunumDqOe9sl0KICAgIEQgLS0+IFNb6Ieq5Li75oiQ5YqfXQogICAgRCAtLT4gRlvlpLHotKXkuI7ovrnnlYznirbmgIFdCiAgICBEIC0tPiBIW+S6uuW3pee6oOatoyAvIOWBj+WlvV0KICAgIFMgLS0+IFYKICAgIEYgLS0+IFYKICAgIEggLS0+IFY=" />

## 统一复现实验

1. 构造包含专家、次优、失败与纠正的固定离线数据集。
2. 比较行为克隆、CQL、IQL/AWR 和 advantage 条件策略。
3. 固定离线数据后，再允许每种方法获得相同数量的人工纠正。
4. 报告回报、成功率、分布外动作比例、接管次数与最坏任务切片。

## 实验室练习

1. 解释为什么最大化离线 Q 值会偏向数据外动作。
2. 比较 DAgger 的监督标签与偏好奖励模型提供的信息。
3. 设计一个验证 RECAP 提升来自失败经验而非额外成功数据的消融。
4. 讨论 advantage 估计错误时加权模仿会怎样放大偏差。

- Soft Actor-Critic
- DAgger
- Conservative Q-Learning
- Implicit Q-Learning
- Advantage-Weighted Actor-Critic
- Decision Transformer
- π0.6\* / RECAP
