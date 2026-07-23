---
title: "B7｜4D World States and World Action Models: From Geometric Prediction to Executable Futures"
sourceToken: Ywecd7gKho7N9ax85g5ccwYfnVg
sourceRevision: 17
license: Apache-2.0
translationSource: "route-b/08-b7-4d-世界状态与-world-action-models-从几何预测到可执行未来.md"
translationSourceHash: ff6ff5962710330057d014fced61b590785fd167306133e724e1c056b92228f4
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/Ywecd7gKho7N9ax85g5ccwYfnVg) · Source Revision 17

::: tip 💡
**Frontier Mechanisms Course:** This lesson advances from “generating a plausible-looking video” to “jointly predicting actions, future observations, and time-varying 3D structure.” The goal is not to chase the WAM label, but to determine whether a model has learned visual correlations, geometric constraints, action consequences, or dynamics sufficient for deployment in a real-robot closed loop.
:::

# Learning Objectives and Scope Boundaries

After completing this lesson, readers should be able to distinguish among action-conditioned video models, joint World Action Models, 4D geometric world models, physical world models, and controllers; formulate the joint distribution and training objective of a WAM; explain the key designs of WAM4D and X-WAM; and design closed-loop experiments that test imagination–action consistency.

**Prerequisites:** Readers are advised to complete B1 on state spaces and latent dynamics, B2 on model-based planning, B4 on video world models, and B6 on the intellectual lineage of modern world models. Familiarity with conditional probability, diffusion or Flow Matching, camera geometry, depth maps, and Action Chunks is required.

**Scope boundaries:** In this lesson, 4D refers to 3D space changing over time—that is, 3D + time. It is not a fourth spatial dimension, nor does it automatically include mass, friction, contact forces, stiffness, actuator dynamics, or material deformation. 4D geometric consistency is an important requirement for physical modeling, but it is not sufficient for complete physical modeling.

# From B6 to B7: Four Modern Approaches Converge Here

B6 established the conceptual coordinates: decision world models provide interfaces for planning and value estimation; JEPA provides predictive representations that do not need to reconstruct every pixel; spatial intelligence requires objects, geometry, and viewpoints to persist in a 3D world; and generative simulators provide high-capacity, action-conditioned futures. The 4D-WAM studied in B7 is where these capabilities begin to be integrated into a single system.

| Upstream approach | Capability contributed to 4D-WAM | Audit question in this lesson |
|-|-|-|
| Decision latent models | Action interventions, rollouts, rewards/value, and planning interfaces | Is the future predicted by the joint model actually used to select actions? |
| JEPA predictive representations | Abstract, low-redundancy latent representations suitable for multistep prediction | Does compression preserve contact points, clearances, and control-critical details? |
| Spatial intelligence | Persistent objects, cross-view geometry, and time-varying 3D states | Does 4D consistency withstand occlusion, calibration perturbations, and long-horizon drift? |
| Generative simulators | High-capacity future generation, multimodal conditioning, and candidate worlds | Does visual realism correspond to action causality and real physical consequences? |

Therefore, a WAM is not “a video generation model with an additional action head,” and 4D is not “video with added depth.” The real research questions are whether world tokens and action tokens share information through valid causal pathways; whether spatial supervision improves control-relevant representations; whether actions can be produced with low latency before world generation is complete; and whether world prediction, action generation, and real execution remain consistent.

# 1. What Exactly Does a World Action Model Jointly Model?

A WAM is more than a model that “has both a video head and an action head.” Its core purpose is to enable information exchange between future world representations and executable actions within the same conditional model, allowing it to answer both “What will this action sequence cause?” and “What actions should be taken to reach this future?”

## 1.1 The Joint Probability Distribution

$$p_\theta(o_{t+1:t+H},a_{t:t+H-1}\mid h_t,g)$$

> **Interpretation:** Given the history h_t up to the current time and task condition g, the model assigns a joint probability to observations and Action Chunks over the next H steps.

**Derivation:** If future observations and actions arise from the same latent interaction process, they cannot be treated merely as two unrelated supervision heads. Joint modeling allows action tokens to constrain the future world and allows future world representations to constrain action generation in return.

The joint distribution can be factorized with actions first:

$$p_\theta(a_{t:t+H-1}\mid h_t,g)\,p_\theta(o_{t+1:t+H}\mid h_t,g,a_{t:t+H-1})$$

> **Interpretation:** First generate actions from the history and goal, then predict future observations conditioned on those actions.

It can also be factorized with the future first:

$$p_\theta(o_{t+1:t+H}\mid h_t,g)\,p_\theta(a_{t:t+H-1}\mid h_t,g,o_{t+1:t+H})$$

> **Interpretation:** First represent a possible or desired future, then use an inverse-dynamics-style action head to recover the actions that realize that future.

These two factorizations correspond to different generation orders and control interfaces. The real issue to examine is not which term a paper uses, but whether a trainable, intervenable, and evaluable consistency constraint exists between actions and futures.

## 1.2 “Plausible Predictions” Do Not Imply “Correct Actions”

A video loss may reward texture, background, and average motion trends, whereas an action loss requires control signals to be correct in the robot coordinate frame, timing, and execution frequency. Sharing representations may help both objectives, but it may also produce gradient conflicts. BadWAM further demonstrates that even when a predicted future appears plausible, the actions may still exhibit world–action drift under perturbations. The minimum unit of evidence for a WAM must therefore include all three elements—actions, imagined futures, and real execution outcomes—rather than video quality alone.

# 2. A 4D Representation Is Not a Single Format, but a Set of Design Choices

“4D” can be represented in different spaces. The choice of representation determines what the model can perceive, how losses are defined, how expensive inference is, and whether a planner can directly access collision and reachability information.

| Representation | Information preserved | Primary advantage | Critical gap |
|-|-|-|-|
| Single-view RGB video | Appearance and 2D motion | Can reuse large-scale video priors | Depth, occluded structure, and scale are ambiguous |
| Multi-view RGB | Cross-view appearance constraints | Reduces single-view ambiguity | Geometry remains implicit, and view synchronization requirements are stringent |
| RGB-D / depth sequences | Per-frame surface distance | Supports reprojection and spatial-error computation | Occluded regions, transparent or reflective objects, and sensor noise remain difficult |
| Point clouds and Scene Flow | 3D positions and motion fields | Suitable for analyzing object motion and contact neighborhoods | Point correspondence, topology changes, and long-term accumulated error are significant |
| Occupancy / SDF | Occupied space, free space, or implicit surfaces | Convenient for collision checking and planning | High-resolution decoding is expensive, and semantics and dynamics may remain insufficient |
| Dynamic NeRF / 4D Gaussian | Time-varying radiance fields under continuous viewpoints | High-quality novel-view synthesis | Weak support for online updates, action causality, and real-time control interfaces |
| Object-centric state | Object poses, velocities, relations, and events | Interpretable and suitable for task planning | Object discovery and nonrigid interactions are easily distorted |
| Spatial Register Tokens | Compressed geometric supervision and spatial priors | Avoids dense 4D decoding during execution | Ablations are required to verify whether spatial information sufficiently enters the action representation |

Therefore, 4D-WAMs should not be classified solely by “whether they output depth.” Three more important questions are whether geometric information is used during training or inference; whether geometry is densely decoded or represented by compressed tokens; and whether the geometric branch actually improves action success rather than merely improving offline reconstruction metrics.

# 3. From Video Priors to Joint Action and Geometry Models

Modern WAMs often begin with a pretrained video diffusion Transformer or video generation model because video models have already absorbed visual priors concerning object motion, occlusion, and appearance changes before and after contact. Robotics data then provide actions, proprioceptive states, task conditions, and geometric supervision.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCkhbSGlzdG9yaWNhbCBtdWx0aS12aWV3IG9ic2VydmF0aW9ucyBhbmQgcHJvcHJpb2NlcHRpdmUgc3RhdGVzXSAtLT4gRVtWaWRlby1wcmlvciBlbmNvZGVyIC8gRGlUXQpHW0xhbmd1YWdlLCBnb2FsIGltYWdlLCBvciB2aWRlbyBjb250ZXh0XSAtLT4gRQpFIC0tPiBaW1NoYXJlZCBzcGF0aW90ZW1wb3JhbCByZXByZXNlbnRhdGlvbl0KWiAtLT4gVltGdXR1cmUgUkdCIC8gUkdCLUQgLyBnZW9tZXRyeSBicmFuY2hdClogLS0+IEFbQWN0aW9uIENodW5rIGJyYW5jaF0KViAtLT4gQ1tHZW9tZXRyaWMgYW5kIGNyb3NzLXZpZXcgY29uc2lzdGVuY3ldCkEgLS0+IEMKQyAtLT4gUFtDYW5kaWRhdGUgc2VsZWN0aW9uLCBwbGFubmluZywgb3IgY2xvc2VkLWxvb3AgZXhlY3V0aW9uXQpQIC0tPiBSW1JlYWwgb3V0Y29tZXMgYW5kIGZhaWx1cmUgZGF0YV0KUiAtLT4gRQ==" />

## 3.1 Multi-Objective Training

$$\mathcal{L}=\lambda_v\mathcal{L}_{video}+\lambda_a\mathcal{L}_{action}+\lambda_g\mathcal{L}_{geometry}+\lambda_c\mathcal{L}_{consistency}$$

> **Interpretation:** The total loss is a weighted combination of four objectives: video generation, action prediction, geometric supervision, and action–future consistency.

**Derivation:** The video term provides appearance and temporal priors, the action term anchors the representation to executable control, the geometry term penalizes spatial inconsistency, and the consistency term requires the generated actions and imagined outcomes to explain each other. The weights should not be set solely according to the numerical scales of the losses; they must also be determined through ablations on action success, geometric error, and gradient conflicts.

## 3.2 Causal Visibility and Information Leakage

During training, the model may simultaneously observe future video, depth, and actions. If the attention mask allows action tokens to directly access future information that would be unavailable during execution, offline action error may appear excellent while deployment performance collapses. It is essential to specify which times and modalities each token may access during training and inference, and to verify that the action head remains causal after future supervision is removed.

## 3.3 Synchronous and Asynchronous Generation

Video typically requires more denoising steps to achieve high-fidelity results, while control actions must be produced with low latency. Synchronous denoising gives both branches a unified schedule but slows down action generation; fully decoupling them may instead break the joint distribution. Asynchronous methods attempt to align different noise timesteps during training while allowing the action head to finish early during inference as the world branch continues to refine its output.

# 4. WAM4D: Injecting Geometric Priors with Spatial Register Tokens

WAM4D starts from the observation that even a visually plausible 2D video WAM may overlook the 3D spatial constraints and occluded contact geometry required for fine manipulation. However, densely generating a complete 4D scene at every control cycle would be too slow.

**Spatial Register Tokens.** WAM4D uses lightweight spatial register tokens to read out future depth during training, distilling or transferring spatial priors from a pretrained geometry model into a causal video–action Transformer. During execution, the register branch can be removed, leaving only the action pathway that has already absorbed spatial supervision and thereby avoiding dense geometric decoding.

**Causal Mixture Attention.** The model defines different visibility rules for video, action, and geometry tokens, preventing future depth or future video from leaking into the action head through noncausal shortcuts. The value of this design is not merely that it “uses MoT,” but that it explicitly defines the information permissions of different modalities along the time axis.

**Assessment in this course.** If removing depth supervision reduces action success while execution latency remains largely unchanged, this supports the conclusion that geometric priors improve action representations. It still does not prove that the model has learned contact forces or material properties. Conditions involving transparent objects, occluded grasping, camera-extrinsic perturbations, and contact recovery must be examined separately.

**Paper:** [WAM4D: Fast 4D World Action Model via Spatial Register Tokens](https://arxiv.org/abs/2606.14048)

# 5. X-WAM: Multi-View RGB-D and Asynchronous Denoising

X-WAM places real-time action execution and high-fidelity 4D world synthesis within a single framework. It uses a pretrained video diffusion model to imagine future multi-view RGB-D video and creates a dedicated depth branch by duplicating the final several DiT blocks, recovering future spatial information with relatively minor architectural changes.

## 5.1 Asynchronous Noise Sampling

Actions and video have different denoising-quality requirements. During training, X-WAM’s asynchronous noise sampling draws from a joint distribution over action and world timesteps, allowing the model to adapt to the asynchronous schedule used at inference: the action branch decodes rapidly with fewer steps, while the video and depth branches continue for additional denoising steps.

$$t_a\sim q_a(t),\quad t_w\sim q_w(t),\quad (t_a,t_w)\sim q_{joint}$$

> **Interpretation:** The action noise timestep and world noise timestep may differ, but they are not sampled completely independently; they are drawn from a joint schedule consistent with the inference process.

**Why this matters:** If actions and video are always kept at the same noise level during training, terminating action denoising early at inference creates a distribution shift. If they are sampled entirely independently, action–future alignment may be weakened. Joint sampling is a compromise between latency and consistency.

**Evidence and limitations:** The paper reports results on RoboCasa, RoboTwin 2.0, and pretraining with more than 5,800 hours of robot data, evaluating both action success and 4D generation quality. Real-robot control frequency, multi-view calibration error, depth-branch cost, and failure recovery should still be verified separately.

**Paper:** [Unified 4D World Action Modeling from Video Priors with Asynchronous Denoising](https://arxiv.org/abs/2604.26694)

# 6. The Latest WAM Directions in 2026

As of July 2026, the WAM frontier has expanded beyond “jointly generating video and actions” to include new control interfaces, long-term memory, inference-time computation, and security attack surfaces. The following sections are organized by mechanism rather than by company.

## 6.1 Masked Visual Actions: Representing Actions as Trajectory Conditions in Visual Space

Masked Visual Actions represent an action as the partial trajectory of an entity in a video. When robot motion is revealed, the model performs forward-dynamics prediction of the scene response; when target-object motion is revealed, the same model infers the robot behavior needed to achieve that outcome. This provides an embodiment-agnostic pixel-space control interface and allows forward prediction, candidate-future ranking, and inverse modeling to share a single checkpoint.

[Masked Visual Actions for Unified World Modeling](https://arxiv.org/abs/2607.19343)

## 6.2 WorldScape Policy 2.0: Memory, Events, and Controllable Long-Horizon Planning

WorldScape Policy 2.0 uses short-term visual memory as a DiT prefill while organizing historical VLM outputs into global-history, local-activity, and event-boundary memories. Retrieved results enhance perception and autoregressive planning tokens, forming implicit subgoals; event-level text, goal images, and video context provide finer-grained control. It represents the progression of WAMs from short Action Chunks toward task-progress tracking and long-horizon planning.

[WorldScape Policy 2.0](https://arxiv.org/abs/2607.18840)

## 6.3 Geometry-Consistency-Driven Test-Time Scaling

Because each WAM sample exposes both an action and a predicted future, the model can generate multiple candidate rollouts and use a frozen geometry model to compute cross-view depth-reprojection consistency for Best-of-N selection. Selective gating increases computation only when the initial rollout is internally inconsistent, demonstrating that an “imagined future” can serve as a signal for allocating inference budget rather than merely as a visualization by-product.

[Test-Time Scaling for World Action Models via Zero-Shot Geometric Evaluation](https://arxiv.org/abs/2607.17454)

## 6.4 BadWAM: Imagining Correctly but Acting Incorrectly

BadWAM investigates world–action drift: small visual perturbations can significantly alter actions while leaving predicted futures close to the imagination produced from the clean input. This invalidates the assumption that “if the future image looks plausible, the action is inherently safe.” It also requires evaluations to report action drift, imagination drift, task failure, and attack visibility separately.

[BadWAM: When World-Action Models Dream Right but Act Wrong](https://arxiv.org/abs/2607.15207)

## 6.5 Cross-Embodiment Scaling

AeroAct applies WAMs to language-conditioned quadrotor flight, using future first-person video as consequence supervision during training and directly decoding trajectory actions at deployment. GeoWorldAD introduces current and future geometry tokens into autonomous-driving trajectory refinement. These works show that WAMs are expanding from robotic-arm manipulation to systems with different dynamics and timescales, but cross-domain results cannot be treated as direct evidence of general-purpose robotic capability.

# 7. Boundaries Among 4D-WAMs, Physical World Models, and Whole-Body Control

| System | Primary output | Question answered | What it cannot replace |
|-|-|-|-|
| 4D-WAM | Actions, future video, depth, or spatial tokens | How can actions and time-varying spatial outcomes be jointly predicted? | Complete contact dynamics and stable control |
| Latent world model | Control-relevant latent states, rewards, and values | How can rollouts and planning be performed efficiently? | Interpretable 3D geometry, unless explicitly incorporated |
| Physical world model | States, forces, contact modes, and uncertainty | Does a transition satisfy dynamics and material constraints? | High-level semantic planning and open-vocabulary task understanding |
| VLA / action policy | Action Chunks or trajectories | What action should be executed now? | Explicit future prediction and stable actuator-level closed-loop control |
| Whole-Body Control | Joint targets, torques, and contact forces | How can balance, contact, and task constraints be satisfied? | Long-horizon semantic reasoning and visual world imagination |

A practical robotic system generally uses a hierarchical closed loop: a WAM or VLA provides short-horizon actions, visual subgoals, candidate futures, and uncertainty; a trajectory optimizer or MPC converts them into constrained trajectories; and a Whole-Body Controller handles balance, contact, torque limits, and disturbance recovery at high frequency.

$$g_t,\hat{o}_{t+1:t+H},\Sigma_t\rightarrow \text{planner}\rightarrow q^{ref},\dot q^{ref},f^{ref}\rightarrow \text{WBC}\rightarrow \tau_t$$

> **Interpretation:** The WAM outputs subgoals, predicted futures, and uncertainty; the planner generates reference joint states and contact forces; and the whole-body controller ultimately outputs real-time torques.

Even if a WAM directly outputs joint actions, safety filtering, interpolation, saturation handling, and low-level feedback are still required. The prediction frequency of the world model must not be conflated with the execution frequency of the controller.

# 8. How to Evaluate Whether a WAM Truly Understands Action Consequences

A WAM evaluation must, at minimum, separate world prediction, action quality, consistency between the two, and real closed-loop performance into four distinct layers.

| Evidence layer | Recommended metrics | Common misinterpretation |
|-|-|-|
| Visual future | Perceptual distance, temporal consistency, and object-state changes | Sharp imagery is equivalent to physical correctness |
| 4D geometry | Depth error, cross-view reprojection, Scene Flow, and collision and penetration rates | Accurate single-frame depth is equivalent to stable long-horizon geometry |
| Action | Action error, trajectory smoothness, latency, and control frequency | Low offline behavior-cloning error is equivalent to closed-loop success |
| World–Action consistency | Consistency between predicted outcomes and action directions, counterfactual ranking, and cycle consistency | A shared backbone guarantees alignment |
| Real closed loop | Success rate, recovery rate, collision rate, intervention rate, and long-horizon task-completion rate | Average simulator scores can replace real interventions |
| Uncertainty and safety | Calibration, risk coverage, drift under perturbations, and rejection and fallback behavior | Visualized imagination inherently guarantees safety |

## 8.1 Required Intervention Experiments

- Hold observations fixed and vary actions: do future object states change in the direction implied by the actions?
- Hold actions fixed and vary object positions or cameras: do the actions adjust appropriately to the geometric relationships?
- Remove geometric supervision: does the success-rate improvement genuinely come from the spatial branch?
- Shuffle action–video pairings: does the model rely on genuine causal correspondences rather than dataset backgrounds?
- Introduce cross-view occlusion: do invisible contact regions remain consistent rather than producing interpenetration?
- Perform long-horizon rollouts: do correct single-step predictions accumulate into geometric drift over multiple steps?
- Add small visual perturbations: do imagination and action exhibit BadWAM-style decoupling?

# 9. Minimal Reproducible Experiment

**Experimental task:** In a dual-view tabletop pushing or pick-and-place environment, provide a target-object position and have the model output an 8- to 16-step Action Chunk while predicting future RGB-D from both views.

## 9.1 Four Baseline Models

1. Action-only: Predict actions only.
2. Video + Action: Share representations without explicit geometry.
3. RGB-D + Action: Add future-depth supervision.
4. 4D Token + Action: Use spatial tokens during training and remove dense decoding during execution.

## 9.2 Data and Splits

The training data must include camera timestamps, extrinsic-calibration versions, proprioceptive states, action windows, object states, and success labels. The test set should be stratified by object instance, initial position, degree of occlusion, and camera perturbation to avoid trajectory leakage caused by random frame-level splitting.

## 9.3 Results That Must Be Reported

Report action error, closed-loop success rate, depth and reprojection errors, collision or penetration rate, per-decision latency, and GPU memory usage together. Also perform ablations on depth supervision, causal masks, asynchronous schedules, and the number of candidate rollouts. If geometric metrics improve but success does not, the conclusion should state that the method “improves spatial prediction,” not that it “improves control capability.”

## 9.4 Counterfactual Tests

For the same initial observation, input four action groups—left, right, toward, and away—and examine the sign and magnitude of the resulting object displacement. Then specify the same target future and verify whether the inverse action remains geometrically equivalent across camera viewpoints. This experiment tests action causality more directly than merely computing generated-video metrics.

# 10. Paper Landscape and Strength of Evidence

| Work | Core mechanism | Currently supported conclusion | Still requires validation |
|-|-|-|-|
| UniSim | Action-conditioned interactive video generation | Generative models can serve as interactive visual simulators | Real-robot action accuracy and contact reliability |
| Cosmos Policy | Learning robot policies using world-model priors | Video priors can be incorporated into action-policy training | Separating the contribution of world prediction from that of data scale |
| WAM4D | Spatial Register Tokens, training-time depth readout, causal MoT | Geometric supervision can improve spatial consistency while preserving lightweight action inference | Contact forces, long-horizon drift, and real-world latency |
| X-WAM | Multi-view RGB-D, depth branch, asynchronous noise sampling | High-quality 4D generation and fast action generation can be jointly optimized | Calibration errors, cross-platform transfer, and high-frequency closed-loop control |
| Masked Visual Actions | Unifying forward prediction, inverse prediction, and planning interfaces through partial visual trajectories | A pixel-space action interface can reuse video priors and generalize across embodiments | Fine-grained force control and long-horizon stability |
| WorldScape Policy 2.0 | Short-term visual memory, event memory, planning tokens | WAMs can be extended to progress-aware long-horizon planning and multimodal control | Error propagation in memory and real-world long-horizon recovery |
| Geometric Test-Time Scaling | Selecting candidate rollouts through cross-view depth reprojection | Geometric consistency can enable test-time filtering without task labels | Compute budget, selection of incorrectly low-scored candidates, and diminishing returns |
| BadWAM | World–Action Drift Attack | Plausible imagination is not sufficient evidence of action safety | Defenses, online detection, and the feasibility of physical attacks |

**Date accessed:** July 23, 2026. The WAM field is evolving rapidly. Future citations should record the paper version, publication date, and code and dataset availability to avoid presenting preprint results as established consensus.

**Key papers:**

- [WAM4D: Fast 4D World Action Model via Spatial Register Tokens](https://arxiv.org/abs/2606.14048)
- [Unified 4D World Action Modeling from Video Priors with Asynchronous Denoising](https://arxiv.org/abs/2604.26694)
- [Masked Visual Actions for Unified World Modeling](https://arxiv.org/abs/2607.19343)
- [WorldScape Policy 2.0](https://arxiv.org/abs/2607.18840)
- [Test-Time Scaling for World Action Models via Zero-Shot Geometric Evaluation](https://arxiv.org/abs/2607.17454)
- [BadWAM: When World-Action Models Dream Right but Act Wrong](https://arxiv.org/abs/2607.15207)
- [AeroAct: Action-Centered World-Action Models for Language-Conditioned Quadrotor Flight](https://arxiv.org/abs/2607.14997)
- [GeoWorldAD: Geometry World Action Model for Autonomous Driving](https://arxiv.org/abs/2607.17521)

# 11. Lesson Conclusions and Review Questions

The value of a 4D-WAM lies not in adding a depth head to a video model, but in organizing actions, future world states, and spatial constraints into prediction targets that can be cross-validated. WAM4D demonstrates a trade-off between training-time geometric supervision and lightweight action inference; X-WAM demonstrates multi-view RGB-D world generation with asynchronous action decoding; more recent work further extends WAMs toward visual action interfaces, long-horizon memory, test-time scaling, and safety auditing.

However, the boundaries of these conclusions must be respected: correct 3D geometry does not imply correct contact dynamics, plausible future frames do not imply safe actions, and joint training does not mean that the two outputs are inherently consistent. A WAM can be considered a world–action model suitable for control only when counterfactual interventions, geometric consistency, action latency, real-world closed-loop operation, and failure recovery have all been validated.

## Review Questions

1. Why is 3D + time still insufficient to fully represent friction, contact forces, and material properties?
2. What control interfaces are best suited to the action-first and future-first factorizations of a WAM, respectively?
3. Why can WAM4D remove the geometric readout branch at execution time? What ablations are needed to demonstrate that spatial information is still incorporated into the action representation?
4. What training–inference distribution shift does X-WAM’s asynchronous noise sampling address?
5. Why does BadWAM show that “plausible imagination” is not a sufficient condition for safety?
6. Design a counterfactual experiment that holds the observation fixed while changing the action, and specify the success criteria.
7. How should a 4D-WAM, MPC, and a Whole-Body Controller divide responsibilities in a humanoid robot system?
