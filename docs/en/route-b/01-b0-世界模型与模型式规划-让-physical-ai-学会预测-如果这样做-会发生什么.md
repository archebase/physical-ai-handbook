---
title: "B0｜World Models and Model-Based Planning: Teaching Physical AI to Predict “What Will Happen If I Do This?”"
sourceToken: FP2SdSVoLoRZusxeajbcBe8Ln2g
sourceRevision: 23
license: Apache-2.0
translationSource: "route-b/01-b0-世界模型与模型式规划-让-physical-ai-学会预测-如果这样做-会发生什么.md"
translationSourceHash: efde36014791a32fec495dbfaa94699169025f5f15835d3301fc1e8971c46475
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/FP2SdSVoLoRZusxeajbcBe8Ln2g) · Source Revision 23

::: tip 💡
**Course positioning:** This chapter is intended for readers with a foundation in probability and statistics. Starting from conditional probability, maximum likelihood, and latent variable models, it explains what world models learn, why they differ from VLAs, and how predictive models can be converted into robot behavior through MPC, value functions, or imagination-based training.
:::

# Learning Objectives and Prerequisites

After completing this chapter, readers should be able to distinguish among policies, world models, value functions, and planners; verbalize the meaning of a state transition model; derive a dynamics MSE loss from a Gaussian observation assumption; explain the ELBO of a latent state-space model; implement an MPC controller using learned dynamics from scratch; and identify the primary failure modes of world models under contact, friction, latency, and partial observability.

| Prerequisite knowledge | How it is used in this chapter |
|-|-|
| Conditional probability | Understanding how the next state depends on the current state and action |
| Expectation and variance | Understanding prediction error, stochastic dynamics, and risk |
| Maximum likelihood | Deriving training losses from probabilistic models |
| KL divergence | Understanding prior–posterior alignment in latent variable models |
| Gradient descent | Understanding how models, value functions, and policies are trained separately |

# The Big Picture First: World Models Are Not a Single Technological Lineage

The term “world model” is now used across the control, reinforcement learning, representation learning, computer vision, and generative modeling communities. All of these approaches predict the world, but they differ in what they predict, the role of actions, and how the predictions are used. Before introducing the equations, use the following five lineages to establish a conceptual map.

| Lineage | Core question | Representative work | How it contributes to decision-making |
|-|-|-|-|
| Classical control and system identification | How does the state evolve under control inputs, and how can stability be maintained under constraints? | State-space models, Kalman Filter, POMDP, MPC | The model is consumed directly by an estimator and optimizer, which repeatedly solve for control inputs |
| Decision-oriented latent world models | Can the future be imagined efficiently in a compressed state space and returns estimated from it? | World Models, PlaNet, Dreamer, MuZero, TD-MPC | Used for online planning, tree search, or training policies and value functions |
| JEPA predictive representations | Can abstract, decision-relevant structure be predicted without generating every pixel? | Autonomous Machine Intelligence, I-JEPA, V-JEPA, V-JEPA 2 | First learn predictable representations, then connect them to planning and control through action-conditioned dynamics |
| Spatial intelligence and persistent 3D worlds | Can an agent understand objects, viewpoints, occlusion, geometry, and interactive space? | Visual intelligence, spatial intelligence, World Labs, Marble | Provides persistently queryable world representations for rendering, simulation, spatial reasoning, and planning |
| Generative interactive environments and World Action Models | Can action-conditioned futures be generated while jointly modeling world prediction and action generation? | UniSim, Genie, Cosmos, 4D-WAM | Used as a simulator, candidate-future generator, planning interface, or action policy |

These lines of work are converging, but their differences cannot be erased by saying that they all “predict the future.” Yann LeCun’s line of research emphasizes predicting abstract structure in latent space, avoiding wasting model capacity on unpredictable pixel-level details. Fei-Fei Li’s line of research emphasizes that intelligence must build a persistent, interactive understanding of 3D space rather than remaining at the level of language or 2D image correlations. Their intersection is an action-conditioned world representation that is abstract enough for planning yet spatially grounded enough for intervention.

**Six unifying questions:** For any system described as a world model, ask: What does it represent? What does it predict? Does action enter the model as an intervention variable? Who consumes the predictions? How do the predictions enter the perception–planning–control loop? What evidence from real interventions shows that it improves decision-making rather than merely producing more realistic imagery?

**Division of coverage across the track:** B5 focuses on the lineage of “decision-oriented latent world models”; B6 focuses on how JEPA, spatial intelligence, and generative simulators form the modern intellectual lineage; B7 then examines the specific mechanisms of 4D world states and World Action Models.

# 1. What Exactly Does a World Model Learn?

A policy typically learns:

$$\pi_\theta(a_t\mid o_{\le t},g)$$

> **Reading:** Based on the observation history up to the present and the goal, the policy assigns a conditional probability to the current action.

**Derivation:** A policy directly models the conditional distribution from available information to actions, without requiring an explicit representation of future states.

Read this as: “Given the observation history up to the present and the goal, what is the conditional distribution over actions?” It answers **what to do now**.

A world model typically learns:

$$p_\phi(o_{t+1},r_t,d_t\mid o_{\le t},a_t)$$

> **Reading:** Based on the observation history and current action, the world model predicts the joint conditional distribution of the next observation, immediate reward, and termination event.

**Derivation:** The future of the environment is decomposed into observable outcomes, task feedback, and termination events, which are jointly represented as an action-conditioned prediction target.

Read this as: “Given the observation history and current action, what is the probability distribution over the next observation, immediate reward, and termination event?” It answers **what may happen afterward if this action is taken**.

These two directions must not be conflated. A VLA can imitate actions directly without an explicit world model. A world model can also be responsible only for prediction; it must be combined with a planner, value function, or policy to select actions.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBPW09ic2VydmF0aW9uIGhpc3RvcnldIC0tPiBQWyJEaXJlY3QgcG9saWN5IDxici8+cGkoYSBnaXZlbiBvLGcpIl0KICAgIEdbVGFzayBnb2FsXSAtLT4gUAogICAgTyAtLT4gTVsiV29ybGQgbW9kZWwgPGJyLz5wKHMtbmV4dCBnaXZlbiBzLGEpIl0KICAgIEFbQ2FuZGlkYXRlIGFjdGlvbiBzZXF1ZW5jZXNdIC0tPiBNCiAgICBQIC0tPiBBCiAgICBNIC0tPiBGW1ByZWRpY3RlZCBmdXR1cmUgc3RhdGVzXQogICAgRiAtLT4gRVtSZXdhcmQgLyB2YWx1ZSBldmFsdWF0aW9uXQogICAgRSAtLT4gU1tTZWxlY3QgdGhlIGZpcnN0IGFjdGlvbl0KICAgIFAgLS0+IFMKICAgIFMgLS0+IFJbRXhlY3V0ZSBpbiB0aGUgcmVhbCBlbnZpcm9ubWVudF0KICAgIFIgLS0+IE8=" />

# 2. From Markov States to a Partially Observable World

## 2.1 The Markov Assumption

If state $s_t$ already contains all the information needed to predict the future, then:

$$p(s_{t+1}\mid s_{0:t},a_{0:t})=p(s_{t+1}\mid s_t,a_t)$$

> **Reading:** If the current state contains all relevant information, then once the current state and action are given, earlier history provides no additional information about the next state.

**Derivation:** This is a conditional-independence assumption about state sufficiency. In robotics, if velocity, contact, and hidden payloads are not included in the state, a single-frame observation does not satisfy it.

Read this as: “Once the current state and current action are known, earlier history provides no additional information about the next state.” This does not mean that the physical world has no history. Rather, it requires the state variables to have already compressed the relevant history—for example, by including velocity, contact state, and whether an object is securely grasped in addition to position.

## 2.2 Robots Are Usually Partially Observable

A camera image $o_t$ is generally not the complete state. Occlusion, depth ambiguity, coefficients of friction, external forces, and internal deformation may be unobservable. Real systems must therefore construct a belief state or latent state from history:

$$z_t=E_\phi(o_{\le t},a_{<t})$$

> **Reading:** Encoder E constructs latent state z_t from the observation history and preceding actions.

**Derivation:** History provides information about occluded velocity, contact, and object changes. The latent state is a compression of information useful for control and is not guaranteed to equal the true physical state.

Here, $z_t$ is not merely a “compressed image.” A latent state useful for control should preserve information that affects future predictability and action selection.

# 3. Deriving the Dynamics Loss from Maximum Likelihood

## 3.1 Deterministic Dynamics

The simplest model directly predicts the next state:

$$\hat{s}_{t+1}=f_\phi(s_t,a_t)$$

> **Reading:** The dynamics model f_phi takes the current state and action as input and outputs a deterministic prediction of the next state.

**Derivation:** This is the simplest model, reducing the conditional distribution to a point prediction. It is suitable when noise is small or only the conditional mean matters.

If the true next state is assumed to follow a fixed-variance Gaussian distribution:

$$p_\phi(s_{t+1}\mid s_t,a_t)=\mathcal{N}(s_{t+1};f_\phi(s_t,a_t),\sigma^2I)$$

> **Reading:** The next state follows a Gaussian distribution whose mean is given by the dynamics network and whose covariance is the fixed value sigma squared times the identity matrix.

**Derivation:** Expanding the Gaussian negative log-likelihood and holding the variance fixed leaves the squared prediction error, yielding the next-state MSE.

Maximizing the log-likelihood is equivalent to minimizing:

$$\mathcal{L}_{dyn}=\mathbb{E}\left[\lVert s_{t+1}-f_\phi(s_t,a_t)\rVert_2^2\right]$$

> **Reading:** The dynamics loss is the expected squared distance between the predicted next state and the true next state.

**Derivation:** It follows from maximum likelihood under a fixed-variance unimodal Gaussian. Multimodal post-collision outcomes are collapsed by the conditional mean into an intermediate state that may not exist.

Thus, next-state MSE implicitly assumes a fixed-variance, unimodal Gaussian. When an object may slide in different directions after a collision, the mean prediction may correspond to a future that does not actually exist.

## 3.2 Stochastic Dynamics and Uncertainty

A more general model outputs a full distribution:

$$p_\phi(s_{t+1}\mid s_t,a_t)$$

> **Reading:** Given the current state and action, the next state is represented not as a single point but as a complete conditional probability distribution.

**Derivation:** This formulation preserves the full conditional distribution without assuming in advance that it must be a fixed-variance Gaussian. Choosing a Gaussian, mixture density, or discrete distribution simply provides a different parameterization of this conditional distribution.

The width of the distribution may arise from genuine process noise or from hidden states unknown to the model; these sources require different sensing and decision-making strategies.

Stochasticity may come from genuine process noise, or it may arise because the model does not know the hidden state. The engineering implications differ: the former requires risk-sensitive decision-making, whereas the latter can be reduced through better sensors, richer historical state, or broader data coverage.

# 4. Latent State-Space Models and the ELBO

High-dimensional images are unsuitable for direct long-horizon planning. A latent state-space model separates observation generation from state transition:

$$p_\phi(z_{1:T},o_{1:T}\mid a_{1:T-1})=p(z_1)\prod_{t=1}^{T}p_\phi(o_t\mid z_t)\prod_{t=1}^{T-1}p_\phi(z_{t+1}\mid z_t,a_t)$$

> **Reading:** Given the first T-1 actions, the joint probability of the entire sequence of latent states and observations is obtained by multiplying three components: the initial-state distribution, the observation generated by each state, and the action-conditioned state transitions.

**Derivation:** First generate z_1, then generate o_t from each z_t. Only actions from t through T-1 produce next states, so the transition product must not extend through T.

Read this as: “The latent state evolves forward according to action-conditioned dynamics, and each latent state then generates an observation.” The true posterior $p(z_{1:T}\mid o_{1:T},a_{1:T})$ is generally intractable, so an approximate posterior $q_\psi$ is introduced.

The evidence lower bound on the log-likelihood can be written as:

$$\log p_\phi(o_{1:T}\mid a_{1:T-1})\ge \mathbb{E}_{q_\psi(z_{1:T}\mid o_{1:T},a_{1:T-1})}\!\left[\log p_\phi(o_{1:T}\mid z_{1:T})\right]-D_{\mathrm{KL}}\!\left(q_\psi(z_{1:T}\mid o_{1:T},a_{1:T-1})\,\Vert\,p_\phi(z_{1:T}\mid a_{1:T-1})\right)$$

> **Reading:** The log-likelihood of the observation sequence is lower-bounded by the expected log-probability of reconstructing the observations, minus the KL divergence between the approximate posterior and the dynamics prior.

**Derivation:** Insert the true posterior into the log-likelihood by multiplying and dividing by it, then apply Jensen’s inequality to obtain the ELBO. The first term requires the latent state to explain the observations, while the second requires it to remain close to the prior predicted by the action-conditioned dynamics.

The first term requires the latent state to explain the observations. The second requires the posterior obtained after seeing the actual observations not to deviate too far from the prior predicted solely by the dynamics. Informally, it balances two objectives: **the state must be expressive enough to represent the current observation, while also remaining stable enough to roll forward through the dynamics.**

A warning is necessary: good image reconstruction does not imply that the latent state is suitable for control. Background textures may consume substantial representational capacity, while subtle contact states determine task success or failure. Control-oriented world models often also predict rewards, values, termination, keypoints, or affordances.

# 5. From Prediction to Action: Model Predictive Control

Once a dynamics model is available, an objective must still be defined. Given a planning horizon $H$, model predictive control selects an action sequence:

$$a_{t:t+H-1}^*=\arg\max_{a_{t:t+H-1}}\mathbb{E}_{p_\phi}\left[\sum_{k=0}^{H-1}\gamma^kr_{t+k}+\gamma^HV(z_{t+H})\right]$$

> **Reading:** Among the futures predicted by the model, find an action sequence of length H that maximizes the sum of discounted rewards and terminal value.

**Derivation:** The model rolls out the future for each candidate action sequence, the reward function evaluates intermediate states, and the terminal value accounts for long-term effects beyond the finite horizon. MPC typically executes only the first action before replanning.

Read this as: “Among the futures predicted by the model, find the action sequence with the highest cumulative reward plus terminal value.” During execution, only the first action is typically applied, after which a new observation is acquired and the system replans. This is receding-horizon MPC.

## 5.1 Intuition Behind CEM

1. Initialize a Gaussian distribution over candidate action sequences.
2. Sample multiple action sequences and roll out their futures using the world model.
3. Retain a small set of elite samples with the highest returns.
4. Re-estimate the mean and variance of the action distribution from the elite samples.
5. Repeat for several iterations, then execute the first action of the final mean sequence.

CEM does not require the reward to be differentiable with respect to the actions, making it suitable for black-box world models. Its cost is that it requires many model rollouts at inference time. Model error accumulates with the planning horizon, so longer planning is not necessarily better.

# 6. Three Ways to Use a World Model

| Approach | What the model learns | How actions are obtained | Representative idea |
|-|-|-|-|
| Online planning | State transitions and rewards | MPC, CEM, or trajectory optimization | Classical model-based control, TD-MPC |
| Policy training in imagination | Latent dynamics, rewards, and continuation probabilities | The actor is optimized on imagined rollouts | Dreamer series |
| Prediction-augmented policy | Future visual observations, subgoals, or controllable changes | Predictions are used as policy conditions | Video prediction, visual subgoals, world-action model |

MuZero-style methods do not even require the model to reconstruct real observations; they only require the latent dynamics to support reward, value, and policy prediction. This shows that a “world model” does not necessarily need to generate realistic videos. What matters is whether it preserves the predictable structure needed for decision-making.

# 7. A One-Dimensional Robot Example: How Model Error Changes Planning

Consider a one-dimensional cart whose state consists of position and velocity:

$$s_t=(x_t,v_t)$$

> **Reading:** The state of the one-dimensional cart consists of its current position x_t and current velocity v_t.

**Derivation:** This defines the state variables. Position and velocity are combined into a two-dimensional state because a first-order position observation is insufficient to determine the next position. Once velocity is included, the discrete dynamics can be recursively computed from the current state and action.

Once velocity is included in the state, the next position can be predicted from the current velocity. If only position is retained, the system generally does not satisfy the Markov assumption.

The discrete dynamics are:

$$x_{t+1}=x_t+\Delta t\,v_t$$

> **Reading:** The position at the next time step equals the current position plus the time-step duration multiplied by the current velocity.

**Derivation:** This is the first-order Euler discretization of the continuous relation dx/dt=v.

$$v_{t+1}=v_t+\Delta t\,(a_t-cv_t)$$

> **Reading:** The velocity at the next time step equals the current velocity plus the time-step duration multiplied by “control acceleration minus damping proportional to velocity.”

**Derivation:** The continuous dynamics dv/dt=a-cv are discretized using Euler’s method. The larger c is, the faster high-speed states decay.

Here, $c$ is the damping coefficient. Linear regression can be used to estimate $c$ from training data. If the training data contain only low-speed motion, the model may underestimate high-speed resistance. In the model, the planner then believes the cart can stop in time, whereas during real deployment it overshoots the target. This illustrates that planning failure may come from either policy search or extrapolation error in regions visited by the plan.

| Experiment | What to vary | What to observe |
|-|-|-|
| Data coverage | Gradually add high-speed samples | Whether model error and stopping success improve together |
| Planning horizon | Vary the MPC horizon | The trade-off between myopia and accumulated model error |
| Uncertainty penalty | Penalize trajectories with high model variance | Changes in safety and task efficiency |
| Closed-loop frequency | Vary the replanning frequency | Whether new observations can correct model error |

# 8. Physical Effects Most Easily Overlooked by Robotic World Models

| Issue | Why it is dangerous | Required evidence |
|-|-|-|
| Contact and friction | Small state errors may produce completely different contact modes | Contact-event-stratified evaluation and force or tactile sensing ablations |
| Compliance and deformation | Rigid-body states are insufficient to describe cloth, cables, and soft objects | Deformation states, keypoints, or object-centric representations |
| Control latency | The model learns action causality using incorrect timestamps | Action–observation alignment and latency sweep experiments |
| Camera occlusion | A single-frame observation does not satisfy the Markov assumption | Ablations over history length, memory modules, and multiple viewpoints |
| Model exploitation bias | The planner actively searches for model errors and exploits them | Uncertainty calibration, real-environment validation, and conservative planning |
| Long-horizon rollout error | Accurate one-step predictions may still produce drifting multistep trajectories | Separate reporting of multistep open-loop and closed-loop performance |

# 9. How to Determine Whether a World Model Is Actually Useful for Control

It is insufficient to report only that generated videos look realistic or that one-step prediction error is low. At minimum, the following should be measured separately:

1. **Prediction:** Errors in one-step predictions, multistep predictions, key events, and contact states.
2. **Calibration:** Whether model confidence corresponds to the actual probability of error.
3. **Planning:** Whether trajectories that are optimal in the model remain preferable in the real environment.
4. **Closed loop:** Whether replanning can correct model errors.
5. **Out of distribution:** Performance on new objects, new dynamics parameters, new viewpoints, and new task combinations.
6. **Causal intervention:** Whether predictions change according to physical relationships when actions, mass, friction, or obstacle positions are changed.

# 10. Chapter Exercises

1. Explain $\pi(a\mid o,g)$ and $p(o'\mid o,a)$ in one sentence each, and give one example for each showing why they cannot substitute for one another.
2. Derive the next-state MSE from a fixed-variance Gaussian assumption, and write the corresponding loss for a heteroscedastic Gaussian.
3. Draw the training computation graph of a latent state-space model, labeling the prior, posterior, reconstruction term, and KL term.
4. Implement linear dynamics identification and CEM-MPC for a one-dimensional cart, and compare different horizons.
5. Design an ablation experiment that can distinguish “good visual prediction” from “good control prediction.”
6. Explain why a planner may exploit errors in a world model, and propose two methods for suppressing this behavior.

# Essential Conclusions from This Chapter

- A policy learns “what to do,” while a world model learns “what will happen after doing it.”
- A world model contributes to decision-making only when combined with rewards, values, planning, or a policy.
- MSE, ELBO, and latent rollouts arise from explicit probabilistic assumptions; they are not arbitrary formulas.
- For Physical AI, decision-relevant states, contact, and uncertainty matter more than pixel-level realism.
- The ultimate evidence for a world model is not generated video, but whether it improves real closed-loop decision-making.

## Original Sources

<bookmark name="World Models" href="https://arxiv.org/abs/1803.10122"></bookmark>

<bookmark name="DreamerV3" href="https://arxiv.org/abs/2301.04104"></bookmark>

<bookmark name="MuZero" href="https://arxiv.org/abs/1911.08265"></bookmark>

<bookmark name="TD-MPC2" href="https://arxiv.org/abs/2310.16828"></bookmark>
