---
title: "A0｜VLA and Direct Policy Learning: From Conditional Imitation to Robotic Foundation Models"
sourceToken: Sijed32IwosrevxLEe1c7MnDnNZ
sourceRevision: 16
license: Apache-2.0
translationSource: "route-a/01-a0-vla-与直接策略学习-从条件模仿到机器人基础模型.md"
translationSourceHash: b6e1c0dcc87a76f41a6e23797489866b4b7449027b3435e4eb1fa129140ca81a
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/Sijed32IwosrevxLEe1c7MnDnNZ) · Source Revision 16

::: tip 💡
**Course overview:** This lesson develops the VLA pathway from first principles rather than organizing it around a particular company or individual paper. RT, Open X, Octo, OpenVLA, GR00T, and others constitute the mainstream lineage, while π0, FAST, π0.5, π0.6\*, and π0.7 are presented as a continuous series of engineering case studies in the Paper Lab at the end of the lesson.
:::

# Learning Objectives

After completing this lesson, you should be able to explain the probabilistic objective of direct policy learning; distinguish among VLMs, VLAs, action experts, and controllers; compare regression, autoregressive tokens, Diffusion, and Flow Matching; understand multi-robot co-training and post-training; determine which capabilities VLAs do and do not possess; and place the π series within the VLA pathway rather than equating it with Physical AI as a whole.

# 1. The Core Assumption of the Direct Policy Pathway

Direct policy learning bypasses explicit planning and explicit system identification, directly learning:

$$\pi_\theta(a_{t:t+H-1}\mid o_{\le t},q_t,l)$$

> **Reading:** The policy parameterized by theta assigns a conditional probability to a future H-step action chunk based on the observation history up to the current time, the current proprioceptive state, and the language goal.

**Derivation:** Treat the future H-step continuous action sequence as a random vector. A direct policy conditions this joint action distribution on multimodal context.

This is read as: “Given the observation history, proprioceptive state, and language goal, generate a future segment of actions.” It compresses perception, task conditioning, and action selection into a single conditional distribution.

Its advantages are direct inference and the ability to leverage large-scale demonstrations. Its limitation is that the model is primarily constrained by the data distribution and may not be able to explicitly answer questions about counterfactuals, long-term value, or dynamics parameters.

# 2. From Behavior Cloning to VLA

## 2.1 Behavior Cloning

Given robot data:

$$\mathcal D_{robot}=\{(o_{\le t},q_t,l,a_{t:t+H-1})\}$$

> **Reading:** The robot dataset consists of observation histories, proprioceptive states, language tasks, and the corresponding future H-step action chunks.

**Derivation:** Pair each robot demonstration's observation history, proprioceptive state, task, and future action chunk at time t into a supervised sample. The collection of all such samples constitutes the robot training dataset.

A real dataset should also retain episode identifiers, timestamps, coordinate frames, control frequencies, and embodiment metadata; only the minimal mathematical fields required for training are shown here.

Behavior cloning minimizes:

$$\mathcal L_{\mathrm{BC}}=-\mathbb E_{(o,q,l,A)\sim\mathcal D_{robot}}[\log\pi_\theta(A\mid o,q,l)]$$

> **Reading:** The behavior cloning loss is the average negative log conditional probability of the ground-truth action chunks over the robot dataset.

**Derivation:** Maximize the conditional likelihood of all demonstrated action chunks; negating it yields the negative log-likelihood objective to be minimized.

## 2.2 Vision-Language Conditioning

A VLA introduces vision-language representations pretrained on internet-scale data into the policy's conditioning context. The VLM provides object, scene, and linguistic semantics, while the action module converts these representations into continuous control.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBJW011bHRpLXZpZXcgaW1hZ2VzXSAtLT4gVltWaXNpb24gZW5jb2Rlcl0KICAgIExbTGFuZ3VhZ2UgaW5zdHJ1Y3Rpb25dIC0tPiBUW1RleHQgZW5jb2Rlcl0KICAgIFYgLS0+IE1bTXVsdGltb2RhbCBiYWNrYm9uZV0KICAgIFQgLS0+IE0KICAgIFFbUm9ib3QgcHJvcHJpb2NlcHRpdmUgc3RhdGVdIC0tPiBBW0FjdGlvbiBtb2R1bGVdCiAgICBNIC0tPiBBCiAgICBBIC0tPiBQW0FjdGlvbiBkaXN0cmlidXRpb24gb3IgYWN0aW9uIGNodW5rXQogICAgUCAtLT4gQ1tSb2JvdCBjb250cm9sbGVyXQogICAgQyAtLT4gV1tSZWFsIHdvcmxkXQogICAgVyAtLT4gSQogICAgVyAtLT4gUQ==" />

## 2.3 A VLM Is Not a VLA

| Model | Training target | Output |
|-|-|-|
| VLM | Semantic relationships between images and text | Text tokens or multimodal representations |
| VLA | Action distribution conditioned on multimodal context | Action tokens, continuous actions, or trajectories |
| Controller | Feedback error and physical execution | Motor commands or torques |

# 3. How to Represent an Action Distribution

## 3.1 Point Regression

$$\hat a=\mu_\theta(c)$$

> **Reading:** Given context c, the model outputs a single predicted action, denoted by the conditional mean mu_theta(c).

**Derivation:** The negative log-likelihood of a fixed-variance Gaussian is equivalent to MSE, and the optimal deterministic prediction under MSE is the conditional mean.

It is fast, but the fixed-variance Gaussian assumption can average across multiple valid actions.

## 3.2 Autoregressive Action Tokens

$$p(y_{1:M}\mid c)=\prod_{m=1}^{M}p(y_m\mid y_{<m},c)$$

> **Reading:** The probability of the complete action-token sequence equals the product of the probability of each token conditioned on the preceding tokens and the context.

**Derivation:** Expand the joint distribution using the probability chain rule; during training, apply cross-entropy to each token.

The actions are first converted into a discrete sequence by a tokenizer, allowing the reuse of language-model cross-entropy training. However, this approach introduces quantization error and serial decoding latency.

## 3.3 Diffusion

The model learns a denoising direction or score at different noise levels and produces continuous actions through multi-step sampling. It is well suited to multimodal trajectories but incurs greater inference cost.

## 3.4 Flow Matching

The model learns a continuous-time vector field:

$$\frac{dx}{dt}=v_\theta(x,t,c)$$

> **Reading:** The rate of change of the generated state x with respect to flow time t equals the velocity field predicted by the model given the current state, time, and context.

**Derivation:** Flow Matching learns a vector field that transports a simple noise distribution to the conditional action distribution. During inference, this ordinary differential equation is integrated.

Starting from a simple noise distribution, conditional action samples are obtained through integration.

| Representation | Learning target | Inference | Best suited for |
|-|-|-|-|
| Regression | Conditional mean | Single forward pass | Approximately unimodal distributions and low latency |
| Action Tokens | Discrete-sequence probability | Token by token | Unified pretraining with a VLM |
| Diffusion | Score or noise | Multi-step denoising | Multimodal continuous actions |
| Flow | Probability-flow vector field | ODE integration | Continuous action chunks |

# 4. Why Action Chunks Became Mainstream

A single-step policy predicts only $a_t$ at a time, making it prone to high-frequency jitter and unable to express short-term coordination among grasping, rotation, and release. An action-chunk policy directly generates:

$$A_t=(a_t,a_{t+1},\ldots,a_{t+H-1})$$

> **Reading:** The action chunk A_t at time t consists of H consecutive actions beginning with the current action.

**Derivation:** Starting with the current action a_t, collect H consecutive actions in temporal order and concatenate them into a joint variable to obtain the action chunk A_t.

The length H selects a temporal scale: a longer action chunk increases short-term consistency, but it also extends open-loop execution and delays feedback.

Action chunks can learn short-horizon trajectory structure and reduce inference frequency, but they increase open-loop duration. In real deployments, the system typically executes only the first few steps of an action chunk and then generates a new one from updated observations.

# 5. Multi-Robot and Multi-Task Co-Training

A general-purpose VLA aims to use data from different robots, cameras, tasks, and control frequencies. Unified training must address at least:

- Different action dimensions and joint semantics.
- Different coordinate frames, units, and normalization schemes.
- Different camera configurations and visual distributions.
- Different control frequencies and action-chunk durations.
- Different levels of data quality, teleoperation styles, and failure rates.

“Padding tensors to the same length” does not mean that the actions are semantically aligned. A model may use an embodiment ID to learn multiple local policies, or it may learn transferable object-centric structure; dedicated experiments are required to distinguish between these cases.

# 6. Pretraining, Co-Training, and Post-Training

| Stage | Primary data | Primary role |
|-|-|-|
| Vision-language pretraining | Internet-scale image-text data | Semantic and visual representations |
| Robot pretraining/co-training | Multi-task, multi-robot trajectories | Broad action capabilities and conditional alignment |
| Task post-training | High-quality target-scenario data | Stability, speed, and behavioral style |
| Experience learning | Autonomous successes, failures, and corrections | Correcting the deployment distribution and improving success rates |

Scaling increases capability coverage, post-training shapes deployment behavior, and experience learning corrects the state distribution induced by the policy itself. These three effects cannot be reduced to simply “more data.”

# 7. What a VLA Can Learn—and What It Does Not Learn Automatically

| May learn | Cannot be guaranteed by architecture alone |
|-|-|
| Action patterns conditioned on objects and tasks | An explicit causal model of physics |
| Shared visual-action representations across tasks | Long-term optimality |
| Short-horizon action coordination and feedback correction | Recovery from out-of-distribution failures |
| Language-conditioned control of actions | Zero-shot transfer to arbitrary robots |
| Manipulation priors that recur throughout the data | Safety, contact stability, and controller tracking |

These gaps connect to other pathways: counterfactual prediction connects to world models, long-term quality connects to value learning, task decomposition connects to hierarchical planning, cross-embodiment transfer connects to data representation, and real-world execution connects to dynamics and control.

# 8. Placing the π Series Back Within the VLA Pathway

| Stage | What it adds to the VLA pathway | What it should not be mistaken for |
|-|-|-|
| π0 | VLM Backbone and Flow Action Expert | A complete Physical AI system |
| FAST | Action tokenization and unified cross-entropy pretraining | Proof that discrete actions are necessarily superior to continuous actions |
| π0.5 | Heterogeneous co-training, open-world tasks, and hierarchical conditioning | Generalization emerging automatically from scale alone |
| π0.6\* / RECAP | Improvement using deployment experience and Advantage conditioning | A solution to general-purpose online RL |
| π0.7 | Diverse prompts, visual subgoals, and steerability | An explicit world model equivalent to a complete planner |

The π series constitutes a continuous set of engineering case studies within the VLA pathway. FAST connects to action representation, RECAP connects to value learning, and π0.7 connects to world models and hierarchical planning, but their primary classification remains VLA.

# 9. Training and Inference Must Be Analyzed Separately

| Stage | Available information | Must produce |
|-|-|-|
| Behavior-cloning training | Observations, language, proprioception, and ground-truth actions | Action likelihood or generative target |
| Generative-policy training | Ground-truth actions, noise, and time | Denoising direction or vector field |
| Inference | Observations, language, proprioception, and random noise | Complete action chunk |
| Execution | Generated actions and control cycle | Physical robot motion |

Ground-truth actions are available during training but not during deployment. If these two settings are not distinguished when reading a paper, it is easy to misunderstand the network inputs and the sources of supervision.

# 10. Decisive Evaluations for VLAs

1. **Task holdout:** Novel task compositions rather than merely novel backgrounds.
2. **Object holdout:** Variations in shape, material, and affordances.
3. **Embodiment holdout:** Changes in control interfaces and kinematics.
4. **Closed-loop recovery:** Whether the system recovers after deliberate perturbations.
5. **Multimodal tasks:** Whether the policy covers multiple valid action modes.
6. **Latency and control:** Action-generation latency, smoothness, and collision rate.
7. **Equal-data ablation:** Separating gains from model mechanisms from gains due to data scale.

## 10.1 Minimal Reproducible Experiment

Using the same two-dimensional obstacle-avoidance dataset, hold the number of training samples and network capacity fixed, and separately train point-regression, action-token, and Flow Matching policies.

1. Report offline action error, but do not treat it as the final conclusion.
2. Run closed-loop execution and record goal-reaching rate, collision rate, mode coverage, and inference latency.
3. Introduce variations in the starting point, obstacle positions, and language expressions, and measure out-of-distribution degradation separately.
4. Change only the executed length of each action chunk and observe the trade-off between smoothness and recovery speed.

This experiment requires the reader to translate the claim that “one action representation is more powerful” into a falsifiable closed-loop claim.

# 11. Exercises

1. Draw the boundaries among the VLM, VLA, Action Expert, and low-level controller.
2. Compare regression, Tokens, Diffusion, and Flow on a bimodal obstacle-avoidance task.
3. Define an action schema and embodiment metadata for cross-robot data.
4. Explain why action chunks simultaneously improve smoothness and reduce the frequency of closed-loop correction.
5. Explain π0.6\* once from the VLA pathway and once from the value-learning pathway.
6. Design an intervention experiment that can verify that a VLA uses language conditioning rather than merely recognizing the scene.

# Paper Lab

[The Mainstream VLA Lineage: RT, Open X, Octo, OpenVLA, GR00T, and Gemini Robotics](/en/route-a/03-a2-主流-vla-谱系-rt-open-x-octo-openvla-gr00t-与-gemini-robotics)

[An In-Depth Study of the π0 Architecture](/en/route-a/04-a3-1-π0-架构-视觉语言模型如何接上连续机器人控制)

[FAST and Action Representation](/en/route-a/02-a1-动作表示与生成式策略-从连续控制到-fast-tokenizer)

[π0.5 and Open-World Generalization](/en/route-a/05-a3-3-π0-5-开放世界泛化是如何被训练出来的)

[π0.6\*, RECAP, and Experience Learning](/en/route-a/06-a3-4-π0-6-recap-机器人如何从成功-失败和纠正中改进)

[π0.7 and Steerability](/en/route-a/07-a3-5-π0-7-从通用策略到可操控的机器人基础模型)
