---
title: "B5｜World Model Paper Lab: World Models, Dreamer, MuZero, and TD-MPC2"
sourceToken: ENq7dECdwoOAFxxDYDxcruNBniB
sourceRevision: 12
license: Apache-2.0
translationSource: "route-b/06-b5-世界模型论文实验室-world-models-dreamer-muzero-与-td-mpc2.md"
translationSourceHash: 7284e268fee906ab3dd0bce01175acf94703817e8179d868d5ade56ee3342225
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/ENq7dECdwoOAFxxDYDxcruNBniB) · Source Revision 12

::: tip 🔬
**Paper Lab:** Rather than restating abstracts in publication order, this lesson compares the major world model approaches in terms of “what they represent, what they predict, how actions are generated, and what evidence supports them,” and explains which mechanisms are suitable for robotics.
:::

# Unified Comparison Framework

| Question | Evidence to Identify |
|-|-|
| State representation | Pixels, stochastic latent, deterministic latent, object state |
| Dynamics | Whether action-conditioned transitions are stochastic and whether they are trained over multiple steps |
| Prediction heads | Observation, reward, termination, value, policy |
| Decision-making | Online planning, tree search, imagined Actor-Critic |
| Data | Real-world, simulated, offline, online interaction |
| Evidence | Prediction, sample efficiency, real-world control, out-of-distribution performance |

# 1. World Models: Compression, Memory, and Controller

The classic World Models architecture decomposes the system into:

- V: A VAE that encodes images into a latent representation.
- M: RNN dynamics that predict changes in the latent state.
- C: A small controller that acts based on the latent and memory states.

The core idea is that a policy does not need to learn directly in pixel space; it can instead be trained within a compressed “dream.” However, the world models used by early methods could be exploited by the controller, and visual reconstruction objectives did not necessarily preserve control-relevant details.

# 2. PlaNet / Dreamer: Stochastic State Spaces and Learning in Imagination

The RSSM combines deterministic memory with a stochastic latent:

$$h_t=f_\phi(h_{t-1},z_{t-1},a_{t-1})$$

> **How to read this:** The deterministic memory \(h_t\) of the RSSM is recurrently computed from the previous memory, previous stochastic state, and previous action.

**Derivation:** The recurrent state compresses long-term history, while the stochastic state represents current uncertainty. Feeding all three into a recurrent function produces an action-conditioned predictive memory.

$$z_t\sim p_\phi(z_t\mid h_t)$$

> **How to read this:** Before the current observation is available, the dynamics prior predicts the current stochastic latent state from the deterministic memory \(h_t\).

**Derivation:** This is the prediction step of the RSSM. Because past observations and actions have already been summarized in \(h_t\), the prior is conditioned only on \(h_t\).

Observation posterior:

$$z_t\sim q_\psi(z_t\mid h_t,o_t)$$

> **How to read this:** After observing the current observation \(o_t\), the inference posterior corrects the stochastic latent state using the predictive memory and the new observation.

**Derivation:** This corresponds to the update step in Bayesian filtering. During training, objectives such as the KL divergence encourage the posterior both to explain the current observation and to remain close to the prior obtained solely from the dynamics.

PlaNet performs online planning in latent space, whereas Dreamer trains an Actor-Critic through latent imagination. The key shift in this line of work is not toward greater visual realism, but toward turning the model into an efficient environment for learning decisions.

# 3. DreamerV3: Unified Scaling and Stable Training

DreamerV3 focuses on a unified training recipe that works across domains and reward scales, including:

- Transformations such as symlog to handle different numerical scales.
- Discrete stochastic latents.
- Normalization and regularization to improve stability.
- Unified objectives for the Actor-Critic and world model.

To assess its significance for robotics, it is necessary to distinguish sample efficiency on simulation benchmarks from transferability under real-world contact, latency, and visual distributions.

# 4. MuZero: A Decision Model Without Observation Reconstruction

MuZero learns:

- representation: observation history to latent state.
- dynamics: latent state and action to the next latent state and reward.
- prediction: latent state to policy and value.

It does not need to predict the actual next image; it only requires the latent state to support reward prediction, value estimation, and policy search. This demonstrates that a world model can be “decision-sufficient” rather than “visually complete.”

MuZero uses tree search and is well suited to discrete actions and environments with well-defined rules. Continuous, high-dimensional robot actions require action discretization, sampling-based search, or a hierarchy of skills.

# 5. TD-MPC / TD-MPC2: Task-Oriented Latents and Short-Horizon MPC

TD-MPC learns task-oriented latent dynamics, rewards, and values, and performs planning with short-horizon MPC. It tightly connects model learning with TD value learning:

$$\begin{aligned}z_{t+1}&=f_\phi(z_t,a_t),\\ \hat r_t&=r_\phi(z_t,a_t),\\ \hat Q_t&=Q_\xi(z_t,a_t)\end{aligned}$$

> **How to read this:** TD-MPC-style methods use latent dynamics to predict the next state, a reward head to predict the immediate reward, and a value head to estimate the long-term value of the current state-action pair.

**Derivation:** These three components arise from a control-oriented decomposition of supervision: the dynamics preserve predictability, the reward provides a local task signal, and \(Q\) uses a TD target to account for long-term effects beyond the planning horizon.

The planning objective combines predicted rewards with a terminal \(Q\)-value. Compared with pixel reconstruction, the representation is constrained directly by the control objective; the trade-off is that it may lack general-purpose information for new, previously unspecified objectives.

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
| PlaNet | Yes/latent | Latent MPC | Online planning | Computational cost and model bias |
| Dreamer | Yes/latent | Imagined Actor-Critic | Sample efficiency | Imagination bias |
| MuZero | No | Tree search | Decision-sufficient representation | Adaptation to continuous robot actions |
| TD-MPC2 | No | Short-horizon MPC + value | Task-oriented control | Objective specialization |
| Video world models | Generate visuals | Visual plans/subgoals | Data scale and semantics | Action and physical consistency |

## 7.1 Facts, Authors’ Interpretations, and Course Assessments

| Method | Paper Facts | Authors’ Interpretation | Course Assessment |
|-|-|-|-|
| World Models | The VAE, recurrent dynamics, and small controller are trained separately, and the controller can be optimized within the learned model | A compressed internal world is sufficient to support policy learning | It established the paradigm, but model exploitation and control-relevant representations still require dedicated evaluation |
| DreamerV3 | It uses an Actor-Critic on trajectories imagined by an RSSM and adopts unified numerical scaling and a unified training recipe | A single configuration can work robustly across multiple classes of benchmarks | Strong evidence of sample efficiency comes primarily from controlled benchmarks; performance under real-world contact, latency, and safety constraints cannot be inferred by extrapolation |
| MuZero | Its latent model predicts rewards, values, and policies and is paired with tree search, without reconstructing observations | A model used for decision-making does not need to reconstruct every detail of the environment | It supports the decision-sufficiency view, but transfer to continuous robot actions and new objectives requires additional interfaces and evidence |
| TD-MPC2 | It jointly learns a task-oriented latent representation, rewards, values, and a policy prior, and performs short-horizon planning | Model-based RL can scale to multitask settings and larger model capacities | Fair comparisons must hold constant the amount of real-world interaction, model capacity, planning budget, and control frequency |

# 8. Decisive Questions for Robotics Research

1. Does the model predict contact events rather than only pixels?
2. When the action changes, does the future exhibit the correct counterfactual change?
3. Do trajectories with high predicted returns in the model still achieve high returns on the real robot?
4. Are multi-step errors and uncertainty properly calibrated?
5. Is inference fast enough to meet the control-cycle requirements?
6. Does the benefit from real-world data exceed that of a direct policy baseline?
7. Do held-out tasks include new physical structures rather than only visual variations?

# 9. Experimental Assignments

1. Implement a pixel-reconstruction latent and a task-oriented latent in the same toy environment.
2. Compare latent MPC with imagined Actor-Critic.
3. Introduce model error and examine whether the planner exploits the resulting bias.
4. Convert continuous actions into skill tokens and experiment with MuZero-style search.
5. Add action conditioning to a video model and evaluate counterfactual prediction.
6. Create a paper evidence matrix that distinguishes conclusions from simulation and real-robot experiments.

# Primary Sources

<bookmark name="World Models" href="https://arxiv.org/abs/1803.10122"></bookmark>

<bookmark name="PlaNet" href="https://arxiv.org/abs/1811.04551"></bookmark>

<bookmark name="Dreamer" href="https://arxiv.org/abs/1912.01603"></bookmark>

<bookmark name="DreamerV3" href="https://arxiv.org/abs/2301.04104"></bookmark>

<bookmark name="MuZero" href="https://arxiv.org/abs/1911.08265"></bookmark>

<bookmark name="TD-MPC2" href="https://arxiv.org/abs/2310.16828"></bookmark>

# Advanced Lab｜Unified Formulation, Visualization, and Reproduction

To place World Models, Dreamer, MuZero, and TD-MPC2 within a common interface, we must first distinguish whether they learn the following objects rather than treating them as the same kind of method simply because they all use latent representations.

$$\begin{aligned}z_t&=e_\psi(o_{\le t}),\\ z_{t+1}&\sim p_\phi(z_{t+1}\mid z_t,a_t),\\ \hat r_t&=r_\phi(z_t,a_t),\\ \hat V_t&=V_\xi(z_t)\end{aligned}$$

> **How to read this:** The unified interface consists, in order, of mapping observation histories to state representations, action-conditioned latent transitions, reward prediction, and value prediction.

**Derivation:** This does not claim that every paper implements all four components. Instead, it decomposes a decision system according to its mathematical objects; when one component is absent, the method replaces it with search, a controller, or another source of supervision.

The unified comparison objective can be written as:

$$\hat G_H=\sum_{k=0}^{H-1}\gamma^k\hat r_{t+k}+\gamma^H\hat V(z_{t+H})$$

> **How to read this:** The unified \(H\)-step predicted return equals the sum of \(H\) discounted rewards from the model rollout plus the discounted terminal value of the state at step \(H\).

**Derivation:** The infinite-horizon return is truncated at \(H\). The first part is predicted explicitly by the model, while the remainder is approximated by the value function. The main differences among the papers lie in how the state is learned, how actions are selected, and how gradients and real-world data enter the system.

The key differences among these papers are how they learn $z$, how they prevent rollout bias, how they search over actions, and where real and imagined data enter the learning process.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBPW1JlYWwgT2JzZXJ2YXRpb24gSGlzdG9yeV0gLS0+IFpbTGVhcm5lZCBMYXRlbnQgU3RhdGVdCiAgICBaIC0tPiBEW0FjdGlvbi1Db25kaXRpb25lZCBMYXRlbnQgRHluYW1pY3NdCiAgICBBW0NhbmRpZGF0ZSBBY3Rpb24gb3IgUG9saWN5IEFjdGlvbl0gLS0+IEQKICAgIEQgLS0+IFJbUHJlZGljdGVkIFJld2FyZCAvIFZhbHVlIC8gVGVybWluYXRpb25dCiAgICBSIC0tPiBQe0hvdyBBcmUgQWN0aW9ucyBHZW5lcmF0ZWQ/fQogICAgUCAtLT4gTVtNUEMgLyBDRU1dCiAgICBQIC0tPiBBQ1tJbWFnaW5lZCBBY3Rvci1Dcml0aWNdCiAgICBQIC0tPiBUU1tUcmVlIFNlYXJjaF0KICAgIE0gLS0+IFhbRXhlY3V0aW9uIGluIHRoZSBSZWFsIEVudmlyb25tZW50XQogICAgQUMgLS0+IFgKICAgIFRTIC0tPiBYCiAgICBYIC0tPiBP" />

## Unified Reproduction Experiment

1. In the same partially observable control task, hold encoder capacity, the amount of real-world interaction, and the planning budget constant.
2. Implement pure latent MPC, imagined Actor-Critic, and value-guided planning separately.
3. Plot prediction error against rollout horizon and compare it with real control returns.
4. Perform a three-axis ablation over model capacity, number of planning steps, and amount of real-world data to distinguish gains from the model from gains due to computation.

## Lab Exercises

1. Explain why low pixel prediction error does not necessarily yield high control returns.
2. Derive how model error may accumulate over a multi-step rollout.
3. Design an experiment that distinguishes between “the value function rescued an inaccurate model” and “the model is genuinely more accurate.”
4. Compare the supervision retained by MuZero without observation reconstruction with that retained by Dreamer through observation reconstruction.
