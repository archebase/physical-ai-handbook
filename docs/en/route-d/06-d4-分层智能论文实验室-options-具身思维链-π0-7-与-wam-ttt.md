---
title: "D4｜Hierarchical Intelligence Paper Lab: Options, Embodied Chain-of-Thought, π0.7, and WAM-TTT"
sourceToken: YWGIdQ0k0o1QYpx5HKccQ0qmn7y
sourceRevision: 9
license: Apache-2.0
translationSource: "route-d/06-d4-分层智能论文实验室-options-具身思维链-π0-7-与-wam-ttt.md"
translationSourceHash: d191750bbd5c43410e8daf8a8d0b8dedf5ec8363674611690f5a88990e753e72
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/YWGIdQ0k0o1QYpx5HKccQ0qmn7y) · Source Revision 9

::: tip 🔬
**Paper Lab:** Use temporal abstraction, subgoal representations, memory updates, and closed-loop recovery as a unified framework for comparing traditional hierarchical RL with emerging hierarchical VLA systems.
:::

# Unified Comparison Framework

| Dimension | Question |
|-|-|
| High-level variable | Option, language, image, skill token, or latent |
| Low-level policy | RL, imitation, VLA, or controller |
| Termination | Fixed duration, learned termination, or completion detection |
| Future prediction | Model-free, value-based, or world model |
| Memory | Context, external memory, parameters, or fast weights |
| Evidence | Long-horizon success, compositional generalization, recovery, and real-robot performance |

# 1. Options and Option-Critic

Options provide rigorous definitions of initiation, intra-option policies, and termination. Option-Critic learns these components end to end and represents the approach of “learning temporal abstractions through RL.”

Its advantage is a clear mathematical definition; the challenge is that automatically discovered skills may be uninterpretable, irrelevant to the task, or switch too frequently.

# 2. Feudal / Goal-Conditioned Hierarchy

The high level outputs a subgoal in the state space or latent space, and the low-level policy is responsible for reaching it. Key questions are whether the subgoal is achievable, whether it can be reused across tasks, and how to select the high-level timescale.

# 3. Language Planning and Embodied Chain-of-Thought

A VLM generates language sub-tasks or reasoning chains, which a low-level robot policy then executes. Compared with traditional Options, the high-level variables are semantic and interpretable, but they lack explicit initiation and termination conditions as well as guarantees of physical reachability.

Decisive experiments must examine closed-loop feedback rather than merely whether the textual plan appears plausible.

# 4. Hierarchical Reasoning in π0.5

π0.5 connects high-level semantics, heterogeneous co-training, and low-level actions. It demonstrates the combination of language sub-tasks with a VLA, but this does not by itself prove that the model possesses explicit long-horizon planning or a causal world model.

# 5. Prompts and Visual Subgoals in π0.7

π0.7 uses diverse prompts and generated visual subgoals to improve policy controllability. It connects:

- VLA: low-level action generation.
- World model: future visual generation.
- Hierarchical planning: high-level prompts and subgoals.
- Data strategy: mixed-quality data with metadata.

It is necessary to verify whether the visual goals are reachable, whether the low-level policy actually uses them, and whether they are regenerated after failures.

# 6. WAM-TTT

WAM-TTT uses test-time training to write human videos into fast-weight memory. Its key innovation is that the inner loop uses only human-side signals, while the outer loop uses supervision from robot action tasks to update the learning rule.

Key assumptions include human–robot task correspondence, temporal/event alignment, and memory safety.

# 7. Method Comparison

| Method | High-level variable | Termination | Memory | Primary risk |
|-|-|-|-|-|
| Options | Discrete skills | Explicit β | Usually none | Skill discovery |
| Goal-conditioned | State/latent goal | Goal-reach detection | Optional | Unreachable subgoals |
| Language planning | Language | Completion detection | Context | Physical grounding |
| π0.7 | Diverse prompts/visual goals | Closed-loop policy | Context | Goal hallucination |
| WAM-TTT | Human demonstrations written into memory | Task policy | Fast weights | Memory contamination |

# 8. Unified Experimental Protocol

1. Use the same long-horizon task and low-level policy.
2. Compare a flat baseline, a fixed task graph, learned Options, language subgoals, and visual subgoals.
3. Introduce intermediate perturbations and failure recovery.
4. Hold out skill combinations and task orderings.
5. Provide memory with correct, irrelevant, and incorrect demonstrations.
6. Report stage-level success, switching errors, recovery rate, and full-task success.

# 9. Lab Assignment

# Lab Deep Dive｜Unified Formulation, Visualization, and Reproduction

Place Options, embodied chain-of-thought, π0.7, and WAM-TTT within the same hierarchical decision-making framework. The high-level variable $z_k$ can be an option, a language step, a visual subgoal, or a memory-retrieval result; the low-level policy executes:

$$a_t\sim\pi_{\mathrm{low}}(\cdot\mid o_t,z_k)$$

> **Interpretation:** While the high-level condition z_k remains active, low-level actions are sampled from a policy distribution conditioned on the current observation and that high-level condition.

**Derivation:** Whether z_k is an Option, a language step, a visual subgoal, or retrieved memory, the low-level interface can be unified as a conditional policy. When comparing different approaches, pi_low must be held fixed so that performance differences can be attributed primarily to the high-level representation, selection, and termination mechanisms.

The high level is updated on a slower timescale:

$$z_k\sim\pi_{\mathrm{high}}(\cdot\mid h_{t_k},g,m_{t_k})$$

> **Interpretation:** At the k-th high-level decision boundary, the high-level policy selects a new high-level condition z_k based on the history, overall task goal, and current memory.

**Derivation:** The high level is updated only at boundaries t_k rather than at every motor-control cycle. Conditioning on task history h, goal g, and memory m provides a unified representation of task-graph selection, language-based replanning, visual-goal generation, and test-time memory retrieval.

In words: “The high level selects the next executable condition based on history, goals, and memory, and the low level converts it into continuous actions.” When comparing papers, ask whether the subgoal is reachable, when it terminates, whether failure can be detected, and whether memory actually changes behavior at inference time.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRECiAgICBHW0xvbmctaG9yaXpvbiB0YXNrIGdvYWxdIC0tPiBIW0hpZ2ggbGV2ZWw6IG9wdGlvbi9sYW5ndWFnZS92aXN1YWwgc3ViZ29hbF0KICAgIE1bRGVtb25zdHJhdGlvbnMgYW5kIGV4dGVybmFsIG1lbW9yeV0gLS0+IEgKICAgIEggLS0+IExbTG93LWxldmVsIGNvbnRpbnVvdXMgcG9saWN5XQogICAgTCAtLT4gV1tSZWFsIGVudmlyb25tZW50XQogICAgVyAtLT4gVltQcm9ncmVzcyBhbmQgZmFpbHVyZSB2ZXJpZmljYXRpb25dCiAgICBWIC0tPiBICiAgICBWIC0tPiBM" />

## Minimal Experiment: Unified Reproduction Protocol

Choose a task with at least five stages that permits objects to be moved mid-execution or grasp failures to be induced. Hold the low-level policy, training data, visual encoder, control frequency, model-call limit, and number of real-robot interaction steps fixed. Replace only the high-level mechanism with one of five alternatives: a fixed task graph, learned Options, language subgoals, visual subgoals, or test-time memory.

**Minimum reporting requirements:** Full-task success rate, mean number of completed stages, invalid-subgoal rate, termination false-positive and false-negative rates, switching latency, local recovery rate, success rate on unseen skill combinations, number of planning calls, adaptation compute, and the proportion of identical failures attributed to the high level, low level, interface, or completion detector.

1. Choose a task that requires more than five stages and permits intermediate perturbations.
2. Compare a flat policy, a fixed task graph, learned Options, language plans, and visual subgoals.
3. Hold the low-level policy constant and replace only the high-level representation and termination mechanism.
4. Report stage completion rate, error recovery, repeated loops, planning calls, and final success rate.

## Lab Exercises

1. Specify an option’s initiation set, intra-option policy, and termination function.
2. Explain why a language plan that “looks correct” does not imply that its subgoals are executable.
3. Design an intervention proving that WAM-TTT uses the current demonstration rather than the task name.
4. Compare the boundary between π0.7 visual subgoals and explicit world-model planning.
5. Draw module boundaries for the five methods.
6. Add initiation and completion conditions for π0.7.
7. Express WAM-TTT as inner-loop/outer-loop pseudocode.
8. Design an ablation that tests whether textual CoT improves real closed-loop performance.
9. Compare visual subgoals with state-space subgoals.
10. State what each paper actually proves and does not prove.

# Primary Failure Modes

| Failure | Symptom | Unified diagnosis |
|-|-|-|
| Unfair comparison | One approach uses a stronger low-level policy, longer context, or more model calls | Hold the low-level policy, data, interaction steps, latency, and inference budget fixed |
| Unreachable high-level variables | Language or visual subgoals are plausible but cannot be achieved by the low level | Test preconditions, reachability, and conditional success rates |
| Missing termination mechanism | The system fails to switch after completing a subgoal or advances before completion | Report termination precision, recall, and switching-time error under a unified protocol |
| Low level masks the high level | A strong low-level policy completes the task directly, obscuring whether the high-level variable is used | Apply high-level-condition permutation, masking, and counterfactual interventions |
| Textual or visual explanation bypass | The intermediate representation changes, but the actions do not | Intervene on z_k under the same observation and measure changes in actions and outcomes |
| Memory contamination | Incorrect demonstrations cause persistent degradation during test-time adaptation | Use incorrect and irrelevant demonstrations, gating, version snapshots, and rollback |
| Reporting only average success rate | It is impossible to determine whether failures arise from planning, execution, the interface, or verification | Decompose the evidence chain by stage and module, and report confidence intervals |

# Paper Facts, Authors’ Interpretations, and Course Assessment

| Approach | Paper fact | Authors’ interpretation | Course assessment |
|-|-|-|-|
| Options / Option-Critic | Formalizes actions spanning multiple steps and can learn intra-option policies and termination | Temporal abstraction can shorten decision chains and discover skills | Provides the clearest mathematical interface, but automatically discovered skills may still collapse, remain uninterpretable, or be difficult to compose across tasks |
| Embodied language planning | SayCan, Inner Monologue, and related methods use language priors, executability, and environmental feedback for skill-level planning | Linguistic knowledge and closed-loop feedback can support long-horizon tasks | Text-generation ability, skill-library coverage, and gains in real physical closed-loop performance must be distinguished |
| π0.7 | A general-purpose VLA uses diverse conditioning forms, including visual subgoals, to improve controllability | Richer high-level conditions can improve open-world task execution | It remains primarily a VLA; this lab audits only subgoal reachability, utilization, completion detection, and recovery |
| WAM-TTT | Human-side context is written into fast memory at test time, while robot-task supervision trains the update mechanism | Human demonstrations at test time can help robots adapt | Requires strict holdouts, stage alignment, incorrect-demonstration controls, and evidence of rollback capability |

<bookmark name="Between MDPs and Semi-MDPs: A Framework for Temporal Abstraction" href="https://www.sciencedirect.com/science/article/pii/S0004370299000521"></bookmark>

<bookmark name="The Option-Critic Architecture" href="https://arxiv.org/abs/1609.05140"></bookmark>

<bookmark name="Do As I Can, Not As I Say: Grounding Language in Robotic Affordances" href="https://arxiv.org/abs/2204.01691"></bookmark>

<bookmark name="Inner Monologue: Embodied Reasoning through Planning with Language Models" href="https://arxiv.org/abs/2207.05608"></bookmark>

# Course Cross-Reading

[D0｜Hierarchical Planning, Skills, and Memory](/en/route-d/01-d0-分层规划-技能与记忆-physical-ai-如何完成长时任务)

[D1｜Options, Skills, and Hierarchical Reinforcement Learning](/en/route-d/03-d1-options-技能与层级强化学习-长时任务怎样拆成可执行单元)

[D2｜Subgoal Planning and Embodied Reasoning](/en/route-d/04-d2-子目标规划与具身推理-语言计划怎样落到物理闭环)

[D3｜Memory and Test-Time Adaptation](/en/route-d/05-d3-记忆与测试时适应-机器人如何利用当前环境的新经验)

[π0.7: Visual Subgoals and Automated Prompting](/en/route-a/07-a3-5-π0-7-从通用策略到可操控的机器人基础模型)
