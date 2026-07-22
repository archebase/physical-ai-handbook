---
title: "B7｜4D 世界状态与 World Action Models：从几何预测到可执行未来"
sourceToken: Ywecd7gKho7N9ax85g5ccwYfnVg
sourceRevision: 15
license: Apache-2.0
---

> [飞书原文](https://archebase.feishu.cn/docx/Ywecd7gKho7N9ax85g5ccwYfnVg) · 源修订 15

::: tip 💡
**前沿机制课：** 本课把“生成一段看起来合理的视频”推进到“联合预测动作、未来观测和时变三维结构”。重点不是追逐 WAM 名称，而是判断模型究竟学到了视觉相关性、几何约束、动作后果，还是足以进入真实机器人闭环的动力学。
:::

# 学习目标与范围边界

完成本课后，读者应能区分动作条件视频模型、联合 World Action Model、4D 几何世界模型、物理世界模型和控制器；写出 WAM 的联合分布与训练目标；解释 WAM4D、X-WAM 的关键设计；并设计能够检验“想象—动作一致性”的闭环实验。

**前置知识：** 建议先完成 B1 状态空间与潜在动力学、B2 模型式规划、B4 视频世界模型和 B6 现代具身世界模型。需要理解条件概率、扩散或 Flow Matching、相机几何、深度图和 Action Chunk。

**范围边界：** 本课中的 4D 指三维空间随时间变化，即 3D + time。它不是第四个空间维度，也不自动包含质量、摩擦、接触力、刚度、执行器动态和材料形变。4D 几何一致性是物理建模的重要条件，但不是完整物理充分条件。

# 1. World Action Model 究竟联合建模什么

WAM 不是“同时有视频头和动作头”这么简单。它的核心是让未来世界表示与可执行动作在同一个条件模型中发生信息交换，使模型既能回答“这段动作会导致什么”，也能回答“为了到达这个未来应该怎样动作”。

## 1.1 联合概率对象

$$p_\theta(o_{t+1:t+H},a_{t:t+H-1}\mid h_t,g)$$

> **读法：** 给定截至当前的历史 h_t 和任务条件 g，模型为未来 H 步观测与动作块分配联合概率。

**推导：** 如果未来观测和动作由同一潜在交互过程产生，就不能只把它们视为两个互不相关的监督头。联合建模允许动作 token 约束未来世界，也允许未来世界表征反向约束动作生成。

联合分布可以按动作优先分解：

$$p_\theta(a_{t:t+H-1}\mid h_t,g)\,p_\theta(o_{t+1:t+H}\mid h_t,g,a_{t:t+H-1})$$

> **读法：** 先根据历史和目标生成动作，再预测该动作条件下的未来观测。

也可以按未来优先分解：

$$p_\theta(o_{t+1:t+H}\mid h_t,g)\,p_\theta(a_{t:t+H-1}\mid h_t,g,o_{t+1:t+H})$$

> **读法：** 先表达可能或期望的未来，再由逆动力学式动作头恢复实现该未来的动作。

这两种分解对应不同的生成顺序和控制接口。真正需要检查的不是论文使用了哪个名字，而是动作与未来之间是否存在可训练、可干预和可评测的一致性约束。

## 1.2 “预测得像”不等于“动作是对的”

视频损失可以奖励纹理、背景和平均运动趋势，动作损失则要求控制量在机器人坐标系、时序和执行频率上正确。两者共享表示可能互相帮助，也可能发生梯度冲突。BadWAM 进一步说明，即使预测未来看起来合理，动作仍可能在扰动下发生 world–action drift。因此 WAM 的最小证据单位必须是“动作、想象未来和真实执行结果”三者，而不是单独的视频质量。

# 2. 4D 表示不是一种格式，而是一组设计选择

“4D”可以落在不同表示空间。表示选择决定模型能看见什么、损失如何定义、推理成本多高，以及规划器能否直接读取碰撞与可达性。

| 表示 | 保留的信息 | 主要优势 | 关键缺口 |
|-|-|-|-|
| 单视角 RGB 视频 | 外观与二维运动 | 可复用大规模视频先验 | 深度、遮挡后结构和尺度不明确 |
| 多视角 RGB | 跨视角外观约束 | 减少单视角歧义 | 几何仍是隐式的，视角同步要求高 |
| RGB-D / 深度序列 | 逐帧表面距离 | 可计算重投影和空间误差 | 遮挡区域、透明反光物体和传感噪声仍困难 |
| 点云与 Scene Flow | 三维位置与运动场 | 适合对象运动和接触邻域分析 | 点对应、拓扑变化和长时累积误差明显 |
| Occupancy / SDF | 占据、自由空间或隐式表面 | 便于碰撞检查和规划 | 高分辨率解码昂贵，语义与动力学未必充分 |
| Dynamic NeRF / 4D Gaussian | 连续视角下的时变辐射场 | 新视角合成质量高 | 在线更新、动作因果与实时控制接口较弱 |
| 对象中心状态 | 对象位姿、速度、关系和事件 | 可解释、适合任务规划 | 对象发现和非刚体交互容易失真 |
| 空间 Register Token | 压缩的几何监督与空间先验 | 不必在执行时密集解码 4D | 空间信息是否充分进入动作表示需要消融验证 |

因此，4D-WAM 不应只按“是否输出深度”分类。更重要的三个问题是：几何信息在训练还是推理时使用；几何是密集解码还是压缩 token；几何分支是否真正改变动作成功率，而不只是改善离线重建指标。

# 3. 从视频先验到动作与几何联合模型

现代 WAM 常从预训练视频扩散 Transformer 或视频生成模型出发，因为视频模型已经吸收对象运动、遮挡、接触前后外观变化等视觉先验。机器人数据再提供动作、本体状态、任务条件和几何监督。

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCkhb5Y6G5Y+y5aSa6KeG6KeS6KeC5rWL5LiO5pys5L2T54q25oCBXSAtLT4gRVvop4bpopHlhYjpqoznvJbnoIHlmaggLyBEaVRdCkdb6K+t6KiA44CB55uu5qCH5Zu+5YOP5oiW6KeG6aKR5LiK5LiL5paHXSAtLT4gRQpFIC0tPiBaW+WFseS6q+aXtuepuuihqOekul0KWiAtLT4gVlvmnKrmnaUgUkdCIC8gUkdCLUQgLyDlh6DkvZXliIbmlK9dClogLS0+IEFb5Yqo5L2c5Z2X5YiG5pSvXQpWIC0tPiBDW+WHoOS9leS4jui3qOinhuinkuS4gOiHtOaAp10KQSAtLT4gQwpDIC0tPiBQW+WAmemAieetm+mAieOAgeinhOWIkuaIlumXreeOr+aJp+ihjF0KUCAtLT4gUlvnnJ/lrp7nu5PmnpzkuI7lpLHotKXmlbDmja5dClIgLS0+IEU=" />

## 3.1 多目标训练

$$\mathcal{L}=\lambda_v\mathcal{L}_{video}+\lambda_a\mathcal{L}_{action}+\lambda_g\mathcal{L}_{geometry}+\lambda_c\mathcal{L}_{consistency}$$

> **读法：** 总损失由视频生成、动作预测、几何监督和动作—未来一致性四类目标加权组成。

**推导：** 视频项提供外观与时序先验，动作项把表示锚定到可执行控制，几何项惩罚空间不一致，一致性项要求生成的动作与想象结果能够互相解释。各权重不能只按损失数值尺度设置，还要通过动作成功率、几何误差和梯度冲突消融确定。

## 3.2 因果可见性与信息泄漏

训练时模型可能同时看到未来视频、深度和动作。如果注意力掩码允许动作 token 直接读取本不应在执行时可见的未来，离线动作误差会很好看，但部署时性能会崩溃。必须明确每种 token 在训练和推理时可以访问哪些时间与模态，并验证移除未来监督后动作头仍保持因果性。

## 3.3 同步与异步生成

视频通常需要更多去噪步数才能获得高保真结果，控制动作却必须低延迟输出。同步去噪让两者共享统一节奏，但会拖慢动作；完全解耦又可能破坏联合分布。异步方法试图在训练时对齐不同噪声时间，在推理时让动作头提前完成、世界分支继续细化。

# 4. WAM4D：用空间 Register Token 注入几何先验

WAM4D 的出发点是：二维视频 WAM 即使视觉上合理，也可能忽略精细操作需要的三维空间约束和遮挡后的接触几何；但让模型在每个控制周期密集生成完整 4D 场景又太慢。

**空间 Register Token。** WAM4D 使用轻量空间 register token 作为训练期的未来深度读出，将预训练几何模型中的空间先验蒸馏或迁移到因果视频—动作 Transformer。执行时可以移除 register 分支，只保留已经吸收空间监督的动作路径，从而避免密集几何解码。

**Causal Mixture Attention。** 模型为视频、动作和几何 token 定义不同的可见性，防止未来深度或未来视频通过非因果捷径泄漏给动作头。这个设计的价值不只是“用了 MoT”，而是明确了不同模态在时间轴上的信息权限。

**课程判断。** 如果移除深度监督后动作成功率下降，而执行延迟没有显著上升，可以支持“几何先验改善了动作表示”的结论。但它仍不能证明模型学会了接触力或材料属性。需要进一步检查透明物体、遮挡抓取、相机外参扰动和接触恢复等条件。

**论文：** [WAM4D: Fast 4D World Action Model via Spatial Register Tokens](https://arxiv.org/abs/2606.14048)

# 5. X-WAM：多视角 RGB-D 与异步去噪

X-WAM 把实时动作执行与高保真 4D 世界合成放进同一框架。它利用预训练视频扩散模型想象未来多视角 RGB-D 视频，并通过复制 DiT 最后若干块建立专用深度分支，以较小结构改动恢复未来空间信息。

## 5.1 Asynchronous Noise Sampling

动作和视频对去噪质量的需求不同。X-WAM 的异步噪声采样在训练时从动作时间步与世界时间步的联合分布采样，使模型适应推理阶段的非同步日程：动作分支用较少步数快速解码，视频与深度分支继续完成更多去噪步。

$$t_a\sim q_a(t),\quad t_w\sim q_w(t),\quad (t_a,t_w)\sim q_{joint}$$

> **读法：** 动作噪声时间和世界噪声时间可以不同，但它们不是完全独立采样，而是从与推理过程一致的联合日程中取得。

**为什么重要：** 若训练时总让动作与视频处于相同噪声水平，推理时提前终止动作去噪会产生分布偏移；若完全独立，又可能削弱动作和未来世界的对齐。联合采样是延迟与一致性之间的折中。

**证据与限制：** 论文报告在 RoboCasa、RoboTwin 2.0 及 5800 小时以上机器人数据预训练上的结果，并同时评估动作成功率与 4D 生成质量。仍应单独核验真实机器人控制频率、多视角标定误差、深度分支成本和失败恢复。

**论文：** [Unified 4D World Action Modeling from Video Priors with Asynchronous Denoising](https://arxiv.org/abs/2604.26694)

# 6. 2026 年最新 WAM 方向

截至 2026 年 7 月，WAM 的前沿已经从“联合生成视频和动作”扩展到新的控制接口、长时记忆、推理时计算和安全攻击面。下面按机制而不是按公司整理。

## 6.1 Masked Visual Actions：把动作变成视觉空间中的轨迹条件

Masked Visual Actions 用视频中某个实体的部分轨迹表达动作。揭示机器人运动时，模型执行前向动力学预测场景响应；揭示目标对象运动时，同一模型反推出实现结果的机器人行为。这提供了跨本体的像素空间控制接口，也让前向预测、候选未来排序与逆模型共享一个 checkpoint。

[Masked Visual Actions for Unified World Modeling](https://arxiv.org/abs/2607.19343)

## 6.2 WorldScape Policy 2.0：记忆、事件与可操控长时规划

WorldScape Policy 2.0 把短期视觉记忆作为 DiT prefill，同时把历史 VLM 输出组织为全局历史、局部活动和事件边界记忆。检索结果增强感知与自回归 planning token，形成隐式子目标；事件级文本、目标图像和视频上下文则提供更细粒度控制。它代表 WAM 从短 Action Chunk 走向任务进度追踪和长时规划。

[WorldScape Policy 2.0](https://arxiv.org/abs/2607.18840)

## 6.3 几何一致性驱动的 Test-Time Scaling

WAM 一次采样同时暴露动作和预测未来，因此可以生成多个候选 rollout，再用冻结几何模型计算跨视角深度重投影一致性进行 Best-of-N 选择。选择性门控只在初始 rollout 内部不一致时增加计算，说明“想象未来”可以成为推理预算分配信号，而不只是可视化副产品。

[Test-Time Scaling for World Action Models via Zero-Shot Geometric Evaluation](https://arxiv.org/abs/2607.17454)

## 6.4 BadWAM：想象正确但动作错误

BadWAM 研究 world–action drift：微小视觉扰动可以显著改变动作，同时让预测未来仍接近干净输入下的想象。它否定了“只要未来画面合理，动作就天然安全”的假设，也要求评测分别报告动作漂移、想象漂移、任务失败和攻击可见性。

[BadWAM: When World-Action Models Dream Right but Act Wrong](https://arxiv.org/abs/2607.15207)

## 6.5 跨本体扩展

AeroAct 将 WAM 用于语言条件四旋翼飞行，以未来第一视角视频作为训练期后果监督，部署时直接解码轨迹动作；GeoWorldAD 则把当前与未来几何 token 引入自动驾驶轨迹细化。这些工作说明 WAM 正从机械臂操作扩展到不同动力学和时间尺度，但跨领域结果不能直接当作通用机器人能力证据。

# 7. 4D-WAM、物理世界模型与 Whole-Body Control 的边界

| 系统 | 主要输出 | 回答的问题 | 不能替代什么 |
|-|-|-|-|
| 4D-WAM | 动作、未来视频、深度或空间 token | 动作与时变空间结果如何联合预测 | 完整接触动力学和稳定控制 |
| 潜在世界模型 | 控制相关潜在状态、奖励、价值 | 怎样高效 rollout 与规划 | 可解释三维几何，除非显式加入 |
| 物理世界模型 | 状态、力、接触模式与不确定性 | 变化是否满足动力学与材料约束 | 高层语义规划和开放词汇任务理解 |
| VLA / 动作策略 | Action Chunk 或轨迹 | 当前应执行什么动作 | 显式未来预测与稳定执行器闭环 |
| Whole-Body Control | 关节目标、力矩、接触力 | 如何满足平衡、接触和任务约束 | 长时语义推理与视觉世界想象 |

合理的机器人系统通常是分层闭环：WAM 或 VLA 提供短时动作、视觉子目标、候选未来与不确定性；轨迹优化器或 MPC 把它们变成约束轨迹；Whole-Body Controller 在高频率下处理平衡、接触、力矩限制和扰动恢复。

$$g_t,\hat{o}_{t+1:t+H},\Sigma_t\rightarrow \text{planner}\rightarrow q^{ref},\dot q^{ref},f^{ref}\rightarrow \text{WBC}\rightarrow \tau_t$$

> **读法：** WAM 输出子目标、预测未来和不确定性，规划器生成参考关节与接触力，全身控制器最终输出实时力矩。

如果 WAM 直接输出关节动作，也仍需要安全过滤、插值、饱和处理和低层反馈。世界模型的预测频率与控制器的执行频率不能混为一谈。

# 8. 如何评测 WAM 是否真的理解动作后果

WAM 评测至少需要把世界预测、动作质量、二者一致性和真实闭环四层分开。

| 证据层 | 推荐指标 | 常见误判 |
|-|-|-|
| 视觉未来 | 感知距离、时序一致性、对象状态变化 | 画面清晰就等于物理正确 |
| 4D 几何 | 深度误差、跨视角重投影、Scene Flow、碰撞与穿透率 | 单帧深度准确就等于长时几何稳定 |
| 动作 | 动作误差、轨迹平滑度、延迟、控制频率 | 离线行为克隆误差低就等于闭环成功 |
| World–Action 一致性 | 预测结果与动作方向的一致性、反事实排序、循环一致性 | 共享 backbone 就自动对齐 |
| 真实闭环 | 成功率、恢复率、碰撞率、接管率、长时任务完成率 | 模拟器平均分可以替代真实干预 |
| 不确定性与安全 | 校准、风险覆盖、扰动下 drift、拒绝与降级行为 | 可视化想象天然提供安全保证 |

## 8.1 必做干预实验

- 固定观测，改变动作：未来对象状态是否按动作方向变化。
- 固定动作，改变对象位置或相机：动作是否随几何关系合理调整。
- 删除几何监督：成功率提升是否确实来自空间分支。
- 打乱动作—视频配对：模型是否依赖真实因果对应，而非数据集背景。
- 跨视角遮挡：不可见接触区域能否保持一致，而非产生穿透。
- 长时 rollout：单步正确是否在多步后累积成几何漂移。
- 加入微小视觉扰动：想象与动作是否出现 BadWAM 式解耦。

# 9. 最小可复现实验

**实验任务：** 在双视角桌面推物或抓放环境中，给定目标对象位置，模型输出 8 至 16 步动作块，并预测两个视角的未来 RGB-D。

## 9.1 四个对照模型

1. Action-only：只预测动作。
2. Video + Action：共享表示但不使用显式几何。
3. RGB-D + Action：加入未来深度监督。
4. 4D Token + Action：训练时使用空间 token，执行时移除密集解码。

## 9.2 数据与切分

训练数据必须包含相机时间戳、外参版本、本体状态、动作时间窗、对象状态和成功标签。测试集按对象实例、初始位置、遮挡程度和相机扰动分层，避免随机帧切分造成轨迹泄漏。

## 9.3 需要报告的结果

同时报告动作误差、闭环成功率、深度与重投影误差、碰撞或穿透率、单次决策延迟和显存。再进行深度监督、因果 mask、异步日程和候选 rollout 数量的消融。若几何指标改善但成功率不变，结论应写成“改善了空间预测”，不能写成“提高了控制能力”。

## 9.4 反事实测试

对同一初始观测输入向左、向右、靠近和远离四组动作，检查未来对象位移的符号与幅度；再给定相同目标未来，检查逆动作是否随相机视角保持几何等价。这个实验比单纯计算生成视频指标更直接地检验动作因果性。

# 10. 论文坐标与证据强度

| 工作 | 核心机制 | 当前可支持的结论 | 仍需验证 |
|-|-|-|-|
| UniSim | 动作条件交互视频生成 | 生成模型可作为可交互视觉模拟器 | 真实机器人动作精度与接触可靠性 |
| Cosmos Policy | 利用世界模型先验学习机器人策略 | 视频先验可进入动作策略训练 | 世界预测贡献与数据规模贡献的分离 |
| WAM4D | 空间 Register Token、训练期深度读出、因果 MoT | 几何监督可改善空间一致性并保持轻量动作推理 | 接触力、长期漂移和真实延迟 |
| X-WAM | 多视角 RGB-D、深度分支、异步噪声采样 | 高质量 4D 生成和快速动作可以联合优化 | 标定误差、跨平台和高频闭环 |
| Masked Visual Actions | 用部分视觉轨迹统一前向、逆向和规划接口 | 像素空间动作接口可复用视频先验并跨本体 | 精细力控与长时稳定性 |
| WorldScape Policy 2.0 | 短期视觉记忆、事件记忆、planning token | WAM 可扩展到进度感知的长时规划与多模态控制 | 记忆错误传播和真实长期恢复 |
| Geometric Test-Time Scaling | 跨视角深度重投影选择候选 rollout | 几何一致性可用于无任务标签的推理时筛选 | 计算预算、错误低分选择和收益饱和 |
| BadWAM | World–Action Drift Attack | 合理想象不能作为动作安全的充分证据 | 防御、在线检测和物理攻击可行性 |

**阅读日期：** 2026 年 7 月 23 日。WAM 领域更新速度很快，后续引用应同时记录论文版本、发布日期、代码与数据开放状态，避免把预印本结果写成稳定共识。

**主要论文：**

- [WAM4D: Fast 4D World Action Model via Spatial Register Tokens](https://arxiv.org/abs/2606.14048)
- [Unified 4D World Action Modeling from Video Priors with Asynchronous Denoising](https://arxiv.org/abs/2604.26694)
- [Masked Visual Actions for Unified World Modeling](https://arxiv.org/abs/2607.19343)
- [WorldScape Policy 2.0](https://arxiv.org/abs/2607.18840)
- [Test-Time Scaling for World Action Models via Zero-Shot Geometric Evaluation](https://arxiv.org/abs/2607.17454)
- [BadWAM: When World-Action Models Dream Right but Act Wrong](https://arxiv.org/abs/2607.15207)
- [AeroAct: Action-Centered World-Action Models for Language-Conditioned Quadrotor Flight](https://arxiv.org/abs/2607.14997)
- [GeoWorldAD: Geometry World Action Model for Autonomous Driving](https://arxiv.org/abs/2607.17521)

# 11. 本课结论与检查题

4D-WAM 的价值不在于给视频模型增加一个深度头，而在于把动作、未来世界和空间约束组织成可以互相检验的预测对象。WAM4D 展示了训练期几何监督与轻量动作推理的折中；X-WAM 展示了多视角 RGB-D 世界生成与异步动作解码；最新工作进一步把 WAM 推向视觉动作接口、长时记忆、推理时扩展和安全审计。

但必须保持结论边界：三维几何正确不等于接触动力学正确，未来画面合理不等于动作安全，联合训练也不等于两个输出天然一致。只有在反事实干预、几何一致性、动作延迟、真实闭环和失败恢复同时成立时，WAM 才能被称为控制可用的世界—动作模型。

## 检查题

1. 为什么 3D + time 仍不能完整表示摩擦、接触力和材料属性？
2. WAM 的动作优先分解与未来优先分解分别适合什么控制接口？
3. WAM4D 为什么可以在执行时移除几何读出分支？需要怎样的消融才能证明空间信息仍进入了动作表示？
4. X-WAM 的异步噪声采样解决了什么训练—推理分布偏移？
5. 为什么 BadWAM 说明“想象合理”不是安全充分条件？
6. 设计一个固定观测、改变动作的反事实实验，并说明成功判据。
7. 4D-WAM、MPC 与 Whole-Body Controller 在人形机器人系统中应如何分工？
