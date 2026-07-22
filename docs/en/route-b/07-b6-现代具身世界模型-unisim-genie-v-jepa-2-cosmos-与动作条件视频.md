---
title: "B6 | Modern Embodied World Models: UniSim, Genie, V-JEPA 2, Cosmos, and Action-Conditioned Video"
sourceToken: IhJ3dxNiMoTluHxSHL0cYbkunTf
sourceRevision: 15
license: Apache-2.0
translationSource: "route-b/07-b6-现代具身世界模型-unisim-genie-v-jepa-2-cosmos-与动作条件视频.md"
translationSourceHash: 604c9d4d2d6bd2a26eb82286ad591aefa75977a2ac6c37db9b7287fb801e8888
---

> [Original Feishu document](https://archebase.feishu.cn/docx/IhJ3dxNiMoTluHxSHL0cYbkunTf) · Source revision 15

::: tip 💡
**Frontier Paper Seminar:** Generating realistic video does not mean that a model has learned a world model suitable for robot control. This lesson evaluates modern video world models using five criteria: state, action, controllability, temporal consistency, and planning benefit.
:::

# Learning Objectives

After completing this lesson, you should be able to distinguish among video generation models, interactive environment models, latent dynamics, World Action Models, and control-oriented world models; explain the technical positioning of UniSim, Genie, V-JEPA 2, Cosmos, WAM4D, and X-WAM; and design intervention experiments that test whether a model truly understands action consequences, 3D geometry, and contact constraints.

# 1. A World Model Must Be Sensitive to Actions

$$p_\theta(o_{t+1:t+H}\mid o_{\le t},a_{t:t+H-1},g)$$

> **Interpretation:** Given the observation history up to the present, the next H actions, and the task condition, the model predicts a probability distribution over observations for the next H steps.

**Derivation:** The future of the environment depends not only on the current image but also on the actions the agent will apply next. Removing actions from the conditioning variables makes the model learn natural video continuation; including actions makes it possible to answer the counterfactual question, “How would the future change if the action were changed?”

# 2. Do Not Conflate These Four Types of Models

| Model | Primary learning target | Can it be used directly for control? |
|-|-|-|
| Unconditional/text-conditioned video generation | A distribution of visually plausible videos | Usually not |
| Interactive world generation | Video changes under input actions or controls | Action semantics and latency must be validated |
| Latent dynamics | Transitions of control-relevant states | Can be used for planning or imagination-based learning |
| Control-oriented world model | Future states, rewards, constraints, and uncertainty | Its objective is to improve decision-making |

# 3. Pixel Likelihood Does Not Imply Physical Correctness

Video generation commonly minimizes negative log-likelihood or its variational upper bound:

$$\mathcal L_{video}=-\mathbb E_{(o,a)\sim\mathcal D}\log p_\theta(o_{t+1:t+H}\mid o_{\le t},a)$$

> **Interpretation:** On real video and action data, train the model to assign higher probability to the future frames that actually occurred.

**Derivation:** Maximizing likelihood is equivalent to minimizing empirical negative log-likelihood. However, a visual loss penalizes errors in texture, illumination, and background at the same time. A model that is more accurate at the pixel level may not preserve contact, object identity, or reachability more accurately.

# 4. Latent Prediction: Retaining Only the Information Needed for Decision-Making

$$z_t=f_\theta(o_{\le t}),\qquad \hat z_{t+1}=F_\phi(z_t,a_t)$$

> **Interpretation:** The encoder compresses the observation history into a latent state, and the dynamics model predicts the next latent state from the current latent state and action.

**Derivation:** If raw observations contain many pixels irrelevant to control, constructing a state representation before making predictions can focus model capacity on objects, motion, and interaction structure. However, the latent space must be supervised through rewards, actions, contrastive objectives, multi-step prediction, or similar signals to avoid discarding control-relevant variables.

# 5. UniSim: Learning Interactive Simulators from Real-World Video

UniSim represents the “generative real-world simulator” approach: it uses visual data and action conditioning to generate interactive futures. The main evaluation criterion is not single-frame realism, but whether the same action reproducibly produces consistent consequences, whether replacing the action produces the correct counterfactual, and whether long-horizon rollouts preserve object identity and geometric relationships.

# 6. Genie and Genie 2: Discovering Controllable Environments from Video

Genie demonstrates an approach for learning latent actions and interactive environments from internet video; Genie 2 further emphasizes large-scale generative world models. Its value for Physical AI is that “controllable change” may be discovered without existing robot action labels, but an embodiment grounding problem remains between latent actions and real robot torques.

# 7. V-JEPA 2 and Action-Conditioned Planning

The JEPA approach does not require reconstructing every pixel. Instead, it predicts masked or future content in representation space. An abstract objective is:

$$\mathcal L_{JEPA}=\|\hat z_{future}-\operatorname{sg}(z_{future})\|_2^2$$

> **Interpretation:** Make the future representation output by the context predictor close to the ground-truth future representation produced by the target encoder; the stop-gradient operator prevents this term from directly updating the target branch.

**Derivation:** Constructing prediction targets with a target encoder makes it possible to bypass pixel-level details. V-JEPA 2 demonstrates large-scale self-supervised video representation learning and connects it to robot planning through an action-conditioned model. The key experiment is whether video pretraining improves action-consequence prediction and real-world task success when the amount of control data is held fixed.

# 8. Cosmos: World Foundation Models as Data and Simulation Infrastructure

Cosmos emphasizes world generation and data infrastructure for Physical AI, including video generation, conditional control, and customizable models. This course treats it as a “world-model platform” rather than a single control algorithm: whether generated data improves a policy depends on the correctness of action conditioning, the match in scenario coverage, and whether the policy exploits artifacts in the synthetic data.

# 9. Action-Conditioned Robot Video Models

Robot models often predict future images, object trajectories, or visual subgoals, and then obtain actions through inverse dynamics or a planner. Candidate action sequences can be scored using predicted returns:

$$\hat G(a_{t:t+H-1})=\sum_{k=0}^{H-1}\gamma^k\hat r(\hat z_{t+k},a_{t+k})+\gamma^H\hat V(\hat z_{t+H})$$

> **Interpretation:** The predicted total return of a candidate action sequence equals the discounted sum of the predicted reward at each step of the model rollout, plus the discounted value of the terminal state.

**Derivation:** This is the definition of finite-horizon return. The world model generates future latent states, reward and value models convert those states into decision scores, and the planner compares multiple candidate sequences.

## 9.1 4D World Action Models: From Video Futures to Time-Varying 3D Worlds

A World Action Model (WAM) places future observations and robot actions within the same generative or predictive model, allowing visual futures and executable actions to share a temporal representation. Building on this idea, 4D-WAM explicitly introduces time-varying 3D structure. Here, “4D” means three spatial dimensions plus time, not a fourth spatial dimension. It also does not imply that the model has learned complete rigid-body dynamics, friction, contact forces, or material compliance.

### 9.1.1 What Does a 4D Representation Actually Add?

A conventional video model outputs a sequence of 2D pixels. It may generate a visually plausible grasp while drawing the manipulator inside the object, changing the object's scale, or losing its identity after occlusion. A 4D representation requires visual outcomes at different times to conform to consistent 3D coordinate relationships, thereby reducing monocular scale ambiguity, cross-view inconsistency, and erroneous completion of occluded regions.

| Representation | Information retained | Primary cost or limitation |
|-|-|-|
| Multi-view RGB-D sequence | Color, depth, and cross-view geometry at each time step | Depends on camera calibration; depth does not directly provide contact forces |
| Point-cloud or point-map sequence | Object surfaces, spatial distances, and 3D motion | Occluded regions are sparse; correspondences and long-term identity can easily drift |
| Scene flow / 3D trajectories | Displacement of 3D points over time | Difficult to handle topology changes, contact transitions, and invisible surfaces |
| Dynamic NeRF / Gaussian representation | Continuous-view rendering and dynamic scene appearance | High optimization and rendering costs; may be unsuitable for low-latency action generation |
| Geometric latent / register token | Compresses spatial supervision into control-relevant latent variables | Less interpretable; must demonstrate that the latent representation actually improves control |

**Key distinction.** 4D world generation emphasizes whether the future world is consistent in 3D. Robot control additionally requires that actions be executable under the current embodiment, contact, and latency constraints. The former is an important condition for the latter, but it is not sufficient.

### 9.1.2 What Does a WAM Jointly Model?

Let the historical multi-view observations be $O_t^{hist}$, the future depth or geometry be $G_{t+1:t+H}$, the historical actions be $a_{t-L:t-1}$, and the task condition be $c$. A unified 4D World Action Model can be written as:

$$p_\theta(O_{t+1:t+H},G_{t+1:t+H},a_{t:t+K-1}\mid O_t^{hist},a_{t-L:t-1},c)$$

> **Interpretation:** From the visual history, action history, and task condition, the model jointly predicts future visual observations, future 3D geometry, and the next action chunk to execute.

This is not exactly the same as “first predict the future with a world model, and then have an independent planner search for actions.” A WAM can jointly denoise or jointly generate visual observations and actions, with the action head directly producing an action chunk from the shared representation. Future video and geometry can be explicit outputs, or they can serve only as auxiliary training targets. Therefore, whether a WAM truly has world-modeling capability cannot be judged solely by action success rate; whether it truly supports control cannot be judged solely by the quality of its video, depth, or point clouds.

### 9.1.3 WAM4D: Distilling Geometric Priors with Spatial Registers

WAM4D is built on a causal video-action model. Its causal decision-time context includes language, multi-view RGB history, and action history:

$$C_t=\{l,O_t^{hist},a_{t-L_a:t-1}\}$$

During training, future video latents and future actions are both noised and inserted into a Mixture-of-Transformers sequence:

$$X_t^{(0)}=[Z_t^{hist},\widetilde Z_t^{fut},A_t^{hist},\widetilde A_t^{fut}]$$

The model predicts flow targets separately for future video and actions. WAM4D's new mechanism does not generate a complete point cloud during inference. Instead, it introduces a set of learnable spatial registers during training. The registers are replicated by future depth time step and multi-view mosaic location; using the registers as queries, the model reads spatial information from intermediate historical video features:

$$R_t^{\ell+1}=\operatorname{DepthBlock}_\ell(Q=R_t^\ell,K,V=[R_t^\ell,Z_t^{hist,\ell}])$$

The updated registers are passed to a geometry head initialized from Depth Anything 3 to predict future depth. The default design attaches depth readout blocks at backbone layers 12, 14, 16, and 18, allowing the geometry loss to backpropagate into the historical visual features used for action prediction. The paper's default configuration of three views and eight future depth frames produces 960 register tokens in total. These tokens are geometric queries used during training, not additional sensor inputs at deployment time.

**Causal visibility is central.** If future actions can access ground-truth future video or future depth, the model can “peek at the answer” through a training-time shortcut, causing performance to collapse at deployment. WAM4D uses causal mixture attention to restrict what each modality can access:

| Query token | Allowed to access | Prohibited from accessing |
|-|-|-|
| Future action | Historical video, historical actions, and its own noised action tokens | Future video tokens and spatial registers |
| Future video | Valid historical context and the video denoising state | Cannot serve as ground-truth conditioning for future actions |
| Spatial register | Itself and historical video features | Ground-truth future video and the action-policy pathway |

The total loss consists of video, action, and depth terms:

$$\mathcal L=\mathcal L_{video}+\lambda_{act}\mathcal L_{action}+\lambda_{depth}\mathcal L_{depth}$$

The depth term uses SmoothL1 over valid pixels. At deployment time, the registers, depth blocks, and geometry head are removed, leaving only the causal observation-to-action pathway and KV-cache. WAM4D is therefore more accurately described as “a lightweight action model that distills spatial priors through future-depth supervision” rather than “a simulator that continuously and explicitly generates a 4D world at deployment time.”

**Evidence boundary.** In an ablation across ten RoboTwin tasks, the paper reports a Clean SR of 71.7 for the version without depth and 75.2 for intermediate-layer unilateral registers. Bilateral registers reach 76.6, but they allow the backbone to access geometry tokens, increasing computation and complexity while degrading most geometry metrics. Depth supervision for the real-world data comes from offline pseudo-depth generated by Depth Anything 3. The results are therefore confounded by the quality of the geometry teacher and cannot be equated with supervision from real depth sensors.

### 9.1.4 X-WAM: Unifying RGB-D, State, Actions, and Asynchronous Denoising

Starting from a pretrained video diffusion Transformer, X-WAM jointly predicts future RGB, depth, proprioceptive state, and actions, conditioned on language, initial multi-view RGB, and the initial proprioceptive state:

$$Z=[z_{O_0},z_{O_{1:H}},z_{s_0},z_{s_{1:H}},z_{a_{1:K}}]$$

The configuration described in the paper predicts eight future RGB/state time steps and 32 actions, with an action frequency four times the video frequency. Multi-view tokens are distinguished using view embeddings. Static cameras use fixed extrinsics, while wrist-camera poses are derived from the predicted end-effector pose and the hand–eye calibration matrix:

$$T_{wrist}=T_{ee}T_{h2e}$$

This enables RGB-D observations from all views to be fused into a unified 3D coordinate system. It also means that errors in camera extrinsics, hand–eye calibration, or end-effector pose prediction directly corrupt the 4D reconstruction.

**Lightweight depth branch.** X-WAM does not directly append depth tokens to the main sequence because this would substantially increase sequence length and attention cost. Nor does it simply concatenate RGB and depth along the channel dimension, because that would shift the input distribution away from that of the pretrained video model. Instead, it copies several of the final blocks of the pretrained DiT to form a depth branch. Through unilateral attention, the depth branch reads intermediate features from the main branch, while the main branch does not read depth tokens. This preserves the video-pretrained weights and inference efficiency as much as possible. The depth branch regresses inverse depth and can be disabled during action decoding.

**Asynchronous Noise Sampling.** Video usually requires more denoising steps to produce a clear future, whereas low-dimensional actions can be decoded more quickly. Suppose actions/states require $T_a$ steps, video requires $T_O$ steps, and $T_a\lt T_O$. At inference step $T_a$, the clean actions can already be sent to the robot while the video branch continues denoising. Subsequent world generation then naturally becomes prediction conditioned on the decoded actions.

Independently sampling video noise $t_O$ and action noise $t_a$ during training produces states that never occur during inference, such as video being cleaner than the actions. ANS instead samples from a joint distribution satisfying $t_O\ge t_a$ and explicitly includes the training case in which the actions are already clean while the video is still being denoised, ensuring that the training distribution covers the asynchronous inference path. Its total objective is:

$$\mathcal L_{total}=\mathcal L_O+\lambda_s\mathcal L_s+\lambda_a\mathcal L_a+\lambda_D\mathcal L_{depth}$$

**Ablations reported in the paper.** In the RoboCasa ablation setting, the success rate is 63.0% without the depth branch and 67.8% with the interleaved depth branch. Explicit sequence concatenation achieves 68.7%, but increases action latency from 1,033 ms to 1,888 ms. Synchronous 25-step denoising has a latency of 4,665 ms, whereas ANS asynchronous inference has a latency of 1,033 ms. These figures demonstrate the quality–latency trade-off in the paper's design, but they cannot be directly extrapolated to different GPUs, control frequencies, or real robots.

### 9.1.5 Differences Between WAM4D and X-WAM

| Dimension | WAM4D | X-WAM |
|-|-|-|
| Role of 4D geometry | Auxiliary distillation target during training | Joint generation and reconstruction output |
| Geometry interface | Spatial registers query historical visual features | Interleaved depth branch formed by copying the final DiT blocks |
| Action causality | Future actions are prohibited from accessing future video and registers | Joint multimodal denoising; actions can finish first and condition subsequent video generation |
| Geometry cost at deployment | Geometry branch is removed entirely | Depth branch can be disabled or run at a lower frequency |
| Main technical tension | How to inject geometric supervision into the policy without increasing inference cost | How to preserve both 4D generation quality and real-time action speed |
| Main audit risk | Pseudo-depth teacher, training-time shortcuts, and whether geometric supervision genuinely improves actions | Large-scale pretraining confounds, calibration errors, and consistency between asynchronous training and inference |

### 9.1.6 4D Geometry Is Not Complete Physics

RGB-D, point clouds, and scene flow primarily describe kinematic geometry. They can tell a model “where an object is and how its surface moves,” but they usually cannot uniquely determine the coefficient of friction, mass distribution, contact stiffness, gripping force, actuator saturation, or control latency. The same visual motion can result from different forces and material properties. Without force sensing, proprioceptive feedback, or intervention data, these variables are often unidentifiable.

| Decisive experiment | Controlled variables | Weak explanation to rule out |
|-|-|-|
| Remove or shuffle depth supervision | Hold action data, backbone parameter count, and training compute fixed | The gain comes only from additional parameters or regularization |
| Compare single-view and multi-view inputs | Hold frame count and pixel budget fixed | The gain comes only from an increase in input data |
| Compare real depth and pseudo-depth | Use the same tasks and policy-training pipeline | The model is learning bias from the teacher model |
| Calibration perturbation experiment | Sweep camera extrinsic, hand–eye calibration, and temporal synchronization errors | The 4D representation is inherently robust to deployment calibration |
| Geometry–control correlation | Report depth error, point-cloud error, and success rate for each task | Better geometry metrics necessarily yield better control |
| Contact and physics OOD | Vary friction, mass, compliance, transparency, reflectivity, and occlusion | Visual-spatial consistency is equivalent to physical understanding |
| Latency–success curve | Standardize hardware, denoising steps, action-chunk length, and control frequency | Offline action accuracy is sufficient to establish real-time usability |

**Course assessment.** 4D-WAM is an important step in the evolution of video world models toward robot control because it places spatial structure, cross-view consistency, and action generation within the same chain of evidence. However, its strongest defensible conclusion should be limited to the following: geometric supervision can improve control-relevant visual representations and may increase action success rates. A model is qualified to claim that it has learned a physical world model suitable for contact-rich tasks only after further validation through force sensing, proprioceptive feedback, real interventions, and closed-loop recovery.

# 10. Paper Facts and Evidence Boundaries

| Approach | Publicly established facts | Authors' interpretation | Course assessment |
|-|-|-|-|
| UniSim | Trains a generative interactive simulator using real-world video and action conditioning, and demonstrates applications in policy training and evaluation | Generative models can expand the interactive experience available to robots and agents | The key is not single-frame realism, but action semantics, long-horizon consistency, and gains from simulator-to-real transfer |
| Genie / Genie 2 | Learns latent actions or interactive generative environments from video, emphasizing large-scale world-generation capability | Video without explicit action labels still contains controllable structure | Latent actions still require grounding in the robot embodiment and control frequency; they cannot be treated as equivalent to robot actions |
| V-JEPA 2 | Connects prediction and robot planning through self-supervised video representations and an action-conditioned model | Prediction in representation space can bypass unnecessary pixel generation | The amount of robot control data should be held fixed to test whether pretraining genuinely improves action-consequence prediction and real-world task success |
| Cosmos | Provides world-generation models, data processing, and customizable infrastructure for Physical AI | World foundation models can support synthetic data, simulation, and downstream Physical AI development | It is a platform approach rather than a single control algorithm; the value of synthetic data must be demonstrated through real closed-loop gains and bias audits |
| WAM4D | Uses training-time spatial register tokens to introduce future-depth supervision and removes the geometry readout branch during action inference | Pretrained geometric priors can be injected into a causal video-action model without slowing control through dense 4D decoding | It must be shown that geometric supervision improves real closed-loop performance under fixed data and compute budgets, rather than merely improving depth or simulation metrics |
| X-WAM | Jointly predicts future multi-view RGB-D observations and robot actions, using asynchronous denoising to balance action speed and world-generation quality | Unified 4D world modeling and real-time action execution can jointly support spatial understanding and control efficiency | The contributions of pretraining-data scale, the geometry branch, and asynchronous sampling should be disentangled, while contact, latency, and cross-embodiment generalization are audited |

# 11. Failure Modes: Three Decisive Errors

| Error | Symptom | Consequence for control |
|-|-|-|
| Action insensitivity | Predictions barely change when the action is changed | Counterfactual planning is impossible |
| Contact inconsistency | Interpenetration, floating, or object teleportation | Reachability and risk are estimated incorrectly |
| Multi-step drift | Realistic in the short term, but object identity is lost over longer horizons | Long-horizon planning targets become distorted |

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBPW09ic2VydmF0aW9uIGhpc3RvcnldIC0tPiBaW1N0YXRlIG9yIHZpZGVvIHJlcHJlc2VudGF0aW9uXQogICAgQVtDYW5kaWRhdGUgYWN0aW9uIHNlcXVlbmNlc10gLS0+IFdbQWN0aW9uLWNvbmRpdGlvbmVkIHdvcmxkIG1vZGVsXQogICAgWiAtLT4gVwogICAgVyAtLT4gRltGdXR1cmUgdmlkZW8gLyBsYXRlbnQgc3RhdGVdCiAgICBGIC0tPiBRW1Jld2FyZHMsIGNvbnN0cmFpbnRzLCBhbmQgdW5jZXJ0YWludHldCiAgICBRIC0tPiBQW1BsYW5uZXIgY29tcGFyZXMgY2FuZGlkYXRlc10KICAgIFAgLS0+IEVbRXhlY3V0ZSB0aGUgZmlyc3QgYWN0aW9uIHNlZ21lbnRdCiAgICBFIC0tPiBP" />

# 12. Minimal Experiments

1. Construct an identical initial scene with two opposing actions, and test whether the predicted futures diverge significantly and correctly.
2. Measure pixel error, object-position error, contact-event error, and planning success rate separately.
3. Plot error curves as the rollout horizon increases, and identify the point at which control benefit begins to decline.
4. Vary the background, texture, and illumination to verify whether the latent model preserves physical state while ignoring irrelevant pixels.
5. Hold the amount of policy data fixed and compare no video pretraining, video-generation pretraining, and JEPA pretraining.

# 13. Exercises

1. Explain why high PSNR does not establish that a world model is suitable for control.
2. Design a permutation experiment that tests whether a model uses action conditioning.
3. Compare the information that may be lost by pixel generation, latent prediction, and reward prediction.
4. Explain what types of grounding are required to transfer latent actions from human video to robots.
5. Define a world-model metric for contact-rich tasks that is more important than video realism.

# 14. Key References

- [WAM4D: Fast 4D World Action Model via Spatial Register Tokens](https://arxiv.org/abs/2606.14048)
- [X-WAM: Unified 4D World Action Modeling from Video Priors with Asynchronous Denoising](https://arxiv.org/abs/2604.26694)
- [UniSim](https://universal-simulator.github.io/unisim/)
- [Genie](https://sites.google.com/view/genie-2024/)
- [Genie 2](https://deepmind.google/discover/blog/genie-2-a-large-scale-foundation-world-model/)
- [V-JEPA](https://ai.meta.com/vjepa/)
- [NVIDIA Cosmos](https://www.nvidia.com/en-us/ai/cosmos/)
