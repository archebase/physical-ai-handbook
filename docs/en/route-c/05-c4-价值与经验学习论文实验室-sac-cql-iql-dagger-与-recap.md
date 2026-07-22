---
title: "C4｜Value and Experience Learning Paper Lab: SAC, CQL, IQL, DAgger, and RECAP"
sourceToken: S5SbdMthCouZYHx9L6zcV4Wqn7f
sourceRevision: 11
license: Apache-2.0
translationSource: "route-c/05-c4-价值与经验学习论文实验室-sac-cql-iql-dagger-与-recap.md"
translationSourceHash: 9b6cde6b222133f691836d7c5fca60daa394a2a3ddb6cdcf4863f1d16f86d2d1
---

> [Original Feishu document](https://archebase.feishu.cn/docx/S5SbdMthCouZYHx9L6zcV4Wqn7f) · Source revision 11

::: tip 🔬
**Paper Lab:** Compare online Actor-Critic, offline value learning, corrective imitation, and experience-based improvement for large VLA models within a unified framework. The focus is not on algorithm acronyms, but on where the data comes from, where value is estimated, and how the policy is constrained.
:::

# Unified Comparison Framework

| Dimension | Question |
|-|-|
| Interaction | Can new actions be sampled online? |
| Data | Expert demonstrations, mixed-quality data, failures, corrections, or preferences? |
| Value | Q, V, advantage, or a reward model? |
| Policy update | Q maximization, weighted imitation, conditioning, or direct preference optimization? |
| Constraint | Entropy, KL, behavior support, or conservative Q? |
| Evidence | Simulation, offline metrics, real robots, and safety? |

# 1. SAC: Maximum-Entropy Online Actor-Critic

SAC optimizes reward and policy entropy:

$$J_{\mathrm{SAC}}=\mathbb E\!\left[\sum_{t=0}^{T-1}\gamma^t\left(r_t+\alpha\mathcal H(\pi_\theta(\cdot\mid s_t))\right)\right]$$

> **Interpretation:** SAC maximizes the sum of discounted rewards over T steps and policy entropy bonuses, with alpha controlling the value assigned to stochastic actions.

**Derivation:** Adding policy entropy at each state to the standard RL return yields the maximum-entropy objective. This encourages exploration, but real robots still require action-range and safety constraints.

Its advantages include support for continuous actions, off-policy learning, and relatively high sample efficiency. On real robots, its limitations include the safety of online exploration, reset costs, and high-frequency action execution.

# 2. DAgger: Let the Expert Label States Visited by the Policy

DAgger directly addresses distribution shift in behavior cloning by allowing the current policy to visit states while the expert supplies the correct actions. It requires neither rewards nor value functions, but it does require ongoing expert involvement.

It is well suited to collecting recovery data on real robots: when the policy deviates, the expert takes over, and the states immediately before intervention and the recovery actions are recorded.

# 3. CQL: Remain Conservative on Out-of-Distribution Actions

In addition to the TD objective, CQL penalizes high Q-values for policy actions, making the Q-values of actions in the dataset relatively higher. It is suitable for mixed-quality offline data, but the degree of conservatism determines whether it can outperform the behavior policy.

# 4. IQL: Avoid Explicit Maximization over Out-of-Distribution Actions

IQL uses expectile regression to learn the state value of high-value actions in the dataset, then applies advantage-weighted regression to those actions. It prevents the Actor from querying arbitrary OOD actions and is simple and stable in practice.

# 5. AWR / AWAC: Value-Weighted Behavior Cloning

$$\mathcal L_{\mathrm{AWR}}=-\mathbb E_{(s,a)\sim\mathcal D}\!\left[\exp(A(s,a)/\beta)\log\pi_\theta(a\mid s)\right]$$

> **Interpretation:** AWR still fits actions from the offline dataset, but uses temperature-scaled exponential weights based on advantage to emphasize better actions.

**Derivation:** The nonparametric solution to KL-regularized policy improvement reweights the behavior policy by exp(A/beta). Projecting this objective onto a parameterized policy yields weighted maximum likelihood.

It remains within the support of the data while increasing the probability of high-advantage actions, making it an important bridge between imitation learning and RL.

# 6. Decision Transformer: A Return-Conditioned Sequence Model

Represent the target return, states, and actions as a sequence:

$$p_\theta(a_t\mid G_{\le t},s_{\le t},a_{<t})$$

> **Interpretation:** Decision Transformer predicts the current action from the return-to-go up to the current step, the state history, and previous actions.

**Derivation:** Once returns, states, and actions are interleaved into a causal sequence, RL data can be converted into a conditional sequence-modeling problem. Requesting returns beyond the support of the data has no corresponding supervision.

It does not explicitly perform Bellman backups, but it is constrained by the return coverage in the dataset. A high target return does not imply that the model can extrapolate a new policy.

# 7. RECAP: Experience-Based Improvement for Large VLA Models

RECAP collects real executions of the current policy, including successes, failures, and human corrections; trains value/advantage signals; and then requests better behavior through a conditional policy.

Key research questions:

- Do the gains come from additional data or from the advantage mechanism?
- Is the value function calibrated across task phases and novel states?
- How do failures and human corrections contribute separately?
- Does increased throughput come at the expense of safety and action quality?

# 8. Taxonomy of Methods

| Method | Online interaction | Policy update | Primary risk |
|-|-|-|-|
| SAC | Required | Maximum-entropy Q optimization | Exploration safety |
| DAgger | Policy execution + expert | Aggregated behavior cloning | Expert cost |
| CQL | Not required | Conservative Q + Actor | Excessive conservatism |
| IQL | Not required | Expectile + weighted BC | Limited by actions in the dataset |
| Decision Transformer | Not required | Return-conditioned sequence prediction | Extrapolation to high returns |
| RECAP | Real-world deployment loop | Advantage conditioning/reweighting | Value bias and data confounding |

# 9. Minimal Experiment: Unified Robot Comparison

Under the same task and data budget, compare:

1. Expert BC.
2. Standard SFT on expert data plus autonomous failures.
3. DAgger / human takeover corrections.
4. IQL or AWR.
5. RECAP-style advantage conditioning.
6. SAC when safe online interaction is permitted.

Report success rate, recovery rate, collisions, takeovers, data cost, training stability, and confidence intervals.

# 10. Lab Assignments

1. Create data-objective-policy-update diagrams for all six methods.
2. Design controls with equal amounts of data and equal human time.
3. Plot value-calibration curves.
4. Inspect Q-values for out-of-distribution actions.
5. Stratify advantage by task phase.
6. Separate facts, interpretations, and unproven claims in the conclusions about RECAP.

# 11. Failure Modes and Requirements for Fair Comparison

| Confounder | Incorrect conclusion | Required controls |
|-|-|-|
| Different amounts of online interaction | SAC or deployment-loop algorithms are inherently superior | Real-world steps, number of resets, safety incidents, and wall-clock time |
| Different amounts of additional data | RECAP's value mechanism accounts for all gains | Compare separately against standard SFT with equal data, additional success data, and failure data |
| Different amounts of expert time | DAgger is more data-efficient than offline methods | Human minutes required for labeling, takeover, monitoring, and recovery |
| Different model capacities | The algorithmic objective, rather than model scale, causes the improvement | Encoder, Actor, and Critic capacities, as well as pretrained initialization |
| Different task slices | Average success rate represents true generalization | Novel objects, contact phases, failure recovery, and worst-case task slices |
| Uncalibrated values | Higher Q or advantage necessarily means better behavior | Prediction bins, actual outcomes, and the proportion of OOD actions |

# 12. Paper Facts, Authors' Interpretations, and Course Assessments

| Work | Paper fact | Authors' interpretation | Course assessment |
|-|-|-|-|
| SAC | A maximum-entropy off-policy Actor-Critic that demonstrates high sample efficiency on continuous-control benchmarks | Entropy regularization improves exploration and robustness | Conclusions for real robots must account for exploration safety, resets, and control-frequency costs |
| DAgger | Aggregates expert actions for states visited by the current policy to mitigate distribution shift in imitation learning | Interactive supervision can reduce compounding error | Human time and safety gating are part of the algorithm's cost and cannot be treated as free labels |
| CQL | Reduces Q-values for actions outside the dataset through conservative regularization | Conservative value estimates can support offline policy improvement | Studies must report whether the method is excessively conservative and whether it delivers real improvements over BC |
| IQL | Uses expectile V and advantage-weighted regression to avoid explicit out-of-distribution maximization | It provides a simple and stable recipe for offline learning | Its capability ceiling remains limited by the coverage of actions in the dataset |
| Decision Transformer | Models return-to-go, states, and actions as a conditional sequence | Sequence modeling can replace explicit Bellman backups | Requests for high returns are reliable only within data support, and likelihood does not establish closed-loop optimality |
| RECAP | Uses successful, failed, and corrected experience generated by deploying a general-purpose VLA to continue improving the policy | An experience-learning loop can scale general-purpose robotic capabilities | Equal-data SFT controls and ablations of value weighting and feedback types are required to identify the true contribution |

<bookmark name="Soft Actor-Critic" href="https://arxiv.org/abs/1801.01290"></bookmark>

<bookmark name="DAgger" href="https://proceedings.mlr.press/v15/ross11a.html"></bookmark>

<bookmark name="Conservative Q-Learning" href="https://arxiv.org/abs/2006.04779"></bookmark>

<bookmark name="Implicit Q-Learning" href="https://arxiv.org/abs/2110.06169"></bookmark>

<bookmark name="Decision Transformer" href="https://arxiv.org/abs/2106.01345"></bookmark>

[π0.6\* / RECAP: How VLA Models Learn from Deployment Experience](/en/route-a/06-a3-4-π0-6-recap-机器人如何从成功-失败和纠正中改进)

# Lab Deep Dive｜Unified Formulation, Visualization, and Reproduction

Place SAC, CQL, IQL, DAgger, and RECAP within the same experience-learning pipeline: who generates the data, how value is estimated, how the policy is updated, and how the state distribution encountered during deployment changes.

A unified advantage-weighted policy update can be written as:

$$\mathcal L_\pi=-\mathbb E_{(s,a)\sim\mathcal D}\!\left[w(s,a)\log\pi_\theta(a\mid s)\right]$$

> **Interpretation:** The unified weighted policy loss performs maximum likelihood on fixed actions from the dataset, with each sample's importance determined by its weight w.

**Derivation:** Standard behavior cloning assigns the same weight to every sample. Value- or advantage-based methods change only the sample weights, allowing them to reprioritize behaviors in the dataset without directly generating OOD actions.

$$w(s,a)=\exp\!\left(A(s,a)/\beta\right)$$

> **Interpretation:** The sample weight is the exponential of the advantage divided by the temperature beta.

**Derivation:** This form follows from KL-regularized policy improvement. The smaller beta is, the greater the difference in weights between high-advantage and low-advantage samples. To remain consistent with C0 and C2, this course uniformly uses beta as the temperature rather than the inverse temperature.

This can be read as: “Continue imitating actions in the dataset, but place greater emphasis on actions estimated to be better than the baseline.” CQL focuses on suppressing the values of out-of-distribution actions, IQL avoids explicitly querying out-of-distribution maxima, DAgger changes the data distribution through expert corrections, and RECAP reconditions on deployment experience and uses it for further training.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBCW0luaXRpYWwgZXhwZXJ0IGFuZCBiZWhhdmlvciBkYXRhXSAtLT4gVltWYWx1ZSAvIHJld2FyZCAvIHByZWZlcmVuY2UgZXN0aW1hdGlvbl0KICAgIFYgLS0+IFVbUG9saWN5IHVwZGF0ZTogU0FDIC8gQ1FMIC8gSVFMIC8gd2VpZ2h0ZWQgaW1pdGF0aW9uXQogICAgVSAtLT4gRFtSZWFsLXdvcmxkIGRlcGxveW1lbnRdCiAgICBEIC0tPiBTW0F1dG9ub21vdXMgc3VjY2Vzc2VzXQogICAgRCAtLT4gRltGYWlsdXJlcyBhbmQgYm91bmRhcnkgc3RhdGVzXQogICAgRCAtLT4gSFtIdW1hbiBjb3JyZWN0aW9ucyAvIHByZWZlcmVuY2VzXQogICAgUyAtLT4gVgogICAgRiAtLT4gVgogICAgSCAtLT4gVg==" />

## Unified Reproduction Experiment

1. Construct a fixed offline dataset containing expert, suboptimal, failed, and corrected trajectories.
2. Compare behavior cloning, CQL, IQL/AWR, and an advantage-conditioned policy.
3. After fixing the offline dataset, allow each method to receive the same number of human corrections.
4. Report return, success rate, proportion of out-of-distribution actions, number of takeovers, and performance on the worst-case task slice.

## Lab Exercises

1. Explain why maximizing offline Q-values tends to favor out-of-distribution actions.
2. Compare the information provided by DAgger's supervised labels with that provided by a preference-based reward model.
3. Design an ablation to verify that RECAP's improvements come from failure experience rather than additional success data.
4. Discuss how weighted imitation amplifies bias when advantage estimates are incorrect.

- Soft Actor-Critic
- DAgger
- Conservative Q-Learning
- Implicit Q-Learning
- Advantage-Weighted Actor-Critic
- Decision Transformer
- π0.6\* / RECAP
