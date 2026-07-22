---
title: "E2｜Latent Action and Inverse Dynamics: Discovering Behavior Variables from State Changes"
sourceToken: LfjkdaRWyo0xIsxTN1Mc4ESKnCc
sourceRevision: 13
license: Apache-2.0
translationSource: "route-e/05-e2-latent-action-与逆动力学-从状态变化发现行为变量.md"
translationSourceHash: e444bece78069a194f18498e855e2ee034548f6edfba1acd244ccfdf80af43f9
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/LfjkdaRWyo0xIsxTN1Mc4ESKnCc) · Source Revision 13

::: tip 💡
**Mechanism lesson:** Human videos do not contain robot actions. Latent Action seeks to infer a predictable, discretizable, and transferable behavior variable from changes between preceding and subsequent states, then ground it in real control using a small amount of robot data.
:::

# Learning Objectives

After completing this lesson, you should be able to formulate inverse and forward dynamics; understand the non-identifiability of latent actions; derive a variational latent action objective; distinguish visual changes from controllable changes; and design cross-embodiment adapters and decisive ablations.

# 1. Inverse Dynamics

If states and actions are observable:

$$p_\psi(a_t\mid s_t,s_{t+1})$$

> **Interpretation:** Given the current state and next state, the inverse dynamics model produces a conditional distribution over the actions that caused the transition.

**Derivation:** Forward dynamics predicts the next state from the current state and action. Reversing the direction using Bayes' rule yields a model that infers the action from a state transition. Because multiple actions may produce the same outcome, the output should be a distribution rather than a unique label.

Inverse dynamics answers, “What action caused this change?” It can be trained with supervision on robot data and then used to generate pseudo-actions for videos without action labels.

The problem is that the same state change may be caused by multiple actions, while observations may omit forces and hidden states.

# 2. Latent Action

Introduce a latent variable:

$$z_t\sim q_\psi(\cdot\mid o_t,o_{t+1})$$

> **Interpretation:** The latent action z_t is sampled from an inference distribution conditioned on adjacent observations.

**Derivation:** When the true action is unobserved, define z_t as the hidden factor that explains the change in observations. The inference model estimates it from the frames before and after the change. However, z_t may also encode camera motion, lighting, or other uncontrollable factors, so additional constraints are required.

Forward model:

$$p_\phi(o_{t+1}\mid o_t,z_t)$$

> **Interpretation:** The forward model models the next observation given the current observation and latent action.

**Derivation:** If z_t truly represents the behavior that causes the change, then together with o_t it should be sufficient to predict o\_{t+1}. This constraint ensures that the latent contains information about the change, but by itself it does not guarantee equivalence to an executable robot action.

The training objective can be written as:

$$\mathcal L=-\mathbb E_{z_t\sim q_\psi}\!\left[\log p_\phi(o_{t+1}\mid o_t,z_t)\right]+\beta D_{\mathrm{KL}}\!\left(q_\psi(z_t\mid o_t,o_{t+1})\,\Vert\,p(z_t)\right)$$

> **Interpretation:** The total loss consists of the negative log-likelihood of the next observation and a KL regularizer measuring the deviation of the posterior from the prior, with beta controlling the trade-off between them.

**Derivation:** This is the negative ELBO of a conditional variational autoencoder objective. The first term requires the latent to explain state changes, while the second limits encoding capacity and makes the space sampleable. If beta is too large, posterior collapse may occur; if it is too small, the model may memorize irrelevant pixel-level details.

The reconstruction term forces the latent to explain changes, while the KL term limits encoding capacity and creates a sampleable space.

![Course Whiteboard](/media/MJzXw8p6YhX4hCbxuibcKepinZg.jpg)

::: tip 💡<p><b>Interactive Validation｜Latent Action, Behavior Tokens, and the Cross-Embodiment Representation Lab</b></p><p>Vary object alignment, action labels, embodiment differences, and coordinate normalization to observe whether shared behavior variables can transfer across robots.</p><p><a href="https://archebase.feishuapp.com/app/app_17ae9vkbaze">Latent Action, Behavior Tokens, and the Cross-Embodiment Representation Lab</a></p><p><button action="OpenLink" src="https://archebase.feishuapp.com/app/app_17ae9vkbaze">Open Interactive Lab</button></p><bookmark name="Latent Action, Behavior Token, and Cross-Embodiment Representation Lab" href="https://archebase.feishuapp.com/app/app_17ae9vkbaze"></bookmark>:::

# 3. Non-Identifiability

If an arbitrary invertible transformation $z'=g(z)$ is applied to the latent while the decoder is adjusted accordingly, observation reconstruction can remain unchanged. Therefore, latent values have no intrinsic semantics.

Additional constraints are needed:

- A discrete codebook.
- Object and event supervision.
- Temporal continuity and sparsity.
- Alignment with robot actions.
- Cross-view consistency.
- Task outcomes and controllability.

# 4. Controllable and Uncontrollable Changes

Changes in video include camera motion, lighting, other people, and the background. Latent Action should preferentially encode changes controllable by the agent. Robot action data or a controllability objective can be used:

$$I(z_t;o_{t+1}\mid o_t)$$

> **Interpretation:** The conditional mutual information between the latent action and the next observation given the current observation.

**Derivation:** High mutual information means that z_t reduces uncertainty about future observations. However, camera motion can also predict future pixels, so robot action interventions, object-centric representations, or controllability labels are still needed to separate agent behavior from external changes.

However, high mutual information may still encode camera motion, requiring object-centric representations and action interventions.

# 5. Discrete and Continuous Latents

| Type | Advantages | Risks |
|-|-|-|
| Discrete tokens | Well suited to sequence models and skill composition | Quantization and codebook collapse |
| Continuous vectors | Represent fine-grained motion | Difficult to interpret and transfer across embodiments |
| Hybrid | Event tokens + continuous parameters | Complex training |

Manipulation tasks are often well suited to hybrid representations: “grasp” is a discrete event, while approach direction and velocity are continuous parameters.

# 6. From Latents to Robot Actions

Robot adapter:

$$p_\omega(a_t^{\mathrm{robot}}\mid o_t^{\mathrm{robot}},z_t,e)$$

> **Interpretation:** The robot action adapter models real robot actions given the robot’s current observation, the shared latent action, and the embodiment identifier.

**Derivation:** The same function requires different joints and velocities on different robots, so the adapter must read both the embodiment state and identifier e. Only cross-robot experiments that keep the shared z fixed and replace only the adapter can verify whether the latent has reusable functional semantics.

$e$ denotes the embodiment. The adapter is trained using a small amount of paired robot data, allowing the shared latent to be decoded through different control interfaces.

The shared latent should not contain specific joint values; it should represent object-relative changes, events, or affordances.

# 7. Pseudo-Action Pretraining

1. Train an inverse model on robot data.
2. Predict pseudo-actions or latents for human/Internet videos.
3. Pretrain a behavior sequence model at video scale.
4. Align with real actions using robot data.
5. Validate in closed loop.

Pseudo-label errors propagate systematically, so confidence scores must be retained and the method must be compared against a baseline without pseudo-actions.

# 8. Relationship to World-Action Models

A World-Action Model jointly models state changes and action variables and can be used for video prediction, test-time memory, and robot policies. The key question is whether the latent can both explain human videos and improve robot actions.

# 9. Minimal Experiment: Does Latent Action Have Controllable Behavioral Semantics?

Train four models on the same object-manipulation data: a video autoencoder, a latent action model, a robot inverse-dynamics pseudo-action model, and a model supervised with real actions. Keep the visual backbone, number of videos, robot action data, latent dimensionality, and policy capacity fixed.

Sequentially conduct temporal-shuffling, camera-motion, background-change, object-centric ablation, latent-permutation, and cross-robot adapter experiments. Report next-observation prediction, controllable-change probes, robot action decoding, few-shot adapter curves, transfer to unseen embodiments, and real closed-loop success rates.

1. Temporal shuffling: does the latent still work?
2. Camera-motion control: does it encode uncontrollable background changes?
3. Object-centric ablation.
4. Comparison of discrete, continuous, and hybrid latents.
5. Sample efficiency of an adapter trained on a small amount of robot data.
6. Closed-loop success rather than video reconstruction alone.

# 10. Exercises

1. Explain the multimodality of inverse dynamics.
2. Derive the latent action ELBO.
3. Construct a non-identifiable transformation of the latent.
4. Design a controllability objective.
5. Define a hybrid discrete-continuous latent for grasping.
6. Explain why WAM-TTT requires a human-robot outer loop.

# 11. Major Failure Modes

| Failure | Symptom | Diagnosis and Mitigation |
|-|-|-|
| Posterior collapse | z is independent of the observations, and the forward model ignores the latent | KL curves, latent permutation, free bits, or reducing beta |
| Memorizing uncontrollable changes | z mainly encodes camera motion, lighting, or background motion | Camera interventions, object-centric inputs, and mutual information with robot actions |
| Non-identifiability | Different training seeds produce entirely different coordinates that cannot be reused across models | Constraints based on events, actions, outcomes, and cross-view consistency |
| Multimodal inverse dynamics | Pseudo-actions are overconfident and assign a single incorrect label to the same transition | Distributional outputs, multimodal models, and confidence filtering |
| Amplification of pseudo-label errors | Large-scale video pretraining embeds IDM biases into the policy | Retain confidence scores, use a baseline without pseudo-actions, and calibrate with a small amount of real action data |
| Adapter memorizes the dataset | Decoding works well on the training robot but fails after changing the embodiment or state | Held-out embodiments, state conditioning, and parameter-sharing ablations |
| Good reconstruction but poor control | Video metrics improve while the closed-loop success rate remains unchanged or decreases | Fix the robot data and controller, and directly report task-level gains |

# 12. Paper Facts, Author Interpretations, and Course Assessments

| Work | Paper Facts | Author Interpretation | Course Assessment |
|-|-|-|-|
| VPT | Trains an inverse dynamics model on a small amount of Minecraft data with action labels, then predicts pseudo-actions for large-scale videos and pretrains a policy | Action labels can be extended to unlabeled videos using an inverse model | This is clear evidence for the pseudo-action approach, but it relies on the same game embodiment and observable transitions; transfer across real robots is more difficult |
| Genie | Learns a latent action model and an interactive generative environment from Internet videos without real action labels | Controllable changes in videos can form discrete latent actions | Interactive video generation demonstrates that the latent can control visual futures, but does not automatically prove that it can be decoded into real robot actions |
| XSkill | Discovers cross-embodiment skill representations from human and robot videos and uses them for downstream imitation | Functional-level skills can connect different bodies | Object states, event boundaries, and held-out-adapter experiments are needed to demonstrate semantics rather than merely embedding alignment |
| WAM-TTT | Side information from human videos updates fast memory, while robot action tasks train the update rule | A shared world-action structure can support test-time adaptation | The key questions are whether the outer loop makes the latent useful for robot control and whether erroneous context can be rejected or rolled back |

<bookmark name="Video PreTraining (VPT): Learning to Act by Watching Unlabeled Online Videos" href="https://arxiv.org/abs/2206.11795"></bookmark>

<bookmark name="Genie: Generative Interactive Environments" href="https://arxiv.org/abs/2402.15391"></bookmark>

<bookmark name="XSkill: Cross Embodiment Skill Discovery" href="https://arxiv.org/abs/2307.09955"></bookmark>

# 13. Cross-Reading

[Human Videos Do Not Have Velocity Labels](/en/route-e/02-01c-人类视频没有速度标签-机器人如何学习运动)

[E1｜Video Motion and Object-Centric Representations](/en/route-e/03-e1-视频运动与对象中心表征-没有动作标签时如何读取行为)

[E3｜Behavior Tokenizer](/en/route-e/06-e3-behavior-tokenizer-如何把连续行为变成可组合的语义单元)

[B4｜Video World Models and Visual Planning](/en/route-b/05-b4-视频世界模型与视觉规划-生成未来画面怎样帮助机器人行动)
