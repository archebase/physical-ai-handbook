---
title: "00｜The Common Foundation of Physical AI: What Exactly Are Agents Learning?"
sourceToken: UgwUdtz3do3Gp3xNupPcuQFunSh
sourceRevision: 32
license: Apache-2.0
translationSource: "foundation/01-00-physical-ai-公共地基-智能体究竟在学习什么.md"
translationSourceHash: 430e13ed31f3007799d11b10deac963cda4dfc6e8683391a62d9c9b289ee5684
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/UgwUdtz3do3Gp3xNupPcuQFunSh) · Source Revision 32

::: tip 💡
**Learning objective:** Understand Physical AI through a unified probabilistic framework. After completing this lesson, readers will be able to determine whether a method learns a policy, world model, value function, representation, or controller—and how it enters a real-world physical closed loop—without first knowing the names of any robotic foundation models.
:::

# 0. Why Physical AI Requires a Different Curriculum from Conventional AI

When a language model outputs an incorrect token, it usually does not alter its next training input. When a robot outputs an incorrect action, it changes the camera view, contact state, object positions, and subsequent data distribution. The central challenge of Physical AI is not to feed images and language into a larger network, but to keep a model operating in a closed loop where **actions change future observations**.

Therefore, every algorithm must answer five questions: What does it observe? What does it control? What supervision does it learn from? How does it produce actions during inference? How do errors feed back through the physical world?

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBXW1JlYWwgUGh5c2ljYWwgV29ybGRdIC0tPiBPW09ic2VydmF0aW9uc10KICAgIE8gLS0+IFpbU3RhdGUgb3IgUmVwcmVzZW50YXRpb25dCiAgICBaIC0tPiBEW0RlY2lzaW9uIE1vZHVsZV0KICAgIEdbVGFzayBHb2FsXSAtLT4gRAogICAgRCAtLT4gQVtBY3Rpb24gQ29tbWFuZHNdCiAgICBBIC0tPiBDW0NvbnRyb2wgYW5kIEV4ZWN1dGlvbl0KICAgIEMgLS0+IFcKICAgIFcgLS0+IFJbUmV3YXJkcywgU3VjY2Vzc2VzLCBhbmQgRmFpbHVyZXNdCiAgICBSIC0tPiBMW0RhdGEgYW5kIExlYXJuaW5nXQogICAgTCAtLT4gWgogICAgTCAtLT4gRA==" />

# 1. The First Set of Basic Objects: States, Observations, Actions, and Trajectories

## 1.1 States and Observations

A state $s_t$ contains the physical information required to predict the future and select actions, such as object poses, robot velocities, contact states, and friction. An observation $o_t$ is what the sensors actually provide, such as images, depth, force measurements, and joint encoder readings.

An observation is generally not the state:

$$o_t\sim p(o_t\mid s_t)$$

> **Reading:** Even when the true state s_t is known, the observation o_t is still generated stochastically according to the sensor model and is therefore affected by noise, occlusion, and viewpoint.

**Derivation:** The state consists of environmental variables, whereas the observation is the stochastic result of passing the state through a camera, depth sensor, or force sensor. The conditional distribution explicitly captures the fact that the same state can produce different measurements.

If a single image cannot determine velocity or hidden contacts, the model must use history:

$$z_t=E(o_{\le t},a_{<t})$$

> **Reading:** The encoder E constructs the current internal state z_t from all observations up to the present, together with the actions executed before the current time.

**Derivation:** A single frame cannot determine velocity or the state of occluded objects. Observation history provides temporal changes, while action history explains which of those changes were caused by the robot itself. z_t is a compressed representation of the available information and is not guaranteed to equal the true physical state.

$z_t$ can be understood as an internal state or belief that the model constructs from history.

## 1.2 Actions Are Not Intrinsically Defined

An action $a_t$ may be a joint position, joint velocity, torque, end-effector pose increment, gripper command, or impedance parameter. Choosing a different action interface is equivalent to choosing a different learning problem.

| Action definition | What the model must learn | Additional system dependencies |
|-|-|-|
| Joint position | Target joint configuration | Low-level position controller |
| End-effector pose increment | Local Cartesian motion | Inverse kinematics and coordinate frames |
| Torque | High-frequency feedback control | Dynamics, force sensing, and safety constraints |
| Action chunk | Short-horizon trajectory structure | Execution window and replanning mechanism |

## 1.3 Trajectories

A trajectory is written as:

$$\tau=(s_0,o_0,a_0,r_0,s_1,o_1,a_1,r_1,\ldots)$$

> **Reading:** A trajectory tau is the complete sequence that starts from the initial state and records, in temporal order, the states, observations, actions, rewards, and variables at the next time step.

**Derivation:** The environment state produces an observation, the policy selects an action based on the available information, and the environment then transitions and produces a reward. Unrolling this closed loop over time yields a trajectory.

Do not confuse $\tau$ here with the symbol for torque. A trajectory records the time series jointly produced by the agent and the environment, and it is the common unit of data used in imitation learning, reinforcement learning, world models, and evaluation.

# 2. The Second Set of Basic Objects: Policies, World Models, Values, and Planning

## 2.1 Policy

A policy learns the conditional action distribution given the context:

$$\pi_\theta(a_t\mid c_t)$$

> **Reading:** The policy parameterized by theta assigns a probability to action a_t given the current context c_t.

**Derivation:** The input to a policy is not necessarily the true state, so it is represented uniformly as context c_t. The context may include observation history, a language goal, proprioceptive state, and memory. A deterministic policy can be viewed as a special case in which all probability mass is concentrated on a single action.

The context may include observation history, a language goal, and proprioceptive state.

## 2.2 World Model

A world model learns the action-conditioned future:

$$p_\phi(s_{t+1},r_t\mid s_t,a_t)$$

> **Reading:** Given the current state and action, the world model parameterized by phi predicts the joint conditional distribution of the next state and current reward.

**Derivation:** Under the Markov assumption, once the current state and action are given, predicting the next step no longer requires earlier history. If the state is a latent state constructed by the model from history, this assumption must be validated through multi-step prediction and control experiments.

It answers, “What will happen if I do this?” rather than directly answering, “What should I do?”

## 2.3 Value Function

A value function learns the conditional expectation of future cumulative return:

$$Q^\pi(s,a)=\mathbb{E}_\pi\left[\sum_{k=0}^{\infty}\gamma^k r_{t+k}\mid s_t=s,a_t=a\right]$$

> **Reading:** If action a is executed in state s and policy pi is followed thereafter, the Q-value equals the conditional expectation of the sum of all future discounted rewards.

**Derivation:** First define the discounted return starting from the current time step, and then take the conditional expectation over all future trajectories induced by the policy and environment dynamics. The discount factor gamma controls the weight assigned to long-term rewards.

It answers, “How good is this action in the long run?”

## 2.4 Planner

A planner selects an action sequence using rules, a world model, a value function, or search:

$$a_{t:t+H}^*=\arg\max_{a_{t:t+H}}\mathbb{E}\left[\sum_{k=0}^{H}\gamma^k r_{t+k}\right]$$

> **Reading:** Among all candidate action sequences of length H plus one, select the sequence with the highest expected predicted discounted return and denote it as the optimal action sequence.

**Derivation:** Given candidate actions, the world model or true dynamics induces a distribution over future states and rewards. The planner takes the expectation of the future return and then uses arg max to select the highest-scoring candidate. Receding-horizon planning typically executes only the first short segment before observing again and replanning.

A policy can produce actions directly, whereas a planner explicitly compares candidate futures. Practical systems often use a planner to select subgoals and a policy to execute them.

| Object | Input direction | Output | Simplest question |
|-|-|-|-|
| Policy | World → action | Action distribution | What should I do now? |
| World model | State and action → future | Future distribution | What will happen if I do this? |
| Value | State or action → return | Scalar evaluation | How good is it in the long run? |
| Planning | Goal and model → sequence | Action or subgoal sequence | Which path should I take? |

# 3. Supervision Determines What a Model Can Learn

| What the data provides | Common objective | What the model learns directly |
|-|-|-|
| Expert actions | Behavior cloning | Expert conditional action distribution |
| Next state or next frame | Prediction loss | State transition or observation generation |
| Task reward | Value and policy optimization | Long-term quality of behavior |
| Success/failure labels | Outcome prediction, value learning | Success probability of a trajectory or state |
| Pairwise preferences | Reward modeling or preference optimization | Relative preferences |
| Human corrections | Corrective imitation | Recovery actions in erroneous states |
| Human videos | Representation, prediction, Latent Action | Motion and interaction structure, not robot control variables themselves |

A model cannot automatically acquire capabilities that are not constrained by its data and objective. Data containing only expert actions does not automatically provide counterfactual futures; next-frame prediction alone does not automatically define task goals; and final success labels alone do not automatically reveal which step caused a failure.

# 4. Understanding Behavior Cloning Through Maximum Likelihood

Let the expert dataset be:

$$\mathcal{D}=\{(c_i,a_i)\}_{i=1}^{N}$$

> **Reading:** Dataset D contains N demonstration samples, where the i-th sample consists of context c_i and expert action a_i.

**Derivation:** Pair the context and action at time t in each trajectory to form a sample, and then index the N samples to obtain this empirical dataset. These indices are used in the summation of the subsequent maximum-likelihood objective.

For now, temporally correlated trajectories are decomposed into supervised samples. In practice, training must still preserve episode boundaries to avoid treating adjacent frames as independent trials.

Maximum-likelihood training:

$$\theta^*=\arg\max_\theta\sum_{i=1}^{N}\log\pi_\theta(a_i\mid c_i)$$

> **Reading:** Among all possible parameter values theta, find the parameters that maximize the sum of the log-probabilities of the N expert actions under their respective contexts.

**Derivation:** If the samples are provisionally treated as being generated by the same data distribution, the likelihood of the complete dataset is the product of the conditional probabilities of the individual samples. Taking the logarithm converts this product into a sum. arg max denotes selecting the parameters that maximize this objective.

Equivalently, minimize the negative log-likelihood:

$$\mathcal{L}_{BC}=-\mathbb{E}_{(c,a)\sim\mathcal{D}}[\log\pi_\theta(a\mid c)]$$

> **Reading:** The behavior-cloning loss is the average negative log-probability of the ground-truth action under the expert data distribution. Minimizing it is equivalent to maximizing the likelihood of the expert data.

**Derivation:** Multiplying the maximization objective by negative one produces a minimization objective. Writing the empirical average in expectation form does not change the optimal parameters.

If actions are assumed to follow a Gaussian distribution with fixed variance:

$$\pi_\theta(a\mid c)=\mathcal{N}(a;\mu_\theta(c),\sigma^2I)$$

> **Reading:** Given context c, action a follows a Gaussian distribution whose mean is predicted by the network mu_theta(c) and whose covariance is fixed at sigma squared times the identity matrix.

**Derivation:** Fixing the variance of each action dimension and assuming a unimodal, isotropic conditional distribution means that the policy only needs to predict the conditional mean. This assumption simplifies training, but it is also why multimodal actions may be averaged.

The negative log-likelihood then reduces to MSE:

$$\mathcal{L}_{MSE}\propto\mathbb{E}\left[\lVert a-\mu_\theta(c)\rVert_2^2\right]$$

> **Reading:** The mean squared error loss is proportional to the expected squared Euclidean distance between the ground-truth action and the predicted mean.

**Derivation:** The Gaussian negative log-likelihood equals the squared error divided by twice the variance, plus a constant that depends only on the fixed variance. When the variance is fixed, neither the proportionality coefficient nor the constant affects the optimal mean. Therefore, minimizing the negative log-likelihood is equivalent to minimizing MSE.

Thus, MSE is not an arbitrary choice; it follows from the unimodal Gaussian assumption. When multiple correct trajectories exist, the conditional mean may not correspond to any executable trajectory.

# 5. Why Generative Action Models Emerged

If multiple correct behaviors exist under the same context, the policy must represent the complete multimodal distribution. Mainstream parameterizations include:

- **Autoregressive tokens:** Learn the conditional probability of a discrete action sequence.
- **Diffusion:** Learn the data score or denoising process from noise to actions.
- **Flow Matching:** Learn a vector field that transports a simple distribution into the action distribution.

These methods still belong to policy learning. They change how the action distribution is represented and sampled; they do not automatically provide a world model or long-term value.

# 6. The Most Critical Closed-Loop Distribution Shift in Physical AI

During training, data comes from the expert state distribution:

$$s_t\sim d_{expert}(s)$$

> **Reading:** At training time, the state at step t is drawn from the distribution of states visited by the expert policy.

**Derivation:** The expert policy continuously executes actions under the environment dynamics and visits states. The long-run frequencies of all these states constitute the distribution d_expert. Writing this as a sampling relation emphasizes that training samples come from states visited by the expert rather than from uniform coverage of the entire state space.

This distribution is jointly induced by expert actions and environment dynamics, and it is generally concentrated near successful trajectories.

During deployment, states are produced by the model’s previous actions:

$$s_t\sim d_{\pi_\theta}(s)$$

> **Reading:** At deployment time, the state at step t is drawn from the state distribution induced by the current learned policy theta itself.

**Derivation:** During deployment, a_t is applied to the environment transition, after which the policy continues to produce subsequent actions. Repeated iteration yields d_pi_theta. Because the actions come from the current policy rather than the expert, even small per-step errors can gradually alter the state distribution in the closed loop.

As long as the learned policy differs even slightly from the expert, the state distributions they visit may gradually diverge over time. This is closed-loop distribution shift.

Even if the single-step error is small, an action that drives the environment into a region sparsely represented in the expert data will make subsequent predictions worse. This is why behavior cloning is more hazardous than ordinary supervised learning.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBFW1N0YXRlcyBpbiBFeHBlcnQgRGF0YV0gLS0+IFRbUG9saWN5IFRyYWluaW5nXQogICAgVCAtLT4gUFtEZXBsb3ltZW50IEV4ZWN1dGlvbl0KICAgIFAgLS0+IFNbUG9saWN5LUluZHVjZWQgU3RhdGUgRGlzdHJpYnV0aW9uXQogICAgUyAtLT4gT1tPdXQtb2YtRGlzdHJpYnV0aW9uIE9ic2VydmF0aW9ucyBhbmQgRmFpbHVyZXNdCiAgICBPIC0tPiBEW0NvcnJlY3Rpb25zLCBSZXdhcmRzLCBvciBOZXcgRGF0YV0KICAgIEQgLS0+IFQ=" />

Different approaches address closed-loop shift through different mechanisms: VLAs expand data coverage; experience-based learning collects the system’s own failures; world models support replanning; hierarchical policies shorten low-level tasks; controllers suppress execution errors; and data engines feed failures back into the training set.

# 7. A Two-Dimensional Toy Task: How Different Approaches Describe the Same Problem

A robot must travel from a starting point to a goal while avoiding an obstacle. It can go around either the left or the right side.

| Approach | What it learns or computes | Where it may fail |
|-|-|-|
| Behavior cloning | Action distribution of expert trajectories | MSE averages the left and right paths into the obstacle |
| Generative policy | Two action modes, left and right | Lacks long-horizon validation after sampling a mode |
| World model | Future position after each action | The model has not seen collision regions |
| Value learning | Probability of reaching the goal for candidate states or actions | Overestimates the value of out-of-distribution actions |
| Planner | Searches candidate paths on the left and right | Search cost or model error |
| Controller | Tracks the selected trajectory | Latency, slipping, or saturation causes deviation |

This illustrates that the different approaches are not competing over the same equation. Instead, they address different parts of the same closed loop.

# 7.1 Minimal Reproducible Experiment

Generate two expert trajectories around an obstacle in a two-dimensional grid, with half going left and half going right. First use fixed-variance Gaussian regression, then a generative policy capable of representing a bimodal distribution, and finally compare them with a short-horizon planner equipped with collision detection.

1. Include only expert trajectories in the training set, and perturb the starting point during testing.
2. Plot the predicted mean actions, sampled trajectories, and obstacle location.
3. Record the collision rate, success rate, path length, and inference time.
4. Gradually increase the perturbation and plot performance as a function of distribution shift.

This experiment places mean actions, multimodal policies, model predictions, and control tracking within the same closed loop, allowing readers to see exactly which type of failure each approach addresses.

# 8. How to Read Any Physical AI Paper

1. **Observations:** Which variables does the model actually observe? What is the history length?
2. **Actions:** What are the output interface, units, frequency, and action chunk?
3. **Supervision:** Does it use actions, futures, rewards, preferences, or corrections?
4. **Learning target:** Is it learning a policy, world model, value function, representation, or control residual?
5. **Training and inference:** Which quantities are known during training but unavailable during inference?
6. **Closed loop:** How does the system observe again, correct errors, and recover?
7. **Evidence:** How are tasks held out? How are failures categorized? Are confidence intervals reported?
8. **Physical boundaries:** Are latency, contact, friction, calibration, and safety controlled?

# 9. Exercises

1. Read $\pi(a\mid o,g)$, $p(s'\mid s,a)$, and $Q(s,a)$ aloud in one sentence each.
2. For a grasping task, list the state, observations, actions, rewards, and trajectory.
3. Derive MSE from the fixed-variance Gaussian assumption.
4. Explain why Diffusion Policy is still a policy rather than a world model.
5. Design an experiment that distinguishes policy errors from controller errors.
6. Select a VLA paper and complete a one-page review using the eight questions in Section 8.

# Completion Criteria

Readers do not need to memorize every model name, but after seeing a formula or architecture, they must be able to determine which object it learns, where its supervision comes from, how inference occurs, and how that object enters a real-world closed loop through the control system. Once this standard is met, readers can explore any technical approach without being misled by the terminology used in individual papers.
