---
title: "C2｜Offline RL：固定机器人数据怎样学习超越行为克隆的策略"
sourceToken: GILnd1e2PoEfuSxvSLIc0Pkjn8e
sourceRevision: 23
---

> [飞书原文](https://archebase.feishu.cn/docx/GILnd1e2PoEfuSxvSLIc0Pkjn8e) · 源修订 23

::: tip 💡
**机制课：**Offline RL 不再与环境在线交互，只使用固定数据集。它希望利用成功与失败的结果信号改进策略，但必须处理分布外动作、价值高估和数据覆盖不足。
:::

# 学习目标

完成本课后，应能解释 Offline RL 与行为克隆、off-policy RL 的区别；推导分布外高估；理解行为约束、保守 Q、Advantage-weighted regression 与 IQL；设计机器人离线数据的质量分层和公平消融。

# 1. 问题定义

固定数据集：

$$\mathcal D=\{(s_t,a_t,r_t,s_{t+1},d_t)\}_{t=1}^{N}$$

> **读法：**离线数据集包含 N 条状态、动作、奖励、下一状态和终止标记的转移样本。

**推导：**这是固定经验数据的定义；训练期间只能从 D 读取，不能执行新动作查询真实结果。

数据由行为策略 $\mu(a\mid s)$ 产生，目标是学习新策略 $\pi(a\mid s)$，但不能再向真实环境查询分布外动作的结果。

| 方法 | 使用动作标签 | 使用奖励 | 能否主动探索 |
|-|-|-|-|
| 行为克隆 | 是 | 否 | 否 |
| Offline RL | 是 | 是 | 否 |
| Online RL | 可选 | 是 | 是 |

# 2. 分布外动作高估

Q-learning 目标：

$$y_t=r_t+\gamma(1-d_t)\max_{a'}Q_{\bar\phi}(s_{t+1},a')$$

> **读法：**Q-learning 目标等于当前奖励，加上未终止时下一状态最大目标 Q 的折扣值。

**推导：**由 Bellman optimality equation 做单样本估计；离线场景的危险在于最大化会搜索数据未覆盖的动作。

最大化会选择 Q 估计最高的动作，而最高估计常来自数据中从未出现的动作。若误差：

$$\hat Q(s,a)=Q^*(s,a)+\varepsilon(s,a)$$

> **读法：**估计 Q 等于真实最优动作价值加函数逼近误差 epsilon。

**推导：**这是误差分解定义；数据密集区域的误差可被监督纠正，分布外动作缺少真实标签，误差可能更大且有系统偏差。

则：

$$\mathbb E\!\left[\max_a\hat Q(s,a)\right]\ge\max_a Q^*(s,a),\quad \mathbb E[\varepsilon(s,a)]=0$$

> **读法：**即使每个动作的 Q 误差分别零均值，先取最大再取期望仍不小于真实 Q 的最大值。

**推导：**最大值是凸函数，由 Jensen 不等式，期望的最大值不小于期望值的最大值；优化器倾向选择恰好被正误差抬高的动作。

Actor 会进一步朝这些虚高动作移动，形成“高估 → 分布更外 → 更高估”的反馈。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBEW+WbuuWumuemu+e6v+aVsOaNrl0gLS0+IFFb6K6t57uDIENyaXRpY10KICAgIFEgLS0+IE9b5pWw5o2u5aSW5Yqo5L2c6KKr6auY5LywXQogICAgTyAtLT4gQVtBY3RvciDlgY/lkJEgT09EIOWKqOS9nF0KICAgIEEgLS0+IFhb5pWw5o2u5Lit5rKh5pyJ55yf5a6e57uT5p6cXQogICAgWCAtLT4gUQogICAgRCAtLT4gQ1vooYzkuLrnuqbmnZ8gLyBDUUwgLyBJUUxdCiAgICBDIC0tPiBQW+WPquWcqOaVsOaNruaUr+aMgeWGheaUuei/m+etlueVpV0KICAgIFAgLS0+IFZb54us56uL5Lu/55yf5oiW55yf5a6e5py65Zmo5Lq66aqM6K+BXQ==" />

::: tip 💡<p><b>交互验证｜Bellman、价值与 Offline RL 实验室</b></p><p>改变折扣因子、分布外动作比例和保守惩罚，观察价值备份与 OOD 高估之间的关系。</p><p><a href="https://archebase.feishuapp.com/app/app_17aeaj7zrzy">Bellman、价值与 Offline RL 实验室</a></p><p><button action="OpenLink" src="https://archebase.feishuapp.com/app/app_17aeaj7zrzy">打开交互实验</button></p><bookmark name="Bellman、价值与 Offline RL 实验室" href="https://archebase.feishuapp.com/app/app_17aeaj7zrzy"></bookmark>:::

# 3. 行为约束

限制新策略不要离行为策略太远：

$$\begin{aligned}\max_\pi\;&\mathbb E_{s\sim\mathcal D,\,a\sim\pi(\cdot\mid s)}[Q(s,a)]\\ \text{s.t. }&\mathbb E_{s\sim\mathcal D}\!\left[D\!\left(\pi(\cdot\mid s),\mu(\cdot\mid s)\right)\right]\le\epsilon\end{aligned}$$

> **读法：**在数据状态上最大化新策略动作的 Q，同时要求新策略与生成数据的行为策略平均距离不超过 epsilon。

**推导：**这是受约束策略改进：价值项提供改进方向，分布距离把动作限制在可由数据验证的邻域；约束过紧退化为模仿，过松恢复 OOD 风险。

可以用 KL、MMD、行为模型或动作解码器定义距离。约束过强退化为行为克隆，过弱又会选择 OOD 动作。

# 4. Conservative Q-Learning

CQL 让数据外动作价值更低。抽象目标：

$$\mathcal L_{\mathrm{CQL}}=\mathcal L_{\mathrm{TD}}+\alpha\,\mathbb E_{s\sim\mathcal D}\!\left[\log\sum_a\exp Q_\phi(s,a)-\mathbb E_{a\sim\mathcal D(\cdot\mid s)}Q_\phi(s,a)\right]$$

> **读法：**CQL 在 TD 损失之外，提高所有动作 Q 的 log-sum-exp 代价，并用数据动作的平均 Q 抵消锚定。

**推导：**log-sum-exp 是平滑最大值，最小化它会压低可能被策略选中的高 Q；减去数据动作 Q 防止把有数据支持的动作一并压低。连续动作中通常通过多种动作分布采样近似该项。

它惩罚策略动作的高 Q，同时提升数据动作的相对价值，从而得到保守下界。过度保守会错过数据中少见但有效的动作。

# 5. Advantage-Weighted Regression

不直接让 Actor 最大化任意 Q，而是在数据动作上加权模仿：

$$\mathcal L_{\mathrm{AWR}}=-\mathbb E_{(s,a)\sim\mathcal D}\!\left[w(s,a)\log\pi_\theta(a\mid s)\right]$$

> **读法：**AWR 在数据动作上做加权最大似然，高权重动作对策略拟合影响更大。

**推导：**把 KL 正则策略改进得到的目标分布投影回参数化策略，等价于对数据动作做 Advantage 加权的交叉熵回归。

$$w(s,a)=\exp\!\left(A(s,a)/\beta\right)$$

> **读法：**动作权重是 Advantage 除以温度 beta 后的指数。

**推导：**KL 正则最优策略相对行为策略按优势指数重加权；beta 越小越集中到高优势动作，实践中常裁剪权重以控制方差。

它只学习数据中出现的动作，降低 OOD 风险。RECAP 的 Advantage conditioning 与这一思想有亲缘关系。

# 6. Implicit Q-Learning

IQL 不在策略动作上求最大 Q，而用 expectile 回归学习状态价值：

$$\mathcal L_V=\mathbb E_{(s,a)\sim\mathcal D}\!\left[L_2^\tau\!\left(Q_\phi(s,a)-V_\psi(s)\right)\right]$$

> **读法：**IQL 用数据动作 Q 与状态价值 V 的残差做 tau-expectile 回归。

**推导：**不同于对动作显式求最大，expectile 用非对称平方损失让 V 靠近数据动作价值分布的上部，从而只在数据支持内形成高价值基线。

expectile loss：

$$L_2^\tau(u)=\left|\tau-\mathbf 1(u<0)\right|u^2$$

> **读法：**expectile 损失对正残差和负残差使用不同权重，再乘残差平方。

**推导：**当 u 为正时权重为 tau，为负时权重为一减 tau；tau 大于二分之一会更重视 Q 高于 V 的样本，把 V 推向上 expectile。

较大 $\tau$ 让 V 靠近数据动作中的高价值部分。随后用：

$$A(s,a)=Q_\phi(s,a)-V_\psi(s)$$

> **读法：**IQL 的 Advantage 是数据动作 Q 减去该状态的 expectile 价值基线。

**推导：**V 表示数据动作价值分布的高位基线，因此正 Advantage 标出相对更优、且确实出现在数据中的动作。

$$\mathcal L_\pi=-\mathbb E_{(s,a)\sim\mathcal D}\!\left[\exp(A(s,a)/\beta)\log\pi_\theta(a\mid s)\right]$$

> **读法：**IQL Actor 用 Advantage 指数权重重新拟合离线数据中的动作。

**推导：**与 AWR 相同，这一步只在数据动作上做策略改进，不让 Actor 直接搜索任意高 Q 动作；实际实现通常裁剪指数权重。

# 7. 数据质量与覆盖

| 数据类型 | 价值 | 风险 |
|-|-|-|
| 专家成功 | 高质量动作 | 状态覆盖窄 |
| 自主成功 | 匹配当前策略分布 | 成功模式单一 |
| 失败轨迹 | 覆盖坏状态和边界 | 没有正确恢复动作 |
| 人工纠正 | 直接给恢复行为 | 干预选择偏差 |
| 随机探索 | 覆盖广 | 真实机器人安全和低效率 |

Offline RL 不是数据越杂越好。必须记录任务阶段、结果、接管和控制故障，避免把系统异常当作策略价值。

# 8. 序列模型与 Return Conditioning

Decision Transformer 类方法把期望回报作为条件：

$$p_\theta(a_t\mid G_{\le t},s_{\le t},a_{<t})$$

> **读法：**回报条件序列模型根据截至当前的 return-to-go、状态历史和此前动作预测当前动作。

**推导：**把 return-to-go、状态和动作交错为序列后，用因果序列建模学习条件动作分布；请求超出数据支持的高回报条件不具有可靠监督。

它将 RL 转为序列建模，但高回报条件只有在数据中存在相应行为时才可靠。请求超出数据支持的 return 可能导致不可预测动作。

# 9. 与生成式 VLA 的连接

Offline critic 可以：

- 给 VLA 轨迹打分和筛选。
- 对 Flow/Diffusion 候选动作重排。
- 通过 Advantage 条件控制策略。
- 为后训练数据分配权重。

Critic 和 VLA 必须使用一致的状态、动作和 Action Chunk 定义，否则价值标签无法正确对齐。

# 10. 最小实验与公平对照

1. 固定相同数据，比较 BC、AWR/IQL、CQL。
2. 固定算法，逐步加入成功、失败和纠正数据。
3. 报告数据动作支持度和策略 OOD 距离。
4. 做价值校准和真实成功率分桶。
5. 对新初始状态、对象和动力学测试。
6. 同时报告安全、碰撞和人工接管。

# 11. 失败模式与诊断

| 失败模式 | 诊断证据 | 处理方向 |
|-|-|-|
| 数据外 Q 高估 | 策略动作远离数据，预测 Q 高但真实回报低 | 保守 Q、行为约束、支持度与校准评测 |
| 过度保守 | 策略几乎复制行为策略，忽略少量高价值动作 | 扫描正则强度、按数据质量分层、与 BC 对照 |
| 高回报条件越界 | Decision Transformer 请求数据中不存在的 return | 限制条件范围、报告训练 return 支持、OOD 检测 |
| 失败数据污染 | 系统故障、延迟或传感异常被误当作动作价值 | 故障标签、时间同步、按失败原因分层 |
| 状态混叠 | 同一图像中的动作回报分布多峰且无法校准 | 历史 Critic、状态估计、接触阶段标签 |
| 新增数据混淆 | Offline RL 提升同时伴随更多或更优数据 | 固定数据集比较 BC、CQL、IQL、AWR |

# 12. 本课练习

1. 证明 max 操作为什么产生高估偏差。
2. 解释行为约束的偏差-改进权衡。
3. 推导 Advantage-weighted regression。
4. 用一维数据演示 CQL 惩罚分布外动作。
5. 比较 IQL 与显式 Actor 最大化 Q。
6. 设计一个等量数据的 RECAP 对照实验。

# 13. 论文坐标与证据边界

| 工作 | 论文事实 | 作者解释 | 课程判断 |
|-|-|-|-|
| BCQ / BEAR | 分别通过批约束动作生成与分布距离限制策略动作 | 约束在行为支持附近可减轻离线外推误差 | 行为模型质量和距离度量本身会成为新误差源 |
| CQL | 对广泛动作的高 Q 施加保守正则，并锚定数据动作价值 | 学习保守价值可提供离线策略改进保证 | 应报告保守程度、动作覆盖和相对 BC 的真实收益，不能只看训练 Q |
| IQL | 用 expectile 学习状态价值，并对数据动作做 Advantage 加权回归 | 无需显式查询数据外动作即可实现稳定离线学习 | 只能重组数据已有能力；缺失技能和恢复状态仍需要新增数据 |
| Decision Transformer | 把 return-to-go、状态与动作作为因果序列进行条件建模 | 序列建模可统一离线 RL 的条件行为预测 | 高回报条件必须在训练支持内，序列似然不能替代真实闭环验证 |
| AWR / AWAC | 按 Advantage 指数权重在数据动作上进行策略回归 | 加权监督学习可实现稳定且保守的策略改进 | 权重高度依赖 Critic 校准和温度，需防止少量错误高优势样本主导训练 |

<bookmark name="Batch-Constrained deep Q-learning" href="https://arxiv.org/abs/1812.02900"></bookmark>

<bookmark name="BEAR" href="https://arxiv.org/abs/1906.00949"></bookmark>

<bookmark name="Conservative Q-Learning" href="https://arxiv.org/abs/2006.04779"></bookmark>

<bookmark name="Implicit Q-Learning" href="https://arxiv.org/abs/2110.06169"></bookmark>

<bookmark name="Decision Transformer" href="https://arxiv.org/abs/2106.01345"></bookmark>

<bookmark name="AWAC" href="https://arxiv.org/abs/2006.09359"></bookmark>
