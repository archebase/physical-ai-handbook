---
title: "A1｜动作表示与生成式策略：从连续控制到 FAST Tokenizer"
sourceToken: Oes8d8LFno763NxcWFucK7kMnZy
sourceRevision: 23
---

> [飞书原文](https://archebase.feishu.cn/docx/Oes8d8LFno763NxcWFucK7kMnZy) · 源修订 23

::: tip 💡
**课程定位：** 本章研究“动作应当用什么随机变量表示”。FAST 是重要案例，但不是全部答案。读者将比较单点回归、自回归 token、Diffusion 和 Flow Matching，理解表示方式如何决定损失函数、推理速度、多峰表达与跨机器人迁移。
:::

# 1. 动作是什么：从控制量到随机变量

**学习目标：** 完成本章后，应能区分位置、速度、力矩和末端增量动作；从量化规则写出动作 token；推导自回归交叉熵；解释 DCT 为什么压缩平滑轨迹；比较 token、Diffusion 与 Flow 策略的统计假设和推理代价。

一个 H 步、d 维的动作块包含 H 乘 d 个连续数值。若每个数值独立量化为 token，序列很长，而且相邻动作高度相关，模型浪费大量容量重复表达平滑轨迹。

动作不是天然存在的一串 token。工程师先选择控制接口，再决定模型要学习的随机变量。常见动作包括关节位置 $q^{cmd}$、关节速度 $\dot q^{cmd}$、力矩 $\tau^{cmd}$、末端位姿增量 $\Delta x$ 和夹爪命令。相同的机器人轨迹，在不同控制接口下会对应不同的数据分布。

| 动作接口 | 优点 | 隐含依赖 | 常见风险 |
|-|-|-|-|
| 关节位置 | 稳定、容易采集 | 底层位置控制器 | 跨机器人语义不一致 |
| 关节速度 | 局部、响应直接 | 控制频率与积分 | 延迟导致漂移 |
| 末端增量 | 对象操作直观 | 逆运动学与坐标系 | 奇异点和不可达 |
| 力矩或力 | 适合接触控制 | 高频反馈与动力学 | 安全和跨平台难度高 |

对动作块 $A_t=[a_t,\ldots,a_{t+H-1}]\in\mathbb{R}^{H\times d}$，表示方法必须同时处理连续精度、时间相关性、多峰解、推理延迟和不同 embodiment 的维度差异。

# 2. FAST 的三步

1. **离散余弦变换：** 沿时间维把动作轨迹变换到频域，平滑运动集中在少量低频系数。
2. **量化：** 按动作维度的统计范围缩放并量化频域系数。
3. **字节对编码：** 对常见的系数组合执行 BPE，进一步减少 token 数量。

对单个动作维度 x，DCT 可以写为：

$$X_k=\sum_{n=0}^{H-1}x_n\cos\left[\frac{\pi}{H}\left(n+\frac12\right)k\right]$$

> **读法：** 第 k 个 DCT 系数等于整段 H 步动作与第 k 个余弦基函数逐点相乘后求和。

**推导：** DCT-II 把时间序列投影到不同频率的余弦基上。不同实现会在正变换或逆变换中加入归一化系数；只要编码和解码使用同一约定，重建关系不变。

低频 X_k 描述整体方向和速度，高频系数描述快速变化。机器人动作通常具有时间平滑性，因此比直接逐点量化更可压缩。

# 3. 四种动作分布参数化路线

动作表示不是单纯的数据压缩问题。它决定模型直接拟合什么数学对象，以及推理时如何得到动作。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBDW+ingua1i+S4juS7u+WKoeS4iuS4i+aWh10gLS0+IFJb5Y2V54K55Zue5b2SXQogICAgQyAtLT4gQVJb6Ieq5Zue5b2S5Yqo5L2cIFRva2VuXQogICAgQyAtLT4gRElbRGlmZnVzaW9uIFBvbGljeV0KICAgIEMgLS0+IEZNW0Zsb3cgTWF0Y2hpbmcgUG9saWN5XQogICAgUiAtLT4gQTFb5LiA5qyh5YmN5ZCR5b6X5Yiw5Z2H5YC85Yqo5L2cXQogICAgQVIgLS0+IEEyW+mAkCBUb2tlbiDop6PnoIFdCiAgICBESSAtLT4gQTNb5aSa5q2l5Y675ZmqXQogICAgRk0gLS0+IEE0W+enr+WIhuWQkemHj+Wcul0=" />

::: tip 💡<p><b>交互验证｜动作表示与 FAST Tokenizer 实验室</b></p><p>改变码本大小、动作块长度和动作复杂度，观察量化压缩、重建误差与时序一致性的权衡。</p><p><a href="https://archebase.feishuapp.com/app/app_17aeahgcwtv">动作表示与 FAST Tokenizer 实验室</a></p><p><button action="OpenLink" src="https://archebase.feishuapp.com/app/app_17aeahgcwtv">打开交互实验</button></p><bookmark name="动作表示与 FAST Tokenizer 实验室" href="https://archebase.feishuapp.com/app/app_17aeahgcwtv"></bookmark>:::

## 3.1 单点回归

模型输出条件均值 $\mu_\theta(c)$，训练 MSE：

$$\mathcal L_{\mathrm{MSE}}=\mathbb E\left[\left\|a-\mu_\theta(c)\right\|_2^2\right]$$

> **读法：** 均方误差是在上下文和真实动作数据上，对真实动作与模型条件均值之间距离平方取平均。

**推导：** 若条件动作服从固定方差高斯分布，负对数似然除去常数后与这一平方误差成正比。

它等价于固定方差单峰高斯假设。优点是一次前向、延迟低；缺点是多种正确轨迹可能被平均。

## 3.2 自回归动作 Token

先用编码器 $T$ 把动作块变成离散序列 $y_{1:M}=T(A)$，再学习：

$$p_\theta(y_{1:M}\mid c)=\prod_{m=1}^{M}p_\theta(y_m\mid y_{<m},c)$$

> **读法：** 完整动作 token 序列的概率，等于每个 token 在此前 token 和上下文条件下的概率依次相乘。

**推导：** 由概率链式法则展开离散序列联合分布。

交叉熵损失为：

$$\mathcal L_{\mathrm{AR}}=-\mathbb E\left[\sum_{m=1}^{M}\log p_\theta(y_m\mid y_{<m},c)\right]$$

> **读法：** 自回归损失把每个真实动作 token 的负对数条件概率相加，再对训练样本取平均。

**推导：** 对上一式联合概率取对数，乘积变求和；最大化序列似然等价于最小化逐 token 交叉熵。

读作：“给定上下文和此前已经生成的动作 token，提高下一个真实 token 的概率。”它能直接复用语言模型训练基础设施，但推理延迟随 token 数量增长，而且早期 token 错误会改变后续条件。

## 3.3 Diffusion Policy

Diffusion 通常训练网络预测噪声或 score，把加噪动作逐步还原为数据样本。以噪声预测为例：

$$A^{(\tau)}=\sqrt{\bar\alpha_\tau}\,A+\sqrt{1-\bar\alpha_\tau}\,\varepsilon,\qquad \varepsilon\sim\mathcal N(0,I)$$

> **读法：** 扩散时间 tau 的带噪动作，由缩小后的真实动作与缩放后的标准高斯噪声相加得到。

**推导：** 前向扩散在每一步加入高斯噪声；把多步高斯转移合并后，可直接从真实动作采样任意噪声尺度的动作。bar alpha 控制还保留多少数据、加入多少噪声。

$$\mathcal L_{\mathrm{diff}}=\mathbb E_{A,\varepsilon,\tau}\left[\left\|\varepsilon-\varepsilon_\theta(A^{(\tau)},\tau,c)\right\|_2^2\right]$$

> **读法：** Diffusion 损失是在动作、噪声和扩散时间上，让网络预测的噪声接近实际加入的高斯噪声。

**推导：** 训练时噪声由我们采样，因此是已知监督；学习各噪声尺度的噪声预测后，推理可以反复去噪生成动作。

模型学习的是不同噪声尺度下“应该去掉哪部分噪声”。它能够表达多峰连续动作，但需要多步采样，控制延迟取决于去噪步数与网络规模。

## 3.4 Flow Matching Policy

Flow Matching 学习连续时间向量场，把简单噪声分布搬运到动作分布：

$$\frac{dA^{(\tau)}}{d\tau}=v_\theta(A^{(\tau)},\tau,c)$$

> **读法：** 动作状态沿流时间 tau 的变化率，等于模型在当前动作状态、时间和上下文下预测的速度。

**推导：** 训练时构造噪声与真实动作之间的概率路径并拟合路径速度；推理时从噪声初值积分该常微分方程。它不要求采用 Diffusion 的随机前向过程。

| 方法 | 直接拟合对象 | 推理 | 多峰 | 主要代价 |
|-|-|-|-|-|
| MSE | 条件均值 | 一次前向 | 弱 | 平均动作 |
| 自回归 Token | 离散序列概率 | 逐 token | 强 | 量化误差和串行延迟 |
| Diffusion | 噪声或 score | 多步去噪 | 强 | 采样计算 |
| Flow Matching | 概率流向量场 | ODE 积分 | 强 | 积分步数与数值误差 |

它们不是互斥的 Physical AI 路线，而是直接策略路线中不同的动作分布参数化。Tokenizer 还可以作为预训练接口，连续 Flow 或 Diffusion 则承担最终精细控制。

# 4. π0-FAST 与 π0 Flow 的差异

| 维度 | π0 Flow | π0-FAST |
|-|-|-|
| 动作表示 | 连续动作块 | 离散 FAST token |
| 训练目标 | Flow Matching | 交叉熵 |
| 推理方式 | 多步积分 | 自回归 token 生成 |
| 优势 | 连续精细、并行生成动作块 | 与标准 VLM 训练范式统一，利于异构共训练 |

# 5. FAST+ 与通用动作词表

FAST+ 使用大规模跨机器人轨迹训练通用动作 tokenizer。它试图把 tokenizer 从单一机器人和动作空间中解耦，使不同控制频率、自由度与动作范围的数据可以进入统一的自回归训练管线。

# 6. FAST 在混合预训练中扮演什么角色

π0.5 的第一阶段需要同时学习网页问答、图像语言、高层子任务和多机器人动作。FAST 把机器人动作也变成离散 token，使这些异构监督能够统一使用交叉熵训练。第二阶段再接入 Flow Matching Action Expert，恢复连续动作精度。

::: tip 🔍
FAST 不是说离散动作一定优于连续动作，而是提供了一座桥：先用统一 token 学习广泛知识，再用连续 Action Expert 专门化控制。
:::

# 7. Tokenizer 与生成策略如何评估

压缩率不是唯一目标。一个动作表示只有在压缩后仍保留控制相关信息，才对 Physical AI 有用。

| 评估层 | 问题 | 建议指标 |
|-|-|-|
| 重建 | 从 token 能否还原原动作 | 位置、速度、姿态、力矩重建误差 |
| 统计 | token 是否过长或分布失衡 | 序列长度、熵、长尾频率、跨任务词表复用 |
| 生成 | 能否表达多种正确轨迹 | 模式覆盖、条件一致性、样本多样性 |
| 控制 | 重建或生成误差是否影响成功率 | 任务成功率、平滑度、碰撞率、恢复率 |
| 迁移 | token 语义能否跨机器人复用 | 跨 embodiment 线性探针、少样本适配、零样本失败分布 |

需要把 open-loop 表示误差与 closed-loop 任务误差分开报告。一个 token 重建很准的模型，如果在接触状态切换处产生微小延迟，仍可能比重建误差更大的模型更不可靠。

## 本章练习补充

1. 给定两条“向左绕行”和“向右绕行”的动作轨迹，分别说明 MSE、AR Token、Diffusion 和 Flow 会如何表示它们。
2. 推导均匀量化步长 $\Delta$ 下的量化误差上界，并讨论它如何随动作范围变化。
3. 设计一个控制相关的 tokenizer 评测：保持 token 数量相同，比较是否保留接触事件。
4. 解释为什么跨机器人共享词表不等于跨机器人动作语义已经对齐。

## 练习

1. 构造一条平滑正弦动作和一条高频抖动动作，比较它们的 DCT 系数稀疏度。
2. 分析自回归 FAST 在控制延迟上的潜在瓶颈。
3. 解释为什么通用 tokenizer 仍然不能自动解决跨机器人动作语义对齐。

## 原始资料

<bookmark name="FAST 官方论文" href="https://arxiv.org/abs/2501.09747"></bookmark>

<bookmark name="OpenPI" href="https://github.com/Physical-Intelligence/openpi"></bookmark>

# 最小复现实验｜双峰动作分布

构造二维绕障数据：给定相同起点、终点和障碍物，专家一半从左侧绕行，一半从右侧绕行。条件动作分布因此有两个正确模式。

1. 用 MSE 回归动作块，观察预测是否穿过两个模式之间的障碍物。
2. 把动作量化为 token，自回归生成并画量化误差与解码延迟。
3. 用 Diffusion 与 Flow Matching 采样 100 条轨迹，画轨迹密度和模式覆盖率。
4. 统一模型参数量和训练数据，比较成功率、模式熵、推理时延与轨迹平滑度。
5. 改变 token 码本、扩散步数和 ODE 积分步数，画质量-时延 Pareto 曲线。

这个实验应让读者直接看到：MSE 学习条件均值，离散 token 学习序列概率，Diffusion 学习去噪/score，Flow Matching 学习把噪声运输到动作分布的向量场。表示不同，模型被要求学会的数学对象也不同。
