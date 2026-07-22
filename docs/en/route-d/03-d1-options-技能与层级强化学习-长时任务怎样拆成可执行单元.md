---
title: "D1｜Options, Skills, and Hierarchical Reinforcement Learning: Decomposing Long-Horizon Tasks into Executable Units"
sourceToken: KtQ7d4Qe9okeCqxYDTEcCCfWnkg
sourceRevision: 13
license: Apache-2.0
translationSource: "route-d/03-d1-options-技能与层级强化学习-长时任务怎样拆成可执行单元.md"
translationSourceHash: 0fd1de559d8560f4f78c9c80326107d4c06ada9aea59f9232bd2ffe018a9802f
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/KtQ7d4Qe9okeCqxYDTEcCCfWnkg) · Source Revision 13

::: tip 💡
**Mechanisms lesson:** Starting from Semi-MDPs and the Options formalism, this lesson explains skill initiation, execution, termination, and high-level selection, and discusses skill discovery, temporal abstraction, and cross-task reuse.
:::

# Learning Objectives

After completing this lesson, you should be able to define an Option; write the skill-level Bellman equation; distinguish among fixed skills, learned skills, and latent skills; explain termination learning; and design experiments for skill discovery and compositional generalization.

# 1. Temporal Abstraction

A standard policy selects an action at every step:

$$a_t\sim\pi(\cdot\mid s_t)$$

> **Reading:** The low-level action a_t is sampled from the policy distribution conditioned on the current state s_t.

**Derivation:** A flat policy makes a new decision at every environment time step, so a task of length T requires T consecutive action selections; both long-horizon credit assignment and search depth grow with T.

A hierarchical policy selects skills that persist for multiple steps:

$$\omega_k\sim\mu(\cdot\mid s_{t_k},g)$$

> **Reading:** At the k-th skill decision point, the high-level policy mu selects an Option based on the state s\_{t_k} and task goal g.

**Derivation:** The high-level policy makes decisions only at skill initiation or termination boundaries t_k. If each skill lasts an average of tau steps, the number of high-level decisions ideally decreases from approximately T to T divided by tau, although low-level execution errors and termination errors still affect the final task outcome.

Within a skill, low-level actions are executed until $t_{k+1}$. The high-level policy makes decisions only at skill boundaries, reducing the search depth for long-horizon tasks.

# 2. Definition of an Option

$$\omega=(\mathcal I_\omega,\pi_\omega,\beta_\omega)$$

> **Reading:** An Option consists of an initiation set, an intra-option policy, and a state-dependent termination probability.

**Derivation:** A skill that persists for multiple steps must answer three questions: in which states it may begin, how it generates low-level actions during execution, and in which states it should stop. Without any one of these components, it cannot form a composable Semi-MDP action.

| Component | Meaning | Robotics Example |
|-|-|-|
| Initiation set $\mathcal I$ | States in which the skill may begin | Grasping can begin only when the gripper is near the cup |
| Intra-option policy $\pi_\omega$ | Action policy within the skill | Approach, close, and lift |
| Termination $\beta_\omega(s)$ | Probability of stopping in state s | The object is securely grasped or failure is confirmed |

# 3. Semi-MDP Value

A skill lasts $\tau$ steps and accumulates the following reward:

$$R_t^\omega=\sum_{i=0}^{\tau-1}\gamma^i r_{t+i}$$

> **Reading:** When an Option begins at time t and lasts for tau steps, its intra-option return is the discounted sum of the tau low-level rewards.

**Derivation:** Restricting the standard stepwise return to the time interval covered by the Option yields the skill-level immediate return. The i-th low-level reward occurs i steps after the skill begins and is therefore multiplied by gamma to the power of i.

Skill value:

$$Q^\mu(s,\omega)=\mathbb E_\mu\!\left[R_t^\omega+\gamma^\tau V^\mu(s_{t+\tau})\mid s_t=s,\omega_t=\omega\right]$$

> **Reading:** The value of executing Option omega in state s equals the discounted intra-option return plus the conditional expectation of the terminal-state value, discounted according to the actual duration of the skill.

**Derivation:** The standard Bellman decomposition spans one low-level time step, whereas the Semi-MDP decomposition spans a random duration of tau steps. The terminal-state value must therefore be multiplied by gamma to the power of tau, with the expectation taken over stochastic intra-option actions, environment transitions, and duration.

The discount exponent depends on the actual duration. Ignoring duration can create a bias toward very slow or very fast skills.

![Course Whiteboard](/media/T6xvwFauThFKc8bW0ibc7FpZndf.jpg)

# 4. Option-Critic

Option-Critic jointly learns the high-level Option policy, intra-option policies, and termination functions. The termination gradient is influenced by the value difference between continuing the current skill and switching skills.

Intuitively, if the value of the current skill is lower than the value of selecting a new one, the termination probability should increase. Incorrect value estimates can cause frequent switching or overly persistent skills.

$$\nabla_\vartheta J=-\mathbb E\!\left[\nabla_\vartheta\beta_\omega(s;\vartheta)\,A_\Omega(s,\omega)\right]$$

> **Reading:** The objective gradient with respect to the termination parameter vartheta is the negative expectation of the product of the termination-probability gradient and the advantage of the current Option.

**Derivation:** Define $A_\Omega(s,\omega)=Q_\Omega(s,\omega)-V_\Omega(s)$. If the current Option has a higher value than the average value of selecting a new one, the advantage is positive, and gradient ascent decreases the termination probability. If the advantage is negative, increasing the termination probability is more beneficial. In practice, a termination cost is also commonly added to prevent frequent skill switching under noisy value estimates.

# 5. Sources of Skills

| Source | Advantage | Risk |
|-|-|-|
| Manually defined task stages | Clear semantics | Poor scalability |
| Trajectory segmentation | Leverages demonstrations | Temporal similarity does not imply functional equivalence |
| Contact events | Strong physical meaning | Requires reliable sensing |
| Mutual-information objectives | Automatically discovers diverse skills | Skills may be unrelated to the task |
| Latent-variable VAE | Continuous skill space | Collapse and difficulty of interpretation |
| Language labels | Composable and interpretable | Semantic and execution boundaries may not align |

# 6. Unsupervised Skill Discovery

One objective maximizes the mutual information between skill $z$ and the reached state:

$$I(z;S_T)=H(z)-H(z\mid S_T)$$

> **Reading:** The mutual information between the skill variable z and terminal state S_T equals the entropy of the skill itself minus the remaining uncertainty about the skill after observing the terminal state.

**Derivation:** If different skills reach distinguishable terminal states, z can be inferred from S_T, reducing the conditional entropy and increasing the mutual information. This objective encourages behavioral diversity but does not guarantee that the skills are relevant to downstream tasks, object interaction, or safety constraints.

If a skill can be identified from the final state, the skills produce distinguishable behaviors. However, “distinguishable” does not guarantee task utility: the robot may learn to swing its joints rather than manipulate objects.

# 7. Goal-Conditioned Skills

Skills can be conditioned on subgoals:

$$a_t\sim\pi(\cdot\mid s_t,g_k)$$

> **Reading:** The low-level action is sampled from a policy distribution conditioned jointly on the current state and the k-th subgoal.

**Derivation:** Replacing skill identity with goal conditioning allows the same low-level policy to serve multiple high-level tasks. The high-level policy proposes an achievable, observable, and verifiable g_k, while the low-level policy advances the state toward that goal.

The high-level policy outputs a target state or visual goal, and the low-level policy reaches it through goal-conditioned RL or imitation learning. A general-purpose low-level policy can be reused across multiple high-level tasks.

# 8. Skill Interfaces

Skills must share clearly defined interfaces:

- Input states and coordinate frames.
- Success and failure conditions.
- Action, velocity, and control modes.
- Object ownership and gripper state.
- Recoverable states.

If the grasping skill terminates without reporting whether the object is securely grasped, the transport skill may begin under a false assumption.

# 9. Compositional Generalization of Skills

Having observed A→B and C→D during training does not imply that the system can execute A→D. Compositional generalization requires:

- Compatible pre-skill and post-skill states.
- High-level awareness of preconditions.
- Stable termination detection.
- Low-level policies that do not depend on a specific preceding skill.

# 10. Minimal Experiment

In the same resettable environment, construct four skills—navigation, grasping, transport, and placement—and hold out at least one skill sequence not seen during training. Fix the low-level control frequency, number of training environment steps, network parameter count, and online planning budget, and compare a flat policy, manually defined Options, Option-Critic, a goal-conditioned low-level policy, and unsupervised latent skills.

**Minimum reporting requirements:** Full-task success rate, average stage reached, high-level selection error rate, intra-skill failure rate, termination false-positive and false-negative rates, switching latency, unseen-composition success rate, local recovery rate after perturbations, and sample efficiency under the same number of real-world environment steps.

1. Construct a three-skill navigation–grasping–placement task.
2. Compare a flat policy with an Option policy.
3. Vary skill-termination noise.
4. Hold out one skill composition.
5. Compare manually defined skills with latent skills.
6. Report high-level errors, skill errors, and interface errors.

# 11. Exercises

1. Define the initiation set, intra-option policy, and termination function for grasping.
2. Derive the skill-level Bellman target.
3. Explain why a fixed time window is not a reliable skill.
4. Design a counterexample in which an unsupervised skill is unrelated to the task.
5. Define an interface contract for skill composition.
6. Compare language skill tokens with continuous latent skills.

# 12. Major Failure Modes

| Failure | Symptom | Diagnosis and Correction |
|-|-|-|
| Option collapse | The high-level policy almost always selects the same skill, and the other skills are never used | Report Option usage entropy, state coverage, and selection distributions by task stage |
| Termination chattering | A skill stops immediately after it begins, causing high-frequency switching among multiple Options | Check value noise, termination cost, minimum duration, and switching latency |
| Skill persistence | A skill does not terminate even after clearly failing and continues until timeout | Add failure events, timeout termination, and termination supervision under negative advantage |
| Distorted initiation set | A skill is invoked in a state where it cannot execute, making subsequent actions meaningless | Evaluate availability classification, reachability, and conditional success rate after initiation separately |
| Incompatible interfaces | Each skill succeeds independently, but the sequence fails at skill boundaries | Check coordinate frames, object-holding state, velocity, contact, and completion predicates |
| Duration bias | The high-level policy favors excessively slow or fast skills, distorting return comparisons | Verify Semi-MDP discounting, skill duration, and return per unit time |
| Unsupervised skills have no task value | Skills are diverse but merely swing, rotate, or alter irrelevant states | Evaluate object interaction, downstream reachability, and few-shot task reuse rather than mutual information alone |
| Joint high-/low-level drift | Subgoal semantics change continuously during training, and the low-level policy cannot keep pace with the high-level policy | Use staged training, goal relabeling, off-policy correction, or ablations that freeze one level |

# 13. Paper Facts, Author Interpretations, and Course Assessments

| Work | Paper Fact | Author Interpretation | Course Assessment |
|-|-|-|-|
| Options | Formalizes temporally extended actions using initiation sets, intra-option policies, and termination functions, and establishes a Semi-MDP learning framework | Temporal abstraction can shorten decision chains and support knowledge reuse | It provides an interface rather than automatically solving skill discovery; real systems also require completion detection, switching stability, and control contracts |
| Option-Critic | Learns intra-option policies and termination functions within a unified architecture and derives the corresponding gradients | Useful temporal abstractions can be discovered without manually specifying termination conditions | End-to-end learnability does not guarantee interpretability, composability, or freedom from collapse; Option usage and boundary quality must be reported |
| DIAYN | Learns diverse unsupervised skills through mutual information between skills and states together with a maximum-entropy policy | Reward-free exploration can pretrain a reusable behavior library | State distinguishability is only a proxy objective; manipulation tasks also require validation of object states, contact events, and downstream task value |
| HIRO | The high-level policy generates state-space subgoals for the low-level policy to execute and uses off-policy correction to mitigate simultaneous changes in the hierarchical policies | Goal-conditioned hierarchies can improve sample efficiency in long-horizon continuous control | State-vector subgoals are well defined in simulation, but visual robotics must address observability, semantic grounding, and verifiability |

<bookmark name="Between MDPs and Semi-MDPs: A Framework for Temporal Abstraction" href="https://www.sciencedirect.com/science/article/pii/S0004370299000521"></bookmark>

<bookmark name="The Option-Critic Architecture" href="https://arxiv.org/abs/1609.05140"></bookmark>

<bookmark name="Diversity Is All You Need: Learning Skills without a Reward Function" href="https://arxiv.org/abs/1802.06070"></bookmark>

<bookmark name="Data-Efficient Hierarchical Reinforcement Learning" href="https://arxiv.org/abs/1805.08296"></bookmark>

# 14. Cross-Reading

[D0｜Hierarchical Planning, Skills, and Memory](/en/route-d/01-d0-分层规划-技能与记忆-physical-ai-如何完成长时任务)

[D2｜Subgoal Planning and Embodied Reasoning](/en/route-d/04-d2-子目标规划与具身推理-语言计划怎样落到物理闭环)

[C1｜From Bellman to Actor-Critic](/en/route-c/02-c1-从-bellman-到-actor-critic-策略怎样根据长期结果更新)

[E3｜Behavior Tokenizer](/en/route-e/06-e3-behavior-tokenizer-如何把连续行为变成可组合的语义单元)

[F0｜Dynamics, Control, and Physical Interaction](/en/route-f/01-f0-动力学-控制与物理交互-学习策略如何变成真实机器人运动)
