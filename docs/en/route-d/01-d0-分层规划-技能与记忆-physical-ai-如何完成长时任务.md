---
title: "D0｜Hierarchical Planning, Skills, and Memory: How Physical AI Completes Long-Horizon Tasks"
sourceToken: I2Qid6v5roo9PxxPq8hc1sYtnJe
sourceRevision: 17
license: Apache-2.0
translationSource: "route-d/01-d0-分层规划-技能与记忆-physical-ai-如何完成长时任务.md"
translationSourceHash: 0c578abfaa55b3621d9b7fa78fabba51c4c44d2d579097f5b33768dd13a324bf
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/I2Qid6v5roo9PxxPq8hc1sYtnJe) · Source Revision 17

::: tip 💡
**Core Course for This Track:** Direct policies excel at short-horizon actions, but long-horizon tasks require deciding what to do first, when to transition between stages, where to resume after failure, and how to leverage past experience. This lesson provides a unified explanation of subgoals, skills, Options, task graphs, world models, embodied reasoning, memory, and test-time adaptation.
:::

# Learning Objectives

After completing this lesson, you should be able to explain why long-horizon tasks require hierarchy; distinguish high-level planning, low-level policies, and controllers; understand Options and skill tokens; construct language, visual, and state subgoals; explain how world models and value functions support planning; distinguish parametric memory, contextual memory, and test-time fast weights; and design evaluations of stages, recovery, and generalization for long-horizon tasks.

# 1. Why Long-Horizon Tasks Are More Than Just More Action Steps

“Clear the table” may involve identifying objects, deciding their order, grasping, moving, placing, checking the outcome, and recovering from failures. As the horizon increases, the nature of the problem changes qualitatively:

- Early decisions alter the feasible space for subsequent actions.
- The same low-level action can have different meanings at different task stages.
- An intermediate failure does not necessarily require restarting from the beginning.
- The policy must remember which subtasks have and have not been completed.
- Low-level errors can be amplified during stage transitions.

It is therefore necessary to model “selecting the task stage” separately from “executing continuous actions.”

# 2. A Three-Layer Physical AI System

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBHW1Rhc2sgR29hbF0gLS0+IEhbSGlnaC1MZXZlbCBQbGFubmVyXQogICAgT1tPYnNlcnZhdGlvbnMgYW5kIEhpc3RvcnldIC0tPiBICiAgICBIIC0tPiBTW1N1YmdvYWwgb3IgT3B0aW9uXQogICAgUyAtLT4gUFtMb3ctTGV2ZWwgUG9saWN5XQogICAgTyAtLT4gUAogICAgUCAtLT4gQVtBY3Rpb24gQ2h1bmtdCiAgICBBIC0tPiBDW0ZlZWRiYWNrIENvbnRyb2xsZXJdCiAgICBDIC0tPiBXW1JlYWwgV29ybGRdCiAgICBXIC0tPiBPCiAgICBXIC0tPiBWW1N1Y2Nlc3MsIFZhbHVlLCBGYWlsdXJlLCBhbmQgQ29tcGxldGlvbiBEZXRlY3Rpb25dCiAgICBWIC0tPiBICiAgICBWIC0tPiBQ" />

| Layer | Time Scale | Output | Primary Question |
|-|-|-|-|
| High-level planning | Seconds to minutes | Subgoals, skills, task graphs | Which stage should be performed next? |
| Low-level policy | Tens of milliseconds to seconds | Continuous action chunks | How should the current subgoal be completed? |
| Feedback control | Milliseconds | Motor commands | How can execution remain stable? |

The value of hierarchy lies not only in reducing computation, but also in allowing different time scales to use different state representations and supervision signals.

# 3. Options: A Formalization of Skills in Reinforcement Learning

An Option can be written as:

$$\omega=(\mathcal I_\omega,\pi_\omega,\beta_\omega)$$

> **Interpretation:** An Option consists of an initiation set, an intra-skill policy, and a state-dependent termination probability.

**Derivation:** A skill that persists for multiple steps must answer “where can it begin, what should it do while active, and when should it end?” Merely storing an action segment is insufficient to form a reusable Option.

| Component | Meaning |
|-|-|
| Initiation set: states in which the skill is allowed to begin | The set of states in which the skill can be initiated |
| Intra-skill policy: the distribution over low-level actions during skill execution | The low-level policy within the skill |
| Termination function: the probability that the skill stops in the current state | The probability that the skill terminates in state s |

The high-level policy selects an Option:

$$\omega_k\sim\mu(\cdot\mid s_k,g)$$

> **Interpretation:** At the kth skill-decision point, the high-level policy selects an Option based on the current state and task goal.

**Derivation:** Replacing the low-level action space with a set of skills yields a high-level policy; k denotes irregularly spaced Option-decision points rather than every motor-control cycle.

The low-level policy continues executing until the termination condition is triggered. The core of skill learning includes not only the action segment, but also when the skill can be used and when it should stop.

# 4. How Subgoals Can Be Represented

| Subgoal Form | Example | Advantage | Risk |
|-|-|-|-|
| Language | “Pick up the red cup” | Interpretable and easy for a VLM to generate | Does not include precise geometry or contact state |
| Visual goal | Target image or future viewpoint | Encodes spatial and object states | May generate unreachable or physically incorrect scenes |
| State goal | Object pose or joint configuration | Suitable for planning and control | True state is difficult to obtain |
| Skill token | Grasp, rotate, insert | Convenient for discrete composition | Skill boundaries may be manually imposed and incomplete |
| Latent vector | Learned goal embedding | Flexible representation | Weak semantics and verifiability |

A good subgoal must be observable, reachable, and verifiably complete, while also informing the low-level policy of the required behavior.

# 5. From Task Graphs to Hierarchical Policies

A task can be represented as a conditional graph:

$$G_{\mathrm{task}}=(V_{\mathrm{subgoal}},E_{\mathrm{transition}})$$

> **Interpretation:** A task graph consists of a set of subgoal nodes and a set of directed edges representing allowed transitions.

**Derivation:** Abstracting task stages as nodes and prerequisites and ordering relations as edges yields a graph structure that can be checked and replanned.

Nodes represent subgoals, while edges represent allowed transitions. The high-level planner selects the next node based on the current state, and the low-level policy executes it.

Explicit task graphs are suitable for workflows with clear rules; learned high-level policies are suitable for scenarios with substantial task variation and rules that are difficult to enumerate exhaustively. Practical systems often combine both: rules enforce safety and hard constraints, while models handle semantic judgment and flexible ordering.

# 6. How World Models Support Long-Horizon Planning

A world model provides:

$$p_\phi(z_{t+1}\mid z_t,a_t)$$

> **Interpretation:** Given the current latent state and a single-step action, the low-level world model predicts a distribution over the next latent state.

**Derivation:** This is a controlled transition model at the action time scale, which can support short-horizon planning through multistep composition.

In hierarchical planning, actions can be replaced with skills:

$$p_\phi(z_{k+1}\mid z_k,\omega_k)$$

> **Interpretation:** Given the current high-level state and selected Option, the skill-level world model predicts the next high-level state at skill termination.

**Derivation:** Marginalizing over all low-level actions within an Option and its stochastic duration yields the skill-level transition between Semi-MDP decision points.

This allows the planner to predict, at the skill time scale, “where the object may be after executing a grasp,” without simulating every motor-control cycle.

A world model can:

- Check whether a subgoal is reachable.
- Compare the future outcomes of different skill orderings.
- Generate visual subgoals.
- Predict failures and replan in advance.

However, model errors can be actively exploited by the high-level planner. A plausible-looking future image does not imply that the contact forces or executability are correct.

# 7. How Value Functions Support Skill Selection

The skill value can be written as:

$$Q^\mu(s,\omega)=\mathbb E\!\left[\sum_{t=0}^{T_\omega-1}\gamma^t r_t+\gamma^{T_\omega}V^\mu(s')\mid s,\omega\right]$$

> **Interpretation:** The Option value equals the discounted reward accumulated during the skill, plus the expected value of the skill’s terminal state discounted by the stochastic skill duration.

**Derivation:** This is the Semi-MDP version of the Bellman return; because an Option spans T_omega low-level time steps, the terminal-state value must be multiplied by gamma raised to the power T_omega.

$T_\omega$ is the skill duration. A value function can compare different subgoals, determine when to abandon the current skill, and rank candidate futures generated through world-model planning.

If value is based only on final success, it may be unable to assess intermediate stages. If reward shaping is too strong, however, it may incentivize satisfying local metrics while undermining the overall task.

# 8. Why Language Chain-of-Thought Is Not Equivalent to Embodied Reasoning

The textual plan “pick up the cup → pour water → put it back” is only a sequence of symbols. Embodied reasoning additionally requires:

- Grounding language entities in the current visual objects.
- Determining grasp points, reachability, and contact states.
- Updating the plan based on execution feedback.
- Selecting recovery actions after failures.
- Handling physical constraints and irreversible changes.

Embodied reasoning should therefore form a closed loop among observations, memory, subgoals, and actions, rather than merely generating a textual explanation once before acting.

# 9. Three Forms of Memory

| Memory | Where It Is Stored | Update Speed | Purpose |
|-|-|-|-|
| Parametric memory | Model weights | Updated slowly during training | General skills and long-term knowledge |
| Contextual memory | Historical tokens and state caches | Updated every episode | Remember the progress of the current task |
| External memory | Databases, trajectory libraries, and object graphs | Queryable and writable | Reuse past cases |
| Fast weights | Test-time adaptation parameters | Updated rapidly after demonstrations | Adapt to the current environment or user |

The more plastic a memory is, the more readily it can adapt, but the more susceptible it becomes to forgetting, contamination, or storing erroneous experience. Gating, uncertainty estimation, and rollback mechanisms are required.

# 10. Test-Time Adaptation

Test-time adaptation aims to update the model’s internal state using human demonstrations or unlabeled observations from the current environment:

$$m'=U_\psi(m,\mathcal D_{\mathrm{context}})$$

> **Interpretation:** Given the old memory and current contextual data, the test-time updater produces the updated fast memory m prime.

**Derivation:** Demonstrations, observations, or feedback are used as inner-loop inputs, while meta-training learns the update rule U so that the written memory improves subsequent robot tasks.

The policy is then conditioned on the updated memory:

$$\pi_\theta(a\mid o,g,m')$$

> **Interpretation:** Given the current observation, task goal, and fast memory, the updated policy produces an action distribution.

**Derivation:** Using m prime as an additional condition allows the same base parameters to behave differently across environments or after different demonstrations. Erroneous memory also directly changes the actions, so gating and rollback are required.

The idea behind WAM-TTT is to let human videos write fast memory in the inner loop, and then use robot-action tasks in the outer loop to train “how to update usefully.” The key evidence is whether updates based solely on human-side signals improve robot actions in genuinely held-out environments and tasks.

# 11. How Skills Are Acquired

| Source | Method | Risk |
|-|-|-|
| Manual definition | Annotate by task stage | Limited scalability and subjective boundaries |
| Action clustering | Discover segments based on trajectory similarity | Geometric similarity does not imply identical function |
| Event segmentation | Segment based on contact or object changes | Depends on reliable event detection |
| Latent-variable model | Learn latent skills | Difficult to interpret and may collapse |
| Language and video | Generate stage descriptions from demonstrations | Semantics may not align with robot execution |

For manipulation tasks, segmenting skills according to object-interaction events is generally more reliable than using fixed time windows—for example, contact, stable grasp, lifting, and release.

# 12. A Long-Horizon Kitchen Task

Task: “Put the cup in the dishwasher and close the door.”

| Stage | High-Level Output | Low-Level Policy | Completion Condition | Recovery |
|-|-|-|-|-|
| Localization | Find the cup | Move the camera or robot arm | Cup-detection confidence is sufficient | Search from another viewpoint |
| Grasping | Grasp the cup | Approach and close the gripper | Stable grasp with no slipping | Reposition and grasp again |
| Transport | Move to the dishwasher | Collision-free trajectory | Reach a valid placement region | Replan the path |
| Placement | Place it in the rack | Compliant placement | Cup is stable and released | Adjust the pose |
| Door closing | Grasp and close the door | Contact and force control | Door state is closed | Relocalize the handle |

This table reveals that a long-horizon system requires different observations, policies, completion detectors, and recovery mechanisms—not one infinitely long Action Chunk.

# 13. Major Failure Modes

| Failure | Manifestation | Diagnosis |
|-|-|-|
| Incorrect decomposition | The subgoal order is infeasible | Task graph and prerequisites |
| Semantic grounding failure | Language refers to the wrong object | Object binding and interventions |
| Discontinuous skill interfaces | Actions jump during stage transitions | State and action boundaries |
| Incorrect completion detection | Transition occurs too early or too late | Event labels and sensors |
| Memory contamination | Erroneous demonstrations degrade performance | Gating, confidence, and rollback |
| Hallucinated model-based planning | The subgoal looks visually plausible but is not executable | Real rollouts and reachability |

# 14. Rigorous Evaluation

1. **Long-horizon success:** Overall task success rate and mean completed stage.
2. **Stage success:** Success rate of each skill and transition failures.
3. **Recovery:** Recovery rate after perturbations, recovery time, and rollback level.
4. **Compositional generalization:** New orderings of known skills, new objects, and new environments.
5. **Memory:** Effects of correct, irrelevant, and erroneous demonstrations.
6. **Planning evidence:** Ablations with and without world models, value functions, and search.
7. **Control boundaries:** Latency, force peaks, and action continuity at stage transitions.

# 15. Lesson Exercises

1. Define the initiation set, policy, and termination condition of each Option for a five-stage task.
2. Compare language, visual, and state subgoals.
3. Diagram the interfaces among the world model, value function, high-level planner, and low-level VLA.
4. Design an experiment to verify whether “textual chain-of-thought genuinely improves closed-loop recovery.”
5. Design erroneous-demonstration and irrelevant-demonstration controls for test-time memory.
6. Place π0.7 and WAM-TTT within this track and explain which other tracks they connect to.

# 16. Minimal Experiment: Does Hierarchy Genuinely Improve Long-Horizon Closed-Loop Performance?

In a resettable five-stage tabletop or kitchen simulation task, hold the low-level grasping, moving, and placement skills fixed, and vary only the high-level system.

1. Compare four systems: a single long Action Chunk, a fixed task graph, a high-level policy that selects Options, and a world model with value-based ranking.
2. During the third stage, randomly move the target object or cause the grasp to fail, then test recovery from the local stage rather than restarting the entire task.
3. Hold the success rate of each low-level skill fixed and sweep the false-positive and false-negative rates of termination detection.
4. Provide correct, irrelevant, and erroneous contextual demonstrations separately to test memory gating and rollback.
5. Report overall task success rate, mean completed stage, recovery rate, skill-transition latency, and force peaks at transitions.
6. Hold the number of model calls and the low-level control budget fixed to distinguish gains from hierarchical structure from gains due to additional computation.

# 17. Paper Facts, Author Interpretations, and Course Assessments

| Work | Paper Fact | Author Interpretation | Course Assessment |
|-|-|-|-|
| Options | Uses initiation sets, intra-option policies, and termination functions to formalize multistep temporal abstraction | Temporal abstraction can support hierarchical reinforcement learning and skill reuse | The formal interface still leaves unresolved where skills come from, how termination should be supervised, and how to ensure stable transitions in the real world |
| SayCan | Combines skill usability proposed by a language model with robot value or affordance scores for ranking | Combining linguistic knowledge with physical feasibility can enable long-horizon tasks | It demonstrates compositional capability over a specific skill library, which is not equivalent to automatically discovering skills or solving low-level contact |
| Inner Monologue / closed-loop embodied reasoning | Writes environmental feedback back into the language-planning context and replans | Continuous feedback can improve long-horizon plan execution | It must be compared against a planner with equivalent state feedback but no text to identify the contribution of language reasoning itself |
| π0.7 | A general-purpose VLA supports automatically generated prompts, including visual subgoals, to improve task controllability | The model can automatically form more effective hierarchical conditioning | Its primary classification remains VLA; this track focuses on subgoal generation, completion detection, and the low-level interface |
| WAM-TTT | Uses human-side context to write fast memory at test time and supervises the update mechanism with robot tasks | Human demonstrations can help robots adapt to new environments at test time | The key evidence is performance in strictly held-out environments, controls with erroneous demonstrations, update stability, and rollback capability |

<bookmark name="Between MDPs and Semi-MDPs: A Framework for Temporal Abstraction" href="https://www.sciencedirect.com/science/article/pii/S0004370299000521"></bookmark>

<bookmark name="Do As I Can, Not As I Say: Grounding Language in Robotic Affordances" href="https://arxiv.org/abs/2204.01691"></bookmark>

<bookmark name="Inner Monologue" href="https://arxiv.org/abs/2207.05608"></bookmark>

# 18. Cross-Reading for This Course

[Physical Causality and Embodied Chain-of-Thought](/en/route-d/02-01b-物理因果与具身思维链-机器人如何从模仿走向闭环推理)

[D3｜Memory and Test-Time Adaptation: WAM-TTT and Fast Memory](/en/route-d/05-d3-记忆与测试时适应-机器人如何利用当前环境的新经验)

[π0.7: Visual Subgoals and Automatic Prompts](/en/route-a/07-a3-5-π0-7-从通用策略到可操控的机器人基础模型)
