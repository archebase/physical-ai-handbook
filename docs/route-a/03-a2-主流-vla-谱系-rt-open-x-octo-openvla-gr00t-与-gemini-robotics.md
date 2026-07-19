---
title: "A2｜主流 VLA 谱系：RT、Open X、Octo、OpenVLA、GR00T 与 Gemini Robotics"
sourceToken: Bgevdu3QuoIedrxrIaPcKv1Nn7b
sourceRevision: 9
---

> [飞书原文](https://archebase.feishu.cn/docx/Bgevdu3QuoIedrxrIaPcKv1Nn7b) · 源修订 9

::: tip 💡
**论文路线课：** 这门课回答的不是“哪家公司更强”，而是不同 VLA 系统究竟让模型学习什么对象、使用什么数据、输出什么动作，以及能力提升来自架构、数据还是后训练。
:::

# 学习目标

完成本课后，应能把 RT-1、PaLM-E、RT-2、RoboCat、Open X-Embodiment/RT-X、Octo、OpenVLA、RDT、GR00T、Gemini Robotics 和 π 系列放进同一技术坐标；区分语义预训练、机器人共训练、动作生成和部署适配；识别论文中“泛化”一词对应的具体留出。

# 1. 统一问题：VLA 学习的是条件动作分布

$$\pi_\theta(a_{t:t+H-1}\mid I_{t-k:t},q_{t-k:t},l,e)$$

> **读法：** 给定最近一段图像、机器人本体状态、语言指令和机器人本体标识，策略生成从当前时刻开始、长度为 H 的动作块。

**推导：** 把近期图像、机器人状态、语言指令和本体标识都作为条件，是为了让同一策略能根据场景、任务和机器人接口改变未来动作块分布。

**符号：** $I$ 是图像，$q$ 是关节或末端状态，$l$ 是语言目标，$e$ 是 embodiment 信息，$a$ 是机器人动作。

**推导来源：** 机器人示范数据给出上下文 $c=(I,q,l,e)$ 和真实动作 $a$。最大似然训练要求真实动作在模型分布下概率更高：

$$\theta^*=\arg\max_\theta\sum_{(c,a)\in\mathcal D}\log\pi_\theta(a\mid c)$$

> **读法：** 在所有示范样本上寻找一组参数，使专家真实执行过的动作获得尽可能高的对数概率。

**推导：** 在条件独立样本假设下，数据似然是每条策略概率的乘积；取对数变成求和，最大化该和就得到条件行为克隆的最大似然目标。

取负号就得到最小化的行为克隆损失。回归、动作 token、Diffusion 和 Flow Matching 的区别，是它们用不同方式参数化同一个条件动作分布。

# 2. 三次关键扩展

| 扩展 | 模型新增的能力来源 | 代表系统 |
|-|-|-|
| 规模化多任务模仿 | 统一 token/Transformer 在大量真实机器人任务上训练 | RT-1、RoboCat |
| 视觉语言知识进入控制 | 互联网图文或大语言模型提供语义表征 | PaLM-E、RT-2、OpenVLA |
| 跨数据集与跨本体共训练 | 统一数据 schema、动作空间和任务条件 | Open X-Embodiment、RT-X、Octo、GR00T |

# 3. RT-1：把多任务机器人控制变成序列建模

RT-1 的关键贡献不是“用了 Transformer”这一句，而是把图像、语言和离散动作组织成可规模训练的机器人序列模型。离散动作序列可分解为：

$$p(y_{1:M}\mid c)=\prod_{m=1}^{M}p(y_m\mid y_{1:m-1},c)$$

> **读法：** 完整动作 token 序列的概率，等于每个 token 在上下文和此前动作 token 条件下的概率依次相乘。

**推导：** 概率链式法则把联合分布展开为条件概率乘积；对数把乘积变成求和，因此可以用逐 token 交叉熵训练。代价是量化误差与串行解码延迟。

# 4. PaLM-E 与 RT-2：语义知识怎样进入动作

PaLM-E 把连续传感器表示注入语言模型，展示具身输入与语言推理共享主干的可能性。RT-2 更进一步，把机器人动作表示成可由视觉语言模型预测的 token，使互联网视觉语言任务与机器人动作任务共同训练。

共训练目标可以抽象为：

$$\mathcal L=\lambda_{vl}\mathcal L_{vision-language}+\lambda_{robot}\mathcal L_{action}$$

> **读法：** 总损失由视觉语言任务损失和机器人动作损失加权相加，两类数据共同更新模型。

**推导：** 当训练 batch 来自两个数据分布时，总体经验风险就是各数据源期望损失的加权和。权重不仅是超参数，也隐含了两种数据实际被模型看到的频率。

必须避免的误读是：视觉语言知识能帮助识别对象、属性和指令组合，但不会自动提供接触力、运动学可达性或稳定控制。

# 5. RoboCat：通用性来自迭代数据循环

RoboCat 的重要视角是多机器人、多任务策略与自我改进数据循环。模型先在多源示范上训练，再为新任务收集数据并回灌。这里应区分两种提升：模型从已有多任务中迁移，以及新增目标任务数据带来的适配。

# 6. Open X-Embodiment 与 RT-X：数据联盟改变了研究对象

Open X-Embodiment 将不同实验室、不同机器人和不同控制接口的数据放入共同语料。其训练分布是混合分布：

$$p_{train}(x)=\sum_{d=1}^{D}w_d p_d(x)$$

> **读法：** 训练样本来自 D 个数据源的混合；第 d 个数据源被采到的概率由权重 w_d 决定。

**推导：** 先按 $w_d$ 选择数据源，再从该数据源分布 $p_d$ 采样，边缘化数据源变量就得到混合分布。数据量最大的来源若直接决定权重，会淹没小而稀缺的技能。

跨本体的核心难题不是 padding，而是动作的物理语义、坐标系、频率、相机视角和任务标签是否对齐。

# 7. Octo：开放通用策略与可适配接口

Octo 将大规模跨本体预训练与下游适配作为明确目标。读论文时要检查：预训练数据覆盖了哪些机器人；下游适配更新哪些参数；新任务收益是在相同目标数据量下产生，还是额外数据和计算带来的。

# 8. OpenVLA：把开源 VLM 主干变成连续控制策略

OpenVLA 代表开源 VLA 路线：从视觉语言主干出发，用机器人数据训练动作预测。其价值既包括模型，也包括可复现的数据处理、训练和部署接口。判断其通用性时，应分别测试对象、背景、语言组合、任务和 embodiment 留出。

# 9. RDT 与生成式动作专家

RDT、Diffusion Policy 和 π0 等系统体现另一条趋势：语义主干不必直接逐 token 输出全部连续动作，可以连接专门的生成式动作模块。以 Flow Matching 为例：

$$\frac{dx_t}{dt}=v_\theta(x_t,t,c)$$

> **读法：** 动作样本 x 随生成时间 t 沿模型预测的速度场移动，最终从简单噪声分布运输到条件动作分布。

**推导：** 生成式策略把简单初始分布中的样本视为 ODE 初值，并用学习到的条件速度场连续更新；积分该方程即可得到最终动作样本。

**推导直觉：** 训练时人为构造噪声动作与真实动作之间的概率路径，并监督路径上的真实速度；推理时从噪声出发积分微分方程得到动作块。

# 10. GR00T、Gemini Robotics、Helix 与新一代系统

2025 年后的系统更强调双系统或分层结构：较慢的视觉语言推理模块负责语义、任务和子目标，较快的动作模块负责连续闭环控制。GR00T 强调人形机器人数据与跨本体基础模型；Gemini Robotics 强调视觉语言模型向具身推理和动作输出扩展；Helix 展示语言条件的通用人形上半身控制。

这些系统的公开材料、数据和评测透明度不同。课程只把公开可核验的架构和实验作为事实，不把演示视频直接当作通用性证据。

# 11. 统一比较表

| 系统 | 主要学习对象 | 动作表示 | 最应检查的证据 |
|-|-|-|-|
| RT-1 | 多任务条件动作序列 | 离散动作 token | 多任务规模与长尾任务 |
| PaLM-E | 具身多模态表示与语言输出 | 不以连续控制为唯一目标 | 正迁移与语言推理 |
| RT-2 | 视觉语言知识条件下的动作 token | 动作 token | 语义泛化与真实控制边界 |
| RoboCat | 多机器人多任务策略 | 策略动作 | 新任务数据循环 |
| RT-X/Octo | 跨数据集、跨本体策略 | 统一或适配后的动作 | 严格 embodiment 留出 |
| OpenVLA | 开源 VLM 条件动作策略 | 离散化连续动作 | 复现、适配成本和闭环表现 |
| RDT/π0 | 多模态条件生成式动作分布 | Diffusion 或 Flow 动作块 | 多峰覆盖、延迟和控制频率 |
| GR00T/Gemini/Helix | 分层语义推理与连续控制 | 系统各异 | 公开数据、留出设计和安全指标 |

# 12. 泛化必须拆开说

“未见任务”至少可能指：新背景、新对象实例、新对象类别、新语言组合、新技能组合、新动力学、新机器人或新任务。不同留出对应不同难度，不能合并成一个泛化成功率。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBEW+acuuWZqOS6uuekuuiMg10gLS0+IEJDW+adoeS7tuWKqOS9nOWtpuS5oF0KICAgIFZMW+S6kuiBlOe9keWbvuaWhy/or63oqIBdIC0tPiBTW+ivreS5ieS4u+W5sl0KICAgIFMgLS0+IEJDCiAgICBYW+i3qOacrOS9k+aVsOaNrl0gLS0+IEJDCiAgICBCQyAtLT4gUFvpooTorq3nu4MgVkxBXQogICAgUCAtLT4gRlRb55uu5qCH5Zy65pmv5ZCO6K6t57uDXQogICAgRlQgLS0+IEVb55yf5a6e6YOo572y57uP6aqMXQogICAgRSAtLT4gUkxb57qg5q2jL+S7t+WAvC/nu4/pqozlrabkuaBdCiAgICBSTCAtLT4gUA==" />

# 13. 最小论文复现实验

1. 固定同一机器人数据，比较从头训练视觉编码器与使用视觉语言预训练主干。
2. 固定目标任务数据量，逐步加入其他任务与其他机器人数据。
3. 比较动作 token、MSE 与生成式动作块，报告模式覆盖、延迟和平滑度。
4. 分别做对象、语言组合、任务组合与 embodiment 留出。
5. 人为扰动目标物体，测试策略能否闭环恢复，而不是只回放训练轨迹。

# 14. 本课练习

1. 用“学习对象、监督信号、动作表示、训练数据、部署接口”比较 RT-2 与 π0。
2. 解释为什么 Open X-Embodiment 的主要困难不是数据格式转换。
3. 设计一个消融，区分视觉语言预训练收益与机器人数据量收益。
4. 说明双系统架构中慢速语义模块与快速动作模块各自承担什么。
5. 为“新机器人泛化”定义一个不会泄漏 embodiment 信息的评测。

# 主要资料

- [RT-1](https://robotics-transformer1.github.io/)
- [PaLM-E](https://palm-e.github.io/)
- [RT-2](https://robotics-transformer2.github.io/)
- [RoboCat](https://deepmind.google/discover/blog/robocat-a-self-improving-robotic-agent/)
- [Open X-Embodiment / RT-X](https://robotics-transformer-x.github.io/)
- [Octo](https://octo-models.github.io/)
- [OpenVLA](https://openvla.github.io/)
- [NVIDIA GR00T](https://developer.nvidia.com/isaac/gr00t)
- [Gemini Robotics](https://deepmind.google/discover/blog/gemini-robotics-brings-ai-into-the-physical-world/)
- [Figure Helix](https://www.figure.ai/news/helix)
