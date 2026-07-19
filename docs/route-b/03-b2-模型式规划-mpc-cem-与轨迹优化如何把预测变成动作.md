---
title: "B2｜模型式规划：MPC、CEM 与轨迹优化如何把预测变成动作"
sourceToken: TeKPdruXAoYZvFx0gKHc1Po4n4d
sourceRevision: 20
---

> [飞书原文](https://archebase.feishu.cn/docx/TeKPdruXAoYZvFx0gKHc1Po4n4d) · 源修订 20

::: tip 💡
**机制课：** 世界模型只负责预测，规划算法负责在预测中选择行动。本课从有限时域优化出发，推导 MPC、随机 shooting、CEM 和梯度轨迹优化，并分析模型误差、规划长度、计算预算和真实闭环的关系。
:::

# 学习目标

完成本课后，应能写出有限时域规划目标；解释 receding horizon；实现 random shooting 和 CEM；区分可导与黑盒规划；理解终点价值和约束；分析 planning horizon 与模型误差；设计模型利用偏差、计算延迟和闭环重新规划的实验。

# 1. 规划问题的数学形式

已知当前潜在状态 $z_t$ 和世界模型：

$$z_{k+1}=f_\phi(z_k,a_k)$$

> **读法：** 确定性世界模型根据第 k 步潜在状态和动作，计算下一潜在状态。

**推导：** 这是把条件转移分布退化为一个点估计的情形；若模型输出分布，后续规划目标还需对模型随机性取期望或采样估计。

有限时域规划选择动作序列：

$$a_{t:t+H-1}^*=\arg\max_{a_{t:t+H-1}}\mathbb E_{p_\phi}\!\left[\sum_{k=0}^{H-1}\gamma^k r(z_{t+k},a_{t+k})+\gamma^H V(z_{t+H})\right]$$

> **读法：** 在所有长度为 H 的候选动作序列中，选择使模型预测的折扣奖励与终点价值期望最大的一条。

**推导：** 从无限时域回报截取前 H 步，并用终点价值近似剩余尾部回报；随机动力学下对预测轨迹取期望，确定性模型下该期望退化为单条 rollout。

规划器需要四个要素：当前状态、预测模型、目标/奖励、动作搜索方法。缺少任何一个，世界模型都不会自动产生行为。

# 2. Model Predictive Control

MPC 每次求解长度为 $H$ 的动作序列，但只执行前一个动作或前几步：

1. 根据当前观测估计状态 $z_t$。
2. 优化未来动作序列。
3. 执行第一个动作 $a_t^*$。
4. 获得新观测并更新状态。
5. 从新状态重新规划。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBPW+aWsOingua1i10gLS0+IFNb54q25oCB5Lyw6K6hXQogICAgUyAtLT4gUFvnlJ/miJDlgJnpgInliqjkvZzluo/liJddCiAgICBQIC0tPiBNW+S4lueVjOaooeWeiyByb2xsb3V0XQogICAgTSAtLT4gUlvorqHnrpflpZblirEgLyDnu4jngrnku7flgLwgLyDnuqbmnZ9dCiAgICBSIC0tPiBVW+eUqOeyvuiLseagt+acrOaIluair+W6puabtOaWsOWAmemAiV0KICAgIFUgLS0+IFAKICAgIFIgLS0+IEFb6YCJ5oup5bm25omn6KGM56ys5LiA5Liq5Yqo5L2cXQogICAgQ1vlronlhajnuqbmnZ/kuI7kuI3noa7lrprmgKddIC0tPiBBCiAgICBBIC0tPiBFW+ecn+WunueOr+Wig10KICAgIEUgLS0+IE8=" />

::: tip 💡<p><b>交互验证｜世界模型、MPC 与 CEM 规划实验室</b></p><p>改变规划时域、候选数量和模型误差，观察 rollout 误差如何影响 CEM 选出的动作。</p><p><a href="https://archebase.feishuapp.com/app/app_17aeaj1ym56">世界模型、MPC 与 CEM 规划实验室</a></p><p><button action="OpenLink" src="https://archebase.feishuapp.com/app/app_17aeaj1ym56">打开交互实验</button></p><bookmark name="世界模型、MPC 与 CEM 规划实验室" href="https://archebase.feishuapp.com/app/app_17aeaj1ym56"></bookmark>:::

重新规划让真实观测不断纠正模型误差，是模型式控制能够在不完美模型下工作的关键。

# 3. Random Shooting

最简单的采样规划：

1. 从动作分布采样 $N$ 条序列。
2. 用世界模型 rollout 每条序列。
3. 计算回报。
4. 选择回报最高的序列。

估计目标：

$$\hat J(a_{t:t+H-1})=\sum_{k=0}^{H-1}\gamma^k\hat r_{t+k}+\gamma^H\hat V_{t+H}$$

> **读法：** 候选动作序列的估计回报，等于模型 rollout 中的折扣预测奖励之和，加上折扣终点价值。

**推导：** 把上一规划目标中的未知真实奖励和价值替换为世界模型与 critic 的预测值；若模型随机，应对多条样本轨迹求平均或使用风险统计量。

Random shooting 易实现、适合黑盒模型，但高维长时动作空间的有效样本比例极低。

# 4. Cross-Entropy Method

CEM 用参数化分布逐轮集中到高回报区域。设动作序列分布：

$$a_{t:t+H-1}\sim\mathcal N(\mu,\Sigma)$$

> **读法：** 把整段长度为 H 的动作序列拼成一个向量，并从均值为 mu、协方差为 Sigma 的高斯搜索分布采样。

**推导：** CEM 不直接求最优动作，而是迭代拟合高回报区域的分布。高斯是连续动作下便于采样和重估参数的选择，并不意味着真实最优解服从高斯。

每轮：

1. 采样 $N$ 条动作序列。
2. 计算每条序列的预测回报。
3. 选择前 $\rho N$ 条 elite。
4. 用精英样本重新估计动作序列分布的均值和协方差。
5. 重复 $K$ 轮。

$$\begin{aligned}M&=\lceil\rho N\rceil,\\ \mu_{\mathrm{new}}&=\frac{1}{M}\sum_{i\in\mathcal E}a^{(i)},\\ \Sigma_{\mathrm{new}}&=\frac{1}{M}\sum_{i\in\mathcal E}(a^{(i)}-\mu_{\mathrm{new}})(a^{(i)}-\mu_{\mathrm{new}})^{\top}\end{aligned}$$

> **读法：** 先取回报最高的 M 条精英序列，再用它们的样本均值和样本协方差更新搜索分布。

**推导：** 把精英集合视为高回报事件下的样本，对高斯分布做最大似然拟合，闭式解就是精英样本的均值和协方差。

可以使用平滑更新：

$$\mu\leftarrow\alpha\mu_{\mathrm{new}}+(1-\alpha)\mu_{\mathrm{old}}$$

> **读法：** 新的搜索均值由本轮精英均值和上一轮均值按 alpha 加权混合。

**推导：** 这是指数平滑而非 CEM 必然要求。它降低有限样本导致的分布剧烈跳变；alpha 越大越追随当前精英，越小越稳定但收敛更慢。

CEM 不需要模型对动作可导，适合离散、非光滑奖励和复杂生成模型。缺点是 rollout 数量大，实时控制需要高效 latent dynamics 和并行计算。

# 5. 梯度轨迹优化

如果模型和奖励可导，可以直接计算：

$$\nabla_{a_{t:t+H-1}}J$$

> **读法：** 这是规划回报 J 对整段动作序列中每个动作分量的梯度。

**推导：** 通过可导奖励和可导动力学反向传播，链式法则把未来奖励对状态的敏感度逐步传回每个动作；horizon 越长，梯度越容易消失、爆炸或沿模型误差放大。

并迭代：

$$a\leftarrow a+\eta\nabla_a J$$

> **读法：** 把候选动作沿回报上升最快的梯度方向移动一步，步长由 eta 控制。

**推导：** 由 J 在当前动作附近的一阶 Taylor 展开，小步沿正梯度可提高局部近似回报；动作有界时还需投影、参数化或约束优化。

梯度规划样本效率高，但可能陷入局部最优，也容易沿着模型错误方向优化。接触切换和离散技能会导致梯度不连续或无意义。

| 方法 | 需要可导 | 计算 | 适合 |
|-|-|-|-|
| Random shooting | 否 | 大量独立 rollout | 低维短时、基线 |
| CEM | 否 | 多轮采样 | 黑盒、非光滑目标 |
| 梯度优化 | 是 | 反向传播 | 连续平滑动力学 |
| 树搜索 | 否 | 分支展开 | 离散动作或技能 |

# 6. 终点价值为什么重要

有限 horizon 会产生短视。加入终点价值：

$$J_H=\sum_{k=0}^{H-1}\gamma^k r_{t+k}+\gamma^H V(z_{t+H})$$

> **读法：** H 步截断回报由前 H 步奖励和第 H 步状态的折扣价值组成。

**推导：** 把无限回报在 H 处分段，前半段显式 rollout，后半段的条件期望由价值函数近似；价值估计无偏且准确时，两段可恢复原长期目标。

价值函数近似 horizon 之后的长期结果，使规划器不用把整条任务展开到终点。但错误 critic 会让规划器偏好看似高价值的终点状态。

# 7. 约束与安全

规划不只是最大化奖励，还要满足：

$$g(z_k,a_k)\le 0$$

> **读法：** 每个预测状态和动作都必须使约束函数 g 不大于零。

**推导：** 把关节、速度、碰撞或力限制写成可行集合的隐式表示。硬约束要求候选始终在集合内；只把 g 加进奖励是软惩罚，不能自动提供安全保证。

约束可以包括关节限位、速度、碰撞、力和工作空间。处理方式包括：

- 拒绝不可行候选。
- 在奖励中增加惩罚。
- 将动作映射到可行集合。
- 使用独立安全过滤器。

软惩罚不能保证硬安全。真实机器人通常需要规划器之外的确定性安全层。

# 8. Horizon 的三重权衡

| Horizon 增大 | 收益 | 代价 |
|-|-|-|
| 更长远 | 减少短视 | 模型误差累积 |
| 更多动作变量 | 表达复杂计划 | 搜索维度指数增长 |
| 更长 rollout | 看到延迟结果 | 推理延迟提高 |

最佳 horizon 取决于世界模型质量、控制频率、任务延迟和终点价值准确性。不是越长越好。

# 9. 模型利用偏差

规划器不是被动使用模型，而会主动寻找模型预测中的漏洞。例如模型低估碰撞，优化器会选择穿过障碍的轨迹。

可以使用风险敏感目标：

$$J_{\mathrm{risk}}=\mathbb E[J]-\lambda\sqrt{\operatorname{Var}(J)}$$

> **读法：** 风险敏感分数等于预测回报均值，减去 lambda 倍的回报标准差。

**推导：** 这是均值减标准差的保守启发式：在均值相近时惩罚预测分歧更大的轨迹。它不是普适风险定理，lambda 必须结合回报尺度、校准和任务风险选择。

或对 ensemble 分歧、OOD 状态和不确定性进行惩罚。最终仍需要真实环境验证。

# 10. Warm Start 与实时性

相邻控制周期的最优动作序列通常相似。可以把上一次序列左移作为新分布均值：

$$\mu_t^{\mathrm{init}}=\left[a_{t:t+H-2}^{*},a_{\mathrm{tail}}\right]$$

> **读法：** 当前周期的初始均值取上一周期最优序列中尚未执行的 H-1 个动作，并在末尾补一个尾部动作。

**推导：** 上一周期执行首个动作后，其余动作自然向左平移一个时间步；补上保持、零动作或策略先验给出的尾部动作后，序列长度恢复为 H。

Warm start 减少搜索轮数，并提高动作连续性。实时系统还需控制 rollout 数量、batch 并行、模型延迟和规划超时。

# 11. 技能级规划

对长时任务，搜索低层动作过于昂贵。可以在技能空间规划：

$$\omega_{k:k+K-1}^{*}=\arg\max_{\omega_{k:k+K-1}}\mathbb E\!\left[\sum_{j=0}^{K-1}\gamma^j R(z_{k+j},\omega_{k+j})+\gamma^K V(z_{k+K})\right]$$

> **读法：** 在长度为 K 的技能序列中，选择使技能级奖励与终点价值期望最大的序列。

**推导：** 把低层动作替换为持续多步的技能变量，状态转移变成技能执行后的半马尔可夫转移；索引到 k+K-1 恰好包含 K 个技能。

世界模型预测技能后的状态，低层策略执行技能。技能级模型更高效，但需要可靠的启动、终止和失败检测。

# 12. 一维小车实验

目标是让小车停在位置 1，动作是加速度，存在阻尼和动作上限。

1. 实现线性动力学与带误差的学习模型。
2. 比较 random shooting、CEM 和梯度优化。
3. 扫描 horizon、候选数量和 CEM 轮数。
4. 加入模型低估阻尼的偏差。
5. 比较 open-loop 全序列执行与 MPC 单步重规划。
6. 加入不确定性惩罚，观察成功率和保守程度。

# 13. 可信评测

- 模型内预测回报与真实回报的相关性。
- 规划时间分布和超时率。
- 任务成功、时间、能耗和安全。
- 不同 horizon 和计算预算的曲线。
- 模型 ensemble 分歧与真实失败的校准。
- 世界模型、终点价值和重新规划频率消融。

# 14. 论文坐标与证据边界

规划算法的结果强烈依赖世界模型、奖励、约束和计算预算。下面的“论文事实”只描述方法明确做了什么；“课程判断”用于提醒真实机器人上仍需补哪些证据。

| 工作 | 论文事实 | 作者解释 | 课程判断 |
|-|-|-|-|
| Cross-Entropy Method | 用精英样本反复拟合参数化采样分布 | 稀有事件估计方法可转化为黑盒优化 | 是机器人采样规划的强通用基线，但对 horizon、样本数和动作相关性高度敏感 |
| MPPI | 用受控轨迹采样和指数权重更新控制序列 | 信息论控制可实现实时采样式 MPC | 适合连续控制与并行 rollout；真实部署必须单独报告噪声尺度、约束和延迟 |
| PlaNet | 在 RSSM 潜在空间中使用 CEM 进行在线规划 | 像素观测可通过 latent planning 完成控制 | 证明表示加规划可行，但视觉基准收益不能直接证明接触机器人上的物理可靠性 |
| TD-MPC2 | 联合学习潜在动力学、奖励、价值和策略先验，并执行短时域规划 | 模型式控制可以扩展到多任务和更大模型 | 是 B2 的现代强基线；公平比较必须固定模型容量、规划预算与控制频率 |
| MuZero | 在学习到的潜在模型上使用树搜索，预测奖励、价值和策略 | 规划模型不必重建真实观测 | 说明离散技能或决策级搜索是另一条路线，但连续机器人控制仍需要动作参数化与低层控制接口 |

<bookmark name="The Cross-Entropy Method for Combinatorial and Continuous Optimization" href="https://doi.org/10.1023/A:1010091220143"></bookmark>

<bookmark name="Information Theoretic MPC for Model-Based Reinforcement Learning" href="https://arxiv.org/abs/1707.02342"></bookmark>

<bookmark name="PlaNet" href="https://arxiv.org/abs/1811.04551"></bookmark>

<bookmark name="TD-MPC2" href="https://arxiv.org/abs/2310.16828"></bookmark>

<bookmark name="MuZero" href="https://arxiv.org/abs/1911.08265"></bookmark>

# 15. 本课练习

1. 手写 random shooting 和 CEM 伪代码。
2. 解释 MPC 为什么只执行第一个动作。
3. 比较硬约束和奖励惩罚。
4. 构造一个规划器利用模型错误的反例。
5. 说明终点价值如何减少 horizon，又会引入什么偏差。
6. 把低层动作规划改写为技能级规划。
