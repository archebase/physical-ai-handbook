---
title: Course Catalog
sourceToken: T7dLdyp0RolnUgxQCqTcXyZZnbc
sourceRevision: 85
license: Apache-2.0
translationSource: "guide/catalog.md"
translationSourceHash: 11ca1a23748d1e3ae989779f48e387d5f398eecf071ae9351c772869d60e5aef
---

> [Feishu source catalog](https://archebase.feishu.cn/docx/T7dLdyp0RolnUgxQCqTcXyZZnbc) · Source revision 85

::: tip 💡
**Intended audience:** Algorithm, data, and robotics systems practitioners with knowledge of probability and statistics, linear algebra, and basic deep learning who want to quickly build a comprehensive understanding of Physical AI. This catalog is organized not by company or paper publication date, but by the mathematical objects that models actually learn.
:::

# How to Use This Catalog

Physical AI is not a single-track technical path. Direct policies, world models, value learning, hierarchical planning, data representations, control, and systems engineering each solve different problems while operating together within the same physical closed loop.

All readers should first complete the “Common Foundations” and then choose one primary route for deeper study. An article’s **primary placement** indicates only the most suitable entry point; it does not mean that the article is relevant only to that route. Cross-route relationships are explicitly identified after each module.

## Unified Quality Standards for the Course

This course is intended for readers with university-level knowledge of probability and statistics, linear algebra, and basic deep learning. Every mechanism course and paper lab must meet the following requirements to be considered complete.

| Requirement | Must answer |
|-|-|
| Learning object | Whether the model is estimating a distribution, state, value, subgoal, representation, or control law |
| How to read equations | Every standalone equation must be immediately followed by a blockquote that explains each condition, random variable, and operator in plain language |
| Derivation | Explain which probabilistic assumption, definition, physical equation, or optimization objective the equation follows from; presenting only the result is not allowed |
| Visualization | Include at least one computational graph, probabilistic graphical model, closed-loop diagram, or curve that genuinely reduces the effort required for understanding |
| Minimal experiment | Readers must be able to reproduce the key phenomenon in a toy environment rather than simply trust the paper’s conclusions |
| Position in the literature | Distinguish facts, the authors’ interpretation, and the course’s judgment, and compare against strong baselines from the same route |
| Closed-loop risks | Discuss distribution shift, contact, latency, missing observations, safety, and failure recovery |

All equations follow a unified “four-step explanation”: first present the equation, then provide a blockquoted plain-language reading, derive it, and finally explain its meaning within the robot’s closed loop.

> **Example equation-reading block:** This should not merely read the symbols aloud. It should explain what is conditioned on, which random quantity is being predicted, and which cases are covered by the summation or expectation.

Inline symbols are defined consistently in the symbol table for the section. Every standalone equation that specifies a definition, loss, dynamics model, update rule, or inference process must be accompanied by its own blockquoted reading and derivation.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBGW0NvbW1vbiBGb3VuZGF0aW9uc10gLS0+IEFbVkxBIGFuZCBEaXJlY3QgUG9saWNpZXNdCiAgICBGIC0tPiBCW1dvcmxkIE1vZGVscyBhbmQgUGxhbm5pbmddCiAgICBGIC0tPiBDW1ZhbHVlIGFuZCBFeHBlcmllbmNlIExlYXJuaW5nXQogICAgRiAtLT4gRFtIaWVyYXJjaGljYWwgUmVhc29uaW5nIGFuZCBNZW1vcnldCiAgICBGIC0tPiBFW0RhdGEgYW5kIENyb3NzLUVtYm9kaW1lbnQgUmVwcmVzZW50YXRpb25zXQogICAgRiAtLT4gSFtEeW5hbWljcyBhbmQgQ29udHJvbF0KICAgIEUgLS0+IEEKICAgIEUgLS0+IEIKICAgIEIgLS0+IEQKICAgIEIgLS0+IEMKICAgIEMgLS0+IEEKICAgIEMgLS0+IEQKICAgIEQgLS0+IEEKICAgIEEgLS0+IEgKICAgIEIgLS0+IEgKICAgIEggLS0+IEdbU3lzdGVtcywgRXZhbHVhdGlvbiwgYW5kIERhdGEgRW5naW5lc10KICAgIEcgLS0+IEU=" />

# 00｜Common Foundations: The Shared Language of All Routes

**Core questions:** What are states, observations, actions, trajectories, and policies? Why does the training distribution change during deployment? How do the loss functions of probabilistic models translate into real robot behavior?

## 00.1｜Core Course on Common Foundations

[00｜Physical AI Common Foundations: What Is an Agent Actually Learning?](/en/foundation/01-00-physical-ai-公共地基-智能体究竟在学习什么)

**Paper and derivation lab:** [In-Depth Derivations of Behavior Cloning, Distribution Shift, and Flow Matching](/en/foundation/02-01-从机器人控制到-flow-matching-π-系列的数学地基)

**Learning objects:** Conditional action distributions, maximum likelihood, mean squared error, multimodal actions, action chunks, and deployment distribution shift.

## 00.2｜Boundaries Between Physical AI Modules

| Module | Primary mathematical object | Question answered |
|-|-|-|
| Policy | Conditional action distribution | What should be done now? |
| World model | Action-conditioned state-transition distribution | What will happen after taking this action? |
| Value function | State value and action value | How good will the future be? |
| Planner | Candidate action sequences or subgoals | Which path should be selected? |
| Controller | Feedback control law | How can the action be executed stably? |

# Route A｜VLA and Direct Policy Learning

**Route question:** Can robot actions be generated directly from vision, language, and proprioceptive state? This route learns conditional action distributions and is currently the primary direction for general-purpose robot policies and robot foundation models.

## A0｜Core Route Course: VLA and Direct Policy Learning

[A0｜VLA and Direct Policy Learning: From Conditional Imitation to Robot Foundation Models](/en/route-a/01-a0-vla-与直接策略学习-从条件模仿到机器人基础模型)

**Cross-route relationships:** Uses data and representations from Route E; can be further improved using value signals from Route C; and is ultimately executed by the control systems in Route F.

## A1｜Specialized Lab: Action Representations and FAST

[Action Representations: MSE, Autoregressive Tokens, Diffusion, Flow Matching, and FAST](/en/route-a/02-a1-动作表示与生成式策略-从连续控制到-fast-tokenizer)

**Core question:** Does a policy output a conditional mean, a discrete action sequence, a score, or the vector field of a probability flow?

## A2｜Mainstream VLA Lineages and Architectural Evolution

[RT, Open X, Octo, OpenVLA, GR00T, and Gemini Robotics](/en/route-a/03-a2-主流-vla-谱系-rt-open-x-octo-openvla-gr00t-与-gemini-robotics)

**Core question:** Beyond the π series, how do mainstream VLAs combine multitask imitation, vision-language pretraining, cross-embodiment data, and generative action modules? Do capability gains actually come from architecture, data, or post-training?

## A3｜Physical Intelligence π Series Paper Labs

| Lab | Article | Research focus within the VLA route | Cross-route links |
|-|-|-|-|
| A3.1｜π0 | [How a VLM Connects to Continuous Control](/en/route-a/04-a3-1-π0-架构-视觉语言模型如何接上连续机器人控制) | Multimodal conditioning and the Action Expert | E, F |
| A3.2｜FAST | [Why Actions Need a Tokenizer](/en/route-a/02-a1-动作表示与生成式策略-从连续控制到-fast-tokenizer) | Discrete action pretraining and the continuous-control interface | E |
| A3.3｜π0.5 | [How Open-World Generalization Is Trained](/en/route-a/05-a3-3-π0-5-开放世界泛化是如何被训练出来的) | Heterogeneous co-training, hierarchical reasoning, and post-training | D, E |
| A3.4｜π0.6\* / RECAP | [Improving from Successes, Failures, and Corrections](/en/route-a/06-a3-4-π0-6-recap-机器人如何从成功-失败和纠正中改进) | How a general-purpose VLA continues to improve using deployment experience | C, G |
| A3.5｜π0.7 | [From a General-Purpose Policy to a Controllable Model](/en/route-a/07-a3-5-π0-7-从通用策略到可操控的机器人基础模型) | Prompts, visual subgoals, automatic hierarchy, and controllability | B, D, E |
| A3.6｜OpenPI | [OpenPI in Practice and Data Production](/en/route-g/02-a3-6-openpi-实践-从数据契约到机器人闭环) | VLA training, data formats, and deployment engineering | G |

**Recommended order:** A0 → A1 → A2 → π0 → π0.5 → π0.6\* → π0.7. FAST can be studied independently after π0.

# Route B｜World Models and Model-Based Planning

**Route question:** Can we learn action-conditioned future changes and use the model to compare “what would happen if this action were taken”?

## B0｜Core Route Course: World Models and Model-Based Planning

[World Models and Planning: State-Space Models, ELBO, MPC, CEM, and Learning from Imagination](/en/route-b/01-b0-世界模型与模型式规划-让-physical-ai-学会预测-如果这样做-会发生什么)

## B1-B6｜World Model Route Course Tree

| Module | Core question | Course |
|-|-|-|
| B1｜State Space and Latent Dynamics | How can a predictive state be constructed from partially observable data? | [State Space, Filtering, ELBO, and Multistep Rollouts](/en/route-b/02-b1-状态空间与潜在动力学-世界模型如何从观测中构造可预测状态) |
| B2｜Model-Based Planning | How can actions be searched within a learned model? | [MPC, CEM, Trajectory Optimization, and Risk-Aware Planning](/en/route-b/03-b2-模型式规划-mpc-cem-与轨迹优化如何把预测变成动作) |
| B3｜Learning from Imagination | How can an Actor-Critic be trained using latent-space rollouts? | [Dreamer, Model Gradients, and Imagination Bias](/en/route-b/04-b3-想象学习-世界模型如何训练策略与价值函数) |
| B4｜Video World Models | How can visual futures serve as subgoals and control conditions? | [Video Prediction, Visual Planning, and Physical Consistency](/en/route-b/05-b4-视频世界模型与视觉规划-生成未来画面怎样帮助机器人行动) |
| B5｜Classic Paper Lab | How do latent world models and model-based reinforcement learning approaches compare? | [World Models, Dreamer, MuZero, and TD-MPC2](/en/route-b/06-b5-世界模型论文实验室-world-models-dreamer-muzero-与-td-mpc2) |
| B6｜Modern Embodied World Models | When are generated video, interactive environments, and action-conditioned models genuinely useful for control? | [UniSim, Genie, V-JEPA 2, Cosmos, and Action-Conditioned Video](/en/route-b/07-b6-现代具身世界模型-unisim-genie-v-jepa-2-cosmos-与动作条件视频) |

**Cross-route relationships:** Provides subgoals and counterfactual rollouts to Route D, and imagined data to Route C. The visual subgoals of π0.7 and WAM-TTT can serve as cross-route case studies.

# Route C｜Value, Reward, and Experience Learning

**Route question:** How does a robot determine which states and actions are better over the long term, and how can it use deployment-time successes, failures, preferences, and corrections to improve its policy?

## C0｜Core Route Course: Value, Reward, and Experience Learning

[C0｜Value, Reward, and Experience Learning: How Physical AI Improves Behavior from Outcomes](/en/route-c/01-c0-价值-奖励与经验学习-physical-ai-如何从结果中改进行为)

## C1-C4｜Value and Experience Learning Course Tree

| Module | Core question | Course |
|-|-|-|
| C1｜Bellman and Actor-Critic | How do long-term outcomes update a policy? | [TD, Policy Gradients, Advantage, and Continuous Control](/en/route-c/02-c1-从-bellman-到-actor-critic-策略怎样根据长期结果更新) |
| C2｜Offline RL | How can fixed datasets outperform behavior cloning? | [Out-of-Distribution Overestimation, CQL, IQL, and AWR](/en/route-c/03-c2-offline-rl-固定机器人数据怎样学习超越行为克隆的策略) |
| C3｜Preferences and Human Corrections | How can human feedback become reward and recovery supervision? | [Reward Models, DAgger, Intervention, and Active Feedback](/en/route-c/04-c3-偏好-奖励模型与人工纠正-机器人如何利用人类反馈) |
| C4｜Paper Lab | How do online, offline, corrective, and VLA experience-learning methods compare? | [SAC, CQL, IQL, DAgger, and RECAP](/en/route-c/05-c4-价值与经验学习论文实验室-sac-cql-iql-dagger-与-recap) |

**Cross-route relationships:** π0.6\* / RECAP is primarily placed in the VLA paper labs, but it is also a core case study for this route. World models can provide imagined rollouts for this route.

# Route D｜Hierarchical Planning, Skills, Reasoning, and Memory

**Route question:** How can long-horizon tasks be decomposed into subgoals? How do high-level language or visual plans invoke low-level continuous policies? How can a model remember demonstrations and adapt at test time?

## D0｜Core Route Course: Hierarchical Planning, Skills, and Memory

[D0｜Hierarchical Planning, Skills, and Memory: How Physical AI Completes Long-Horizon Tasks](/en/route-d/01-d0-分层规划-技能与记忆-physical-ai-如何完成长时任务)

**Specialized lab:** [Physical Causality and Embodied Chain-of-Thought](/en/route-d/02-01b-物理因果与具身思维链-机器人如何从模仿走向闭环推理)

## D1-D4｜Hierarchical Intelligence Course Tree

| Module | Core question | Course |
|-|-|-|
| D1｜Options and Hierarchical RL | How can skills be learned that are initiable, terminable, and reusable? | [Options, Semi-MDPs, Skill Discovery, and Composition](/en/route-d/03-d1-options-技能与层级强化学习-长时任务怎样拆成可执行单元) |
| D2｜Subgoals and Embodied Reasoning | How can language plans be converted into reachable and verifiable closed-loop subgoals? | [Task Graphs, World Models, Visual Subgoals, and Recovery](/en/route-d/04-d2-子目标规划与具身推理-语言计划怎样落到物理闭环) |
| D3｜Memory and Test-Time Adaptation | How can new experience from the current environment be incorporated into the policy? | [Context, External Memory, Fast Weights, and WAM-TTT](/en/route-d/05-d3-记忆与测试时适应-机器人如何利用当前环境的新经验) |
| D4｜Paper Lab | How do traditional hierarchical RL and modern hierarchical VLA systems compare? | [Options, Embodied Chain-of-Thought, π0.7, and WAM-TTT](/en/route-d/06-d4-分层智能论文实验室-options-具身思维链-π0-7-与-wam-ttt) |

# Route E｜Perception, State, Data, and Cross-Embodiment Learning

**Route question:** How does a robot construct a spatial state from incomplete observations? What can human videos without action labels provide? How can different robots, cameras, coordinate systems, and action spaces be incorporated into joint training?

## E0｜Core Route Course: Data, Representations, and Cross-Embodiment Learning

[E0｜Data, Representations, and Cross-Embodiment Learning: What Does a Robot Learn Without Action Labels?](/en/route-e/01-e0-数据-表征与跨本体学习-机器人没有动作标签时学什么)

**Specialized lab:** [Human Videos Have No Velocity Labels](/en/route-e/02-01c-人类视频没有速度标签-机器人如何学习运动)

## E1-E6｜Perception, Data, and Cross-Embodiment Course Tree

| Module | Core question | Course |
|-|-|-|
| E1｜Video Motion and Object-Centric Representations | How can motion and interaction be extracted without action labels? | [Optical Flow, Keypoints, Hand-Object Representations, and Events](/en/route-e/03-e1-视频运动与对象中心表征-没有动作标签时如何读取行为) |
| E1.5｜Spatial State Estimation and 3D Geometry | How does a robot infer itself, objects, and uncertainty from observation histories? | [Bayes Filters, SE(3), Depth, Object States, and Affordances](/en/route-e/04-e1-5-空间状态估计与三维几何-机器人怎样知道自己和物体在哪里) |
| E3｜Latent Actions and Inverse Dynamics | How can behavioral variables be discovered from state changes? | [Inverse Models, Latent Actions, Non-Identifiability, and Adaptation](/en/route-e/05-e2-latent-action-与逆动力学-从状态变化发现行为变量) |
| E4｜Behavior Tokenizer | How can behavior be converted into composable semantic units? | [VQ, Event Boundaries, Hierarchical Tokens, and FAST](/en/route-e/06-e3-behavior-tokenizer-如何把连续行为变成可组合的语义单元) |
| E5｜Cross-Embodiment Alignment and Co-Training | How can different robots share data without conflating their actions? | [Adapters, Object-Centric Actions, Data Mixing, and Transfer](/en/route-e/07-e4-跨本体对齐与异构共训练-不同机器人怎样共享数据) |
| E6｜Paper Lab | How do the primary mechanisms for incorporating human data into robot training compare? | [R3M, MimicPlay, ATM, HumanPlus, and WAM-TTT](/en/route-e/08-e5-人类数据与跨本体论文实验室-r3m-mimicplay-atm-humanplus-与-wam-ttt) |

**Cross-route relationships:** Provides action and semantic supervision to Route A, temporal representations to Route B, and demonstration and memory inputs to Route D. π0.5 is a case study in heterogeneous co-training, while WAM-TTT is a case study in adaptation from human demonstrations.

# Route F｜Dynamics, Control, and Physical Interaction

**Route question:** How can the actions output by a learned model be applied stably and safely to real systems with mass, friction, contact, compliance, and latency?

## F0｜Core Route Course: Dynamics, Control, and Physical Interaction

[Dynamics, Control, and Physical Interaction: From Robot Equations to Impedance Control](/en/route-f/01-f0-动力学-控制与物理交互-学习策略如何变成真实机器人运动)

## F1-F5｜Dynamics, Contact, and Whole-Body Control Course Tree

| Module | Core question | Course |
|-|-|-|
| F1｜Feedback Control and Stability | How can policy outputs be tracked stably under sampling, saturation, and latency? | [State Space, PD, Lyapunov Stability, Trajectory Tracking, and Policy Interfaces](/en/route-f/02-f1-反馈控制与稳定性-从-pd-状态空间到学习策略接口) |
| F2｜Contact, Impedance, and Tactile Sensing | How can robots make appropriate contact under friction, collisions, and compliant environments? | [Contact Constraints, Friction Cones, Force Control, Impedance, and Tactile Closed Loops](/en/route-f/03-f2-接触-阻抗-力控与触觉-机器人如何学会-碰得对) |
| F3｜System Identification and Sim-to-Real | How can real dynamics be estimated, latency handled, and the simulation gap bridged? | [Least Squares, Identifiability, Randomization, Online Adaptation, and Latency](/en/route-f/04-f3-系统辨识-延迟与-sim-to-real-模型怎样跨过真实世界差异) |
| F4｜Humanoids, Mobility, and Whole-Body Control | How can dynamic balance, foot placement, contact switching, and whole-body coordination be handled? | [Floating-Base Dynamics, Center-of-Mass Control, Locomotion RL, and High-/Low-Level Interfaces](/en/route-f/05-f4-人形-移动与全身控制-physical-ai-怎样驾驭有动态平衡的身体) |
| F5｜Paper and Engineering Lab | How can classical control, MPC, Residual RL, and robust learning be compared fairly? | [From Classical Control to Residual RL and Sim-to-Real](/en/route-f/06-f5-控制与学习工程论文实验室-从经典控制到-residual-rl-与-sim-to-real) |

**Cross-route relationships:** Routes A, B, and D must ultimately pass real-world execution tests through this route. Failure and sensor data generated by this route flow back to Routes G and E.

# Route G｜Systems, Trustworthy Evaluation, and Data Engines

**Route question:** How can algorithms be turned into reproducible, deployable, and auditable real-robot systems, with continuous iteration driven by failure data?

## G0｜Core Route Course: Systems, Trustworthy Evaluation, and Data Engines

[G0｜Systems, Trustworthy Evaluation, and Data Engines: How to Prove That Physical AI Actually Works](/en/route-g/01-g0-系统-可信评测与数据引擎-如何证明-physical-ai-真的有效)

**Engineering lab:** [OpenPI in Practice and ArcheBase Data Production](/en/route-g/02-a3-6-openpi-实践-从数据契约到机器人闭环)

## G1-G4｜Systems and Trustworthy Engineering Course Tree

| Module | Core question | Course |
|-|-|-|
| G1｜Statistical Evaluation and Uncertainty | How can an improvement be shown to be real, and how can the uncertainty of the evidence be quantified? | [Wilson Intervals, Stratified Estimation, Calibration, and Risk Coverage](/en/route-g/03-g1-统计评测与不确定性-如何证明-physical-ai-真的变好了) |
| G2｜Data Engines and Reproducibility | How can every fact about data, training, and models remain traceable? | [Schemas, Time Synchronization, Versioning, Lineage, and Quality Gates](/en/route-g/04-g2-数据引擎-复现与版本-physical-ai-的训练事实如何不丢失) |
| G3｜Deployment Safety and Regression Testing | After deployment, how can a model be monitored, degraded gracefully, overridden, rolled back, and continuously kept within safe boundaries? | [Safety Envelopes, Runtime Monitoring, Canary Deployments, and Incident Regression Testing](/en/route-g/05-g3-部署安全-监控与回归-模型上线后怎样保持可控) |
| G4｜OpenPI Systems Lab | How can VLA data and checkpoints be turned into a rollback-capable robot deployment? | [From Data Contracts, Training, and Inference Services to Failure Feedback Loops](/en/route-g/06-g4-openpi-与机器人系统工程实验室-从数据到可回滚部署) |

**Additional engineering case study:** [OpenPI in Practice and ArcheBase Data Production](/en/route-g/02-a3-6-openpi-实践-从数据契约到机器人闭环)

# Accelerated Learning Paths

| Goal | Path | Completion criteria |
|-|-|-|
| Build a comprehensive understanding in five days | 00 → A0 → B0/C0 → D0/E0 → F0/G0 | Can compare all routes in terms of learning objects, supervision signals, inference methods, and closed-loop risks |
| VLA algorithms | 00 → A0 → π series labs → C0 → F0/G0 | Can explain VLA training, action generation, experience-based improvement, and real-world execution |
| World models | 00 → B0 → C0 → D0 → F0/G0 | Can implement latent dynamics and MPC and validate gains in real-world control |
| Human data | 00 → E0 → E specialized labs → A0 → D0 → G0 | Can design cross-embodiment representations, latent actions, and task holdout experiments |
| Real-world robot deployment | 00 → F0 → G0, while also selecting either A0 or B0 | Can localize failures across the policy, control, data, and evaluation layers |
