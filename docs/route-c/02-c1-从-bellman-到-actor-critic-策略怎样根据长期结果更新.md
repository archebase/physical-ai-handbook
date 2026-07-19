---
title: "C1｜从 Bellman 到 Actor-Critic：策略怎样根据长期结果更新"
sourceToken: VOEVdX2b6oBy6lxXhLNcQHHenzb
sourceRevision: 26
license: Apache-2.0
---

> [飞书原文](https://archebase.feishu.cn/docx/VOEVdX2b6oBy6lxXhLNcQHHenzb) · 源修订 26

::: tip 💡
**机制课：** 本课从 Bellman 方程继续向前，推导 TD、Q-learning、策略梯度、Advantage 和 Actor-Critic，并解释这些公式在机器人长时、部分可观测和高维连续动作中的实际含义。
:::

# 学习目标

完成本课后，应能推导 Bellman expectation 和 optimality equation；区分 Monte Carlo、TD、SARSA 与 Q-learning；推导策略梯度和 baseline；解释 Actor-Critic 的两个误差源；设计连续动作机器人任务的训练与校准实验。

# 1. MDP 与策略目标

MDP 由 $(\mathcal S,\mathcal A,p,r,\gamma)$ 定义。策略产生动作：

$$a_t\sim\pi_\theta(\cdot\mid s_t)$$

> **读法：** 在状态 s_t 下，动作 a_t 从参数为 theta 的策略分布中采样。

**推导：** 随机策略是状态到动作概率分布的映射；连续控制常用高斯或其他可重参数化分布。

优化目标：

$$J(\theta)=\mathbb E_{\tau\sim\pi_\theta}\!\left[\sum_{t=0}^{T-1}\gamma^t r_t\right]$$

> **读法：** 策略目标是在其产生的长度 T 轨迹上，最大化 T 个折扣奖励之和的期望。

**推导：** 策略和环境共同定义轨迹分布；对轨迹回报在该分布下取期望，即得到参数 theta 的优化目标。

机器人通常是 POMDP，实际策略条件于历史或 latent state，而不是完整 $s_t$。

# 2. Bellman expectation

$$V^\pi(s)=\mathbb E_{a\sim\pi(\cdot\mid s),\,s'\sim p(\cdot\mid s,a)}\!\left[r(s,a,s')+\gamma V^\pi(s')\right]$$

> **读法：** 状态价值等于按策略选动作、按环境转移到下一状态后，即时奖励与下一状态折扣价值的期望。

**推导：** 将回报拆成当前奖励和下一回报，并对当前动作和下一状态边缘化，得到 Bellman expectation equation。

$$Q^\pi(s,a)=\mathbb E_{s'\sim p}\!\left[r+\gamma\mathbb E_{a'\sim\pi(\cdot\mid s')}Q^\pi(s',a')\right]$$

> **读法：** 动作价值等于即时奖励，加上下一状态按当前策略继续选择动作时 Q 值的折扣期望。

**推导：** 首个动作 a 已被条件固定，只需对下一状态和之后的策略动作积分。

这是一组自洽方程：价值由一步结果和下一状态价值共同定义。

# 3. Monte Carlo 与 TD

| 方法 | 目标 | 偏差 | 方差 |
|-|-|-|-|
| Monte Carlo | 完整轨迹回报（Monte Carlo 标签） | 低 | 高 |
| TD(0) | 一步奖励加下一状态价值（TD 标签） | 有 bootstrap 偏差 | 较低 |
| n-step | n 步奖励加终点价值 | 折中 | 折中 |
| TD(λ) | 多尺度 n-step 加权 | 可调 | 可调 |

TD error：

$$\delta_t=r_t+\gamma(1-d_t)V_{\bar\phi}(s_{t+1})-V_\phi(s_t)$$

> **读法：** TD error 是一步奖励与未终止下一价值之和，减去当前价值预测。

**推导：** 用一步 Bellman 目标减当前估计得到残差；d_t 阻止终止后 bootstrap，目标网络 bar phi 提供较稳定的下一价值。

它既是价值更新误差，也可近似动作相对预期的好坏。

# 4. SARSA 与 Q-learning

SARSA 使用实际下一动作：

$$y_t^{\mathrm{SARSA}}=r_t+\gamma(1-d_t)Q_{\bar\phi}(s_{t+1},a_{t+1}),\quad a_{t+1}\sim\pi$$

> **读法：** SARSA 目标使用当前行为策略在下一状态实际采样的动作价值。

**推导：** 对策略 pi 的 Bellman 方程做单样本估计，下一动作来自同一策略，因此它是 on-policy 更新。

Q-learning 使用最大动作：

$$y_t^{Q}=r_t+\gamma(1-d_t)\max_{a'}Q_{\bar\phi}(s_{t+1},a')$$

> **读法：** Q-learning 目标使用下一状态所有动作中最大的目标 Q 值。

**推导：** 把固定策略的下一动作期望替换为最优动作最大值，得到 Bellman optimality 的样本目标，因此可使用不同于目标策略的行为数据。

SARSA 是 on-policy，学习当前行为策略的价值；Q-learning 是 off-policy，向最优 greedy 策略逼近。连续高维动作中 $\max_{a'}Q$ 难以直接求解，需要 Actor 或优化器。

# 5. 策略梯度

使用 log-derivative trick：

$$\nabla_\theta p_\theta(\tau)=p_\theta(\tau)\nabla_\theta\log p_\theta(\tau)$$

> **读法：** 轨迹概率的梯度等于轨迹概率本身，乘以其对数概率的梯度。

**推导：** 由 nabla log p 等于 nabla p 除以 p，两边乘 p 即得；这一步把难处理的概率乘积梯度改写为 log 概率和。

环境动力学与参数无关时：

$$\nabla_\theta J=\mathbb E\!\left[\sum_{t=0}^{T-1}\nabla_\theta\log\pi_\theta(a_t\mid s_t)G_t\right]$$

> **读法：** 每一步动作的对数概率梯度由从该步开始的未来回报加权，再沿轨迹求和并取期望。

**推导：** 对轨迹期望使用 log-derivative trick；环境转移不依赖 theta，只剩策略动作概率的梯度。使用 reward-to-go 可删除动作之前与其无关的奖励。

高回报动作增加概率，低回报动作降低概率。

# 6. Baseline 与 Advantage

减去只依赖状态的 baseline 不改变梯度期望：

$$\mathbb E_{a\sim\pi_\theta(\cdot\mid s)}\!\left[\nabla_\theta\log\pi_\theta(a\mid s)b(s)\right]=0$$

> **读法：** 在固定状态下，策略 log 概率梯度乘任何只依赖状态的 baseline，其动作期望为零。

**推导：** 把 b(s) 提出期望，剩余项等于对所有动作概率梯度求和，也就是概率归一化常数 1 的梯度，因此为零。

选择 $b(s)=V(s)$：

$$A^\pi(s,a)=Q^\pi(s,a)-V^\pi(s)$$

> **读法：** Advantage 衡量动作 a 相对策略在状态 s 下平均表现好多少。

**推导：** 以 V 作为状态 baseline 从 Q 中扣除，保留动作相对差异并降低策略梯度方差。

得到低方差策略梯度：

$$\nabla_\theta J=\mathbb E\!\left[\sum_t\nabla_\theta\log\pi_\theta(a_t\mid s_t)A^\pi(s_t,a_t)\right]$$

> **读法：** Actor 按每一步动作的 Advantage 调整其概率：高于平均的动作增大概率，低于平均的动作减小概率。

**推导：** 在策略梯度中用 Q 减去 V baseline，上一式证明该替换不改变期望。

# 7. Actor-Critic

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBIW+eKtuaAgeaIluingua1i+WOhuWPsl0gLS0+IEFbQWN0b3Ig5Lqn55Sf5Yqo5L2cXQogICAgQSAtLT4gRVvnnJ/lrp7njq/looNdCiAgICBFIC0tPiBSW+WlluWKseS4jue7iOatol0KICAgIEUgLS0+IFMyW+S4i+S4gOeKtuaAgV0KICAgIFMyIC0tPiBDW+ebruaghyBDcml0aWMg5Lyw6K6h5LiL5LiA5Lu35YC8XQogICAgUiAtLT4gVERb5p6E6YCgIFREIGVycm9yIC8gQWR2YW50YWdlXQogICAgQyAtLT4gVEQKICAgIFREIC0tPiBDVVvmm7TmlrAgQ3JpdGljXQogICAgVEQgLS0+IEFEVlvkvLDorqHliqjkvZznm7jlr7nku7flgLxdCiAgICBBRFYgLS0+IEFVW+abtOaWsCBBY3Rvcl0KICAgIEFVIC0tPiBBCiAgICBFIC0tPiBI" />

Critic 最小化：

$$\mathcal L_Q=\mathbb E\!\left[(Q_\phi(s_t,a_t)-\operatorname{sg}(y_t))^2\right]$$

> **读法：** Critic 最小化当前 Q 预测与停止梯度后的 TD 目标之间的平方误差。

**推导：** Bellman 目标作为回归标签；停止梯度避免通过目标分支同时移动标签，目标网络和双 Q 可进一步降低不稳定与高估。

Actor 最大化：

$$\mathcal L_\pi=-\mathbb E_{s\sim\mathcal D,\,a\sim\pi_\theta(\cdot\mid s)}[Q_\phi(s,a)]$$

> **读法：** Actor 最小化负 Q，也就是让自身动作在 Critic 看来具有更高长期价值。

**推导：** 最大化期望 Q 与最小化其负值等价；如果 Critic 在数据外动作上高估，该目标会主动把 Actor 推向错误区域。

Critic 的外推误差会直接推动 Actor 选择错误动作，这就是连续控制 Actor-Critic 的主要不稳定来源。

# 8. 连续动作 Actor

高斯策略：

$$a=\mu_\theta(s)+\sigma_\theta(s)\odot\epsilon,\quad \epsilon\sim\mathcal N(0,I)$$

> **读法：** 高斯 Actor 把与参数无关的标准噪声，经状态相关均值和标准差变换成动作。

**推导：** 重参数化把随机性隔离到 epsilon，使损失对动作的梯度可以继续传到 mu、sigma 和策略参数。

$$\nabla_\theta J=\mathbb E_s\!\left[\left.\nabla_a Q_\phi(s,a)\right|_{a=\mu_\theta(s)}\nabla_\theta\mu_\theta(s)\right]$$

> **读法：** 确定性策略梯度把 Critic 对动作的梯度，与 Actor 输出动作对参数的梯度相乘。

**推导：** 对复合函数 Q(s,mu_theta(s)) 使用链式法则。确定性策略直接输出动作，机器人动作有界时常经 tanh 和物理范围缩放，饱和区会削弱梯度。

# 9. 熵正则与 SAC 直觉

最大熵目标：

$$J_{\mathrm{ent}}=\mathbb E\!\left[\sum_{t=0}^{T-1}\gamma^t\left(r_t+\alpha\mathcal H(\pi_\theta(\cdot\mid s_t))\right)\right]$$

> **读法：** 最大熵目标同时奖励任务回报和策略在每个状态下的动作熵，alpha 控制随机性价值。

**推导：** 在普通回报中加入熵奖励即可得到；它鼓励保留多种高价值动作，但真实机器人上过大熵会表现为抖动和危险探索。

熵鼓励探索和多样动作。机器人中熵过大可能产生危险抖动，因此需要动作范围、安全层和离线预训练。

# 10. 部分可观测和长时信用分配

相同图像可能对应“刚接触”或“正在滑动”。Critic 需要历史：

$$Q(h_t,a_t),\quad h_t=(o_{\le t},a_{<t})$$

> **读法：** 部分可观测时，Critic 根据截至当前的观测和此前动作历史 h_t 评价当前动作。

**推导：** 单帧不能区分速度、接触阶段和隐藏状态时，历史是构造近似充分状态的输入；RNN、Transformer 或滤波器可实现该压缩。

长时任务的最终失败可能由早期动作造成。n-step、λ-return、技能级价值和阶段奖励可以缓解，但也可能引入错误归因。

# 11. 最小实验

1. 在二维连续控制任务实现 Monte Carlo、TD 和 Actor-Critic。
2. 比较不同 n-step 和 λ。
3. 加入观测遮挡，比较单帧和历史 Critic。
4. 让 Critic 在分布外动作上高估，观察 Actor 崩溃。
5. 加入双 Q、target network 和 entropy，分别消融。

# 12. 失败模式与诊断

| 失败模式 | 可观测症状 | 判别与处理 |
|-|-|-|
| Q 过高估计 | 预测 Q 持续上升，真实回报停滞或下降 | 双 Q、目标平滑、与真实回报分桶校准 |
| Actor 利用 Critic | 策略输出数据中罕见动作并获得虚高 Q | 动作覆盖审计、行为约束、保守价值 |
| 动作饱和 | tanh 长期贴边，梯度接近零且执行冲击大 | 记录 pre-tanh 值、重新缩放动作、加入平滑与限幅 |
| 熵导致危险抖动 | 策略在接触阶段持续随机探索 | 状态相关熵、安全层、离线预训练与分阶段探索 |
| 历史不足 | 同一图像下价值呈多峰且预测失准 | 增加历史、状态估计、按接触阶段分层评测 |
| 奖励尺度不稳 | Critic 梯度或熵权重随任务变化剧烈 | 奖励归一化、自动温度、跨任务尺度消融 |

# 13. 论文坐标与证据边界

| 工作 | 论文事实 | 作者解释 | 课程判断 |
|-|-|-|-|
| REINFORCE | 用采样回报和 log 概率梯度直接优化随机策略 | 无需可导环境也能估计策略梯度 | 是理论起点，但高方差使其不是现代机器人连续控制的充分基线 |
| GAE | 用指数加权 TD residual 构造可调偏差方差的 Advantage | 可稳定策略优化中的信用分配 | 需要与 horizon、终止处理和 Critic 质量共同报告 |
| DDPG | 把确定性策略梯度、经验回放和目标网络用于连续动作 | Actor 可替代连续动作上的显式最大化 | 容易受 Q 高估和超参数影响，应至少与 TD3 或 SAC 对照 |
| TD3 | 采用双 Critic、延迟 Actor 更新和目标策略平滑 | 这些机制可缓解函数逼近造成的高估 | 改进稳定性不等于解决离线分布外问题，固定数据场景仍需保守方法 |
| SAC | 使用随机 Actor、双 Q 与最大熵目标进行 off-policy 连续控制 | 熵正则可提升样本效率与鲁棒性 | 真实机器人上必须将探索、安全层和动作频率纳入证据，而不能只转述仿真回报 |

<bookmark name="Policy Gradient Theorem / REINFORCE" href="https://link.springer.com/article/10.1007/BF00992696"></bookmark>

<bookmark name="Generalized Advantage Estimation" href="https://arxiv.org/abs/1506.02438"></bookmark>

<bookmark name="DDPG" href="https://arxiv.org/abs/1509.02971"></bookmark>

<bookmark name="TD3" href="https://arxiv.org/abs/1802.09477"></bookmark>

<bookmark name="Soft Actor-Critic" href="https://arxiv.org/abs/1801.01290"></bookmark>

# 14. 本课练习

1. 推导策略梯度 log-derivative。
2. 证明状态 baseline 不改变梯度期望。
3. 比较 SARSA 和 Q-learning 的数据分布。
4. 解释连续动作中为什么需要 Actor。
5. 设计一个区分 Actor 错误和 Critic 错误的实验。
6. 说明 Action Chunk 的 Q 值应如何定义。
