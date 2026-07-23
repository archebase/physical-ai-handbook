---
title: "B5｜Decision World Model Lineage: From Internal Simulation and Dreamer to TD-MPC2"
sourceToken: ENq7dECdwoOAFxxDYDxcruNBniB
sourceRevision: 14
license: Apache-2.0
translationSource: "route-b/06-b5-决策世界模型谱系-从内部模拟-dreamer-到-td-mpc2.md"
translationSourceHash: fd0f16d3951409af5c489e759c21d107abbd1fd9ef8f4f7147edf0fead66bc84
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/ENq7dECdwoOAFxxDYDxcruNBniB) · Source Revision 14

::: tip 🔬
**Paper Lab:** Rather than reviewing abstracts chronologically, this lesson compares the major world model approaches in terms of “what they represent, what they predict, how actions are generated, and what evidence supports them,” and explains which mechanisms are suitable for robotics.
:::

# Scope of This Lesson: The Decision World Model Lineage, Not the Entire Field of World Models

This lesson focuses on a very specific line of research: using internal models to support action selection. Starting from system identification, state estimation, and model predictive control in classical control, researchers have gradually replaced explicit physical states with latent states learned from high-dimensional observations, and then used imagined rollouts, tree search, or short-horizon trajectory optimization to make decisions.

What these approaches have in common is not that they “can generate images of the future,” but that their predictions have explicit consumers: planners, value functions, or policies. World Models and Dreamer investigate how to imagine efficiently in latent space; MuZero demonstrates that a decision model need not reconstruct complete observations and only needs to predict the reward, value, and policy information required for search; the TD-MPC family tightly integrates latent dynamics, value learning, and short-horizon MPC.

This lesson does not cover JEPA-style predictive representation learning, Fei-Fei Li’s spatial intelligence research, or generative interactive environment approaches. They will be compared within a unified framework in B6 and brought together in B7 through 4D world states and World Action Models.

# Unified Comparison Framework

| Question | Evidence to Identify |
|-|-|
| State representation | Pixels, stochastic latent, deterministic latent, object state |
| Dynamics | Whether action-conditioned transitions are stochastic and whether training is multi-step |
| Prediction heads | Observation, reward, termination, value, policy |
| Decision-making | Online planning, tree search, imagined Actor-Critic |
| Data | Real-world, simulated, offline, online interaction |
| Evidence | Prediction, sample efficiency, real-world control, out-of-distribution performance |

# 1. World Models: Compression, Memory, and Controller

The classic World Models architecture divides the system into:

- V: A VAE that encodes images into a latent representation.
- M: RNN dynamics that predict changes in the latent state.
- C: A small controller that acts on the latent and memory states.

The core idea is that a policy need not be learned directly in pixel space; it can instead be trained in a compressed “dream.” However, the world models used by early methods could easily be exploited by the controller, and a visual reconstruction objective did not necessarily preserve control-relevant details.

# 2. PlaNet / Dreamer: Stochastic State Spaces and Learning from Imagination

The RSSM combines deterministic memory with a stochastic latent state:

$$h_t=f_\phi(h_{t-1},z_{t-1},a_{t-1})$$

> **Interpretation:** The deterministic RSSM memory \(h_t\) is recurrently computed from the previous memory, previous stochastic state, and previous action.

**Derivation:** The recurrent state compresses long-term history, while the stochastic state represents current uncertainty. Passing all three into a recurrent function produces an action-conditioned predictive memory.

$$z_t\sim p_\phi(z_t\mid h_t)$$

> **Interpretation:** Before the current observation is available, the dynamics prior predicts the current stochastic latent state from the deterministic memory \(h_t\).

**Derivation:** This is the prediction step of the RSSM: because past observations and actions have already been summarized in \(h_t\), the prior is conditioned only on \(h_t\).

Observation posterior:

$$z_t\sim q_\psi(z_t\mid h_t,o_t)$$

> **Interpretation:** After observing the current observation \(o_t\), the inference posterior corrects the stochastic latent state using the predictive memory and the new observation.

**Derivation:** This corresponds to the update step in Bayesian filtering. During training, objectives such as KL divergence encourage the posterior to explain the current observation without deviating excessively from the prior obtained solely from the dynamics.

PlaNet performs online planning in latent space, whereas Dreamer trains an Actor-Critic through latent imagination. The crucial shift in this lineage is not toward more photorealistic predictions, but toward turning the model into an efficient environment for decision learning.

# 3. DreamerV3: Unified Scaling and Stable Training

DreamerV3 focuses on a unified training recipe that works across domains and reward scales, including:

- Transformations such as symlog to handle different numerical scales.
- Discrete stochastic latent states.
- Normalization and regularization to improve stability.
- Unified objectives for the Actor-Critic and world model.

To assess its relevance to robotics, one must distinguish sample efficiency on simulated benchmarks from transferability to real-world contact, latency, and visual distributions.

# 4. MuZero: A Decision Model Without Observation Reconstruction

MuZero learns:

- representation: observation history to latent state.
- dynamics: latent state and action to the next latent state and reward.
- prediction: latent state to policy and value.

It is not required to predict the actual next image; it only requires the latent state to support reward and value prediction and policy search. This demonstrates that a world model can be “decision-sufficient” rather than “visually complete.”

MuZero uses tree search and is well suited to discrete actions and predefined rules. Continuous, high-dimensional robotic actions require action discretization, sampling-based search, or skill hierarchies.

# 5. TD-MPC / TD-MPC2: Task-Oriented Latent Representations and Short-Horizon MPC

TD-MPC learns task-oriented latent dynamics, rewards, and values, and plans using short-horizon MPC. It tightly couples model learning with TD value learning:

$$\begin{aligned}z_{t+1}&=f_\phi(z_t,a_t),\\ \hat r_t&=r_\phi(z_t,a_t),\\ \hat Q_t&=Q_\xi(z_t,a_t)\end{aligned}$$

> **Interpretation:** TD-MPC-style methods use latent dynamics to predict the next state, a reward head to predict the immediate reward, and a value head to estimate the long-term value of the current state-action pair.

**Derivation:** These three components arise from a control-oriented decomposition of supervision: the dynamics preserve predictability, the reward provides a local task signal, and \(Q\) uses a TD target to account for long-term effects beyond the planning horizon.

The planning objective combines predicted rewards with a terminal \(Q\)-value. Compared with pixel reconstruction, the representation is constrained directly by the control objective; the trade-off is that it may lack general-purpose information for previously unspecified objectives.

# 6. Video World Model Approaches

Video generation models learn visual futures from large-scale human and internet video datasets. They may provide:

- Priors for object motion and interaction.
- Language-conditioned visual plans.
- Cross-embodiment visual subgoals.
- Embodied environment generation and data augmentation.

The main gaps are action causality, controllability, contact mechanics, and interfaces to real robots. A video model without action conditioning is closer to a motion prior than to complete, plannable dynamics.

# 7. Comparison of Approaches

| Method | Reconstructs Observations | Decision-Making Method | Main Advantage | Main Risk |
|-|-|-|-|-|
| World Models | Yes | Train a controller in a dream | Clear modular structure | Controller exploits the model |
| PlaNet | Yes/latent | Latent MPC | Online planning | Computation and model bias |
| Dreamer | Yes/latent | Imagined Actor-Critic | Sample efficiency | Imagination bias |
| MuZero | No | Tree search | Decision-sufficient representation | Adaptation to continuous robotic actions |
| TD-MPC2 | No | Short-horizon MPC + value | Task-oriented control | Objective specialization |
| Video world models | Generate visual observations | Visual plans/subgoals | Data scale and semantics | Action and physical consistency |

## 7.1 Facts, Authors’ Interpretations, and Course Assessments

| Method | Paper Facts | Authors’ Interpretation | Course Assessment |
|-|-|-|-|
| World Models | The VAE, recurrent dynamics, and small controller are trained separately, and the controller can be optimized within the learned model | A compressed internal world is sufficient to support policy learning | It established the paradigm, but model exploitation and control-relevant representations still require dedicated evaluation |
| DreamerV3 | It uses Actor-Critic on trajectories imagined by the RSSM and adopts unified numerical scaling and training recipes | A single configuration can work robustly across multiple benchmark classes | Strong evidence for sample efficiency comes primarily from controlled benchmarks; performance under real-world contact, latency, and safety constraints cannot be inferred from it |
| MuZero | Its latent model predicts rewards, values, and policies and is used with tree search, without reconstructing observations | A model for decision-making need not recover every detail of the environment | It supports the decision-sufficiency perspective, but continuous robotic actions and transfer to new objectives require additional interfaces and evidence |
| TD-MPC2 | It jointly learns task-oriented latent representations, rewards, values, and a policy prior, and performs short-horizon planning | Model-based RL can scale to multiple tasks and larger model capacities | Fair comparisons must control for the amount of real-world interaction, model capacity, planning budget, and control frequency |

# 8. Decisive Questions for Robotics Research

1. Does the model predict contact events rather than merely pixels?
2. When an action changes, does the future exhibit the correct counterfactual change?
3. Do trajectories with high predicted returns in the model still yield high returns on the real robot?
4. Are multi-step errors and uncertainty properly calibrated?
5. Is inference fast enough to meet the control-cycle requirements?
6. Do the benefits of real-world data exceed those of a direct-policy baseline?
7. Do held-out tasks include new physical structures rather than merely visual changes?

# 9. Experimental Assignments

1. Implement a pixel-reconstruction latent representation and a task-oriented latent representation in the same toy environment.
2. Compare latent MPC with imagined Actor-Critic.
3. Introduce model errors and test whether the planner exploits model bias.
4. Replace continuous actions with skill tokens and attempt MuZero-style search.
5. Add action conditioning to a video model and validate counterfactual predictions.
6. Create a paper evidence matrix that distinguishes conclusions from simulation and real-robot experiments.

# Primary Sources

<bookmark name="World Models" href="https://arxiv.org/abs/1803.10122"></bookmark>

<bookmark name="PlaNet" href="https://arxiv.org/abs/1811.04551"></bookmark>

<bookmark name="Dreamer" href="https://arxiv.org/abs/1912.01603"></bookmark>

<bookmark name="DreamerV3" href="https://arxiv.org/abs/2301.04104"></bookmark>

<bookmark name="MuZero" href="https://arxiv.org/abs/1911.08265"></bookmark>

<bookmark name="TD-MPC2" href="https://arxiv.org/abs/2310.16828"></bookmark>

# Lab Deep Dive｜Unified Formulation, Visualization, and Reproduction

To place World Models, Dreamer, MuZero, and TD-MPC2 behind a common interface, we must first distinguish whether they learn the following objects rather than treating them as the same kind of method merely because they all use latent representations.

$$\begin{aligned}z_t&=e_\psi(o_{\le t}),\\ z_{t+1}&\sim p_\phi(z_{t+1}\mid z_t,a_t),\\ \hat r_t&=r_\phi(z_t,a_t),\\ \hat V_t&=V_\xi(z_t)\end{aligned}$$

> **Interpretation:** The unified interface sequentially includes mapping observation histories to state representations, action-conditioned latent transitions, reward prediction, and value prediction.

**Derivation:** This does not claim that every paper implements all four components. Instead, it decomposes decision systems according to their mathematical objects; when a component is absent, the paper substitutes search, a controller, or another source of supervision.

A unified comparison objective can be written as:

$$\hat G_H=\sum_{k=0}^{H-1}\gamma^k\hat r_{t+k}+\gamma^H\hat V(z_{t+H})$$

> **Interpretation:** The unified \(H\)-step predicted return equals the sum of \(H\) discounted rewards in the model rollout plus the discounted terminal value of the state at step \(H\).

**Derivation:** The infinite-horizon return is truncated at \(H\). The first segment is predicted explicitly by the model, while the remainder is approximated by the value function. The main differences among the papers lie in how the state is learned, how actions are selected, and how gradients and real-world data enter the system.

The key differences among the papers are how they learn $z$, how they prevent rollout bias, how they search over actions, and where real and imagined data enter the learning process.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBPW1JlYWwgT2JzZXJ2YXRpb24gSGlzdG9yeV0gLS0+IFpbTGVhcm5lZCBMYXRlbnQgU3RhdGVdCiAgICBaIC0tPiBEW0FjdGlvbi1Db25kaXRpb25lZCBMYXRlbnQgRHluYW1pY3NdCiAgICBBW0NhbmRpZGF0ZSBvciBQb2xpY3kgQWN0aW9uXSAtLT4gRAogICAgRCAtLT4gUltQcmVkaWN0ZWQgUmV3YXJkIC8gVmFsdWUgLyBUZXJtaW5hdGlvbl0KICAgIFIgLS0+IFB7SG93IEFyZSBBY3Rpb25zIEdlbmVyYXRlZD99CiAgICBQIC0tPiBNW01QQyAvIENFTV0KICAgIFAgLS0+IEFDW0ltYWdpbmVkIEFjdG9yLUNyaXRpY10KICAgIFAgLS0+IFRTW1RyZWUgU2VhcmNoXQogICAgTSAtLT4gWFtFeGVjdXRlIGluIHRoZSBSZWFsIEVudmlyb25tZW50XQogICAgQUMgLS0+IFgKICAgIFRTIC0tPiBYCiAgICBYIC0tPiBP" />

## Unified Reproduction Experiment

1. In the same partially observable control task, hold encoder capacity, the amount of real-world interaction, and the planning budget fixed.
2. Implement pure latent MPC, imagined Actor-Critic, and value-guided planning separately.
3. Plot prediction error against rollout horizon and compare it with real control returns.
4. Perform a three-axis ablation over model capacity, number of planning steps, and amount of real-world data to distinguish gains from the model from gains due to computation.

## Lab Exercises

1. Explain why low pixel-prediction error does not necessarily lead to high control returns.
2. Derive how model errors may accumulate over multi-step rollouts.
3. Design an experiment that distinguishes “the value function rescued an inaccurate model” from “the model is genuinely more accurate.”
4. Compare the supervision retained when MuZero does not reconstruct observations with that retained when Dreamer does.
