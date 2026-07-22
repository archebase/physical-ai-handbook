---
title: "A2｜Mainstream VLA Lineages: RT, Open X, Octo, OpenVLA, GR00T, and Gemini Robotics"
sourceToken: Bgevdu3QuoIedrxrIaPcKv1Nn7b
sourceRevision: 9
license: Apache-2.0
translationSource: "route-a/03-a2-主流-vla-谱系-rt-open-x-octo-openvla-gr00t-与-gemini-robotics.md"
translationSourceHash: 362b37a7944956d0c0fa87a5592d8a89bc6ac8ec32f2209dca57af56ff317376
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/Bgevdu3QuoIedrxrIaPcKv1Nn7b) · Source Revision 9

::: tip 💡
**Paper Track:** This lesson does not ask “which company is stronger.” Instead, it examines what different VLA systems actually learn, what data they use, what actions they output, and whether their capability gains come from architecture, data, or post-training.
:::

# Learning Objectives

After completing this lesson, you should be able to place RT-1, PaLM-E, RT-2, RoboCat, Open X-Embodiment/RT-X, Octo, OpenVLA, RDT, GR00T, Gemini Robotics, and the π series within a common technical framework; distinguish semantic pretraining, robot co-training, action generation, and deployment adaptation; and identify the specific holdout denoted by the term “generalization” in a paper.

# 1. A Unified Problem: VLA Learns a Conditional Action Distribution

$$\pi_\theta(a_{t:t+H-1}\mid I_{t-k:t},q_{t-k:t},l,e)$$

> **How to read it:** Given a recent sequence of images, the robot's proprioceptive state, a language instruction, and the robot embodiment identifier, the policy generates an action chunk of length H beginning at the current time step.

**Derivation:** Conditioning on recent images, robot state, the language instruction, and the embodiment identifier allows the same policy to change the distribution of future action chunks according to the scene, task, and robot interface.

**Notation:** $I$ denotes images, $q$ denotes joint or end-effector states, $l$ denotes the language goal, $e$ denotes embodiment information, and $a$ denotes robot actions.

**Source of the derivation:** Robot demonstration data provides contexts $c=(I,q,l,e)$ and ground-truth actions $a$. Maximum-likelihood training requires ground-truth actions to have higher probability under the model distribution:

$$\theta^*=\arg\max_\theta\sum_{(c,a)\in\mathcal D}\log\pi_\theta(a\mid c)$$

> **How to read it:** Find a set of parameters across all demonstration samples that assigns the highest possible log-probability to the actions actually performed by the expert.

**Derivation:** Under the assumption that samples are conditionally independent, the data likelihood is the product of the policy probabilities for individual samples. Taking the logarithm converts this product into a sum, and maximizing that sum yields the maximum-likelihood objective for conditional behavioral cloning.

Negating the objective yields the behavioral cloning loss to be minimized. Regression, action tokens, Diffusion, and Flow Matching differ in how they parameterize the same conditional action distribution.

# 2. Three Key Expansions

| Expansion | Source of the model's new capabilities | Representative systems |
|-|-|-|
| Scaled multitask imitation | Training a unified token/Transformer model on a large number of real-world robot tasks | RT-1, RoboCat |
| Incorporating vision-language knowledge into control | Internet image-text data or large language models provide semantic representations | PaLM-E, RT-2, OpenVLA |
| Co-training across datasets and embodiments | Unified data schemas, action spaces, and task conditioning | Open X-Embodiment, RT-X, Octo, GR00T |

# 3. RT-1: Turning Multitask Robot Control into Sequence Modeling

RT-1's key contribution is not simply that it “uses a Transformer,” but that it organizes images, language, and discrete actions into a robot sequence model that can be trained at scale. A discrete action sequence can be factorized as:

$$p(y_{1:M}\mid c)=\prod_{m=1}^{M}p(y_m\mid y_{1:m-1},c)$$

> **How to read it:** The probability of the complete action-token sequence equals the product of the probability of each token conditioned on the context and all preceding action tokens.

**Derivation:** The probability chain rule expands the joint distribution into a product of conditional probabilities. Taking the logarithm converts the product into a sum, enabling training with per-token cross-entropy. The trade-offs are quantization error and autoregressive decoding latency.

# 4. PaLM-E and RT-2: How Semantic Knowledge Enters Action Generation

PaLM-E injects continuous sensor representations into a language model, demonstrating the possibility of sharing a common backbone between embodied inputs and language reasoning. RT-2 goes further by representing robot actions as tokens that can be predicted by a vision-language model, enabling joint training on internet-scale vision-language tasks and robot action tasks.

The co-training objective can be abstracted as:

$$\mathcal L=\lambda_{vl}\mathcal L_{vision-language}+\lambda_{robot}\mathcal L_{action}$$

> **How to read it:** The total loss is a weighted sum of the vision-language task loss and the robot action loss, with both types of data jointly updating the model.

**Derivation:** When training batches come from two data distributions, the overall empirical risk is the weighted sum of the expected losses over the respective data sources. The weights are not merely hyperparameters; they also implicitly determine how frequently the model sees each type of data.

A critical misinterpretation must be avoided: vision-language knowledge can help identify objects and attributes and interpret compositional instructions, but it does not automatically provide contact forces, kinematic reachability, or stable control.

# 5. RoboCat: Generality Through an Iterative Data Loop

An important aspect of RoboCat is its combination of a multi-robot, multitask policy with a self-improving data loop. The model is first trained on demonstrations from multiple sources, then collects data for new tasks and feeds that data back into training. Two types of improvement must be distinguished here: transfer from existing multitask experience and adaptation enabled by newly added target-task data.

# 6. Open X-Embodiment and RT-X: A Data Consortium Changes the Research Object

Open X-Embodiment brings data from different laboratories, robots, and control interfaces into a shared corpus. Its training distribution is a mixture distribution:

$$p_{train}(x)=\sum_{d=1}^{D}w_d p_d(x)$$

> **How to read it:** Training samples come from a mixture of D data sources; the probability of sampling the d-th data source is determined by the weight w_d.

**Derivation:** First select a data source according to $w_d$, and then sample from that source's distribution $p_d$. Marginalizing over the data-source variable yields the mixture distribution. If the largest data source directly determines the weights, it can overwhelm smaller sources containing rare skills.

The central challenge of cross-embodiment learning is not padding, but whether the physical semantics of actions, coordinate frames, frequencies, camera viewpoints, and task labels are aligned.

# 7. Octo: An Open Generalist Policy with Adaptable Interfaces

Octo explicitly targets large-scale cross-embodiment pretraining and downstream adaptation. When reading the paper, check which robots are covered by the pretraining data, which parameters are updated during downstream adaptation, and whether gains on new tasks arise under the same amount of target-task data or from additional data and compute.

# 8. OpenVLA: Turning an Open-Source VLM Backbone into a Continuous-Control Policy

OpenVLA represents the open-source VLA approach: starting from a vision-language backbone and training action prediction on robot data. Its value lies not only in the model itself, but also in reproducible data-processing, training, and deployment interfaces. To assess its generality, evaluate holdouts for objects, backgrounds, language compositions, tasks, and embodiments separately.

# 9. RDT and Generative Action Experts

Systems such as RDT, Diffusion Policy, and π0 reflect another trend: the semantic backbone does not need to output all continuous actions directly, token by token, but can instead connect to a specialized generative action module. Using Flow Matching as an example:

$$\frac{dx_t}{dt}=v_\theta(x_t,t,c)$$

> **How to read it:** An action sample x moves through generation time t along the velocity field predicted by the model, ultimately being transported from a simple noise distribution to the conditional action distribution.

**Derivation:** A generative policy treats a sample from a simple initial distribution as the initial condition of an ODE and continuously updates it using a learned conditional velocity field. Integrating this equation produces the final action sample.

**Derivation intuition:** During training, a probability path between noisy actions and ground-truth actions is constructed manually, and the true velocity along the path is supervised. During inference, the differential equation is integrated from noise to produce an action chunk.

# 10. GR00T, Gemini Robotics, Helix, and Next-Generation Systems

Systems emerging from 2025 onward place greater emphasis on dual-system or hierarchical architectures: a slower vision-language reasoning module handles semantics, tasks, and subgoals, while a faster action module handles continuous closed-loop control. GR00T emphasizes humanoid-robot data and cross-embodiment foundation models; Gemini Robotics emphasizes extending vision-language models to embodied reasoning and action generation; and Helix demonstrates language-conditioned general-purpose upper-body control for humanoid robots.

These systems differ in the transparency of their publicly available materials, data, and evaluations. This course treats only publicly verifiable architectures and experiments as facts and does not regard demonstration videos alone as evidence of generality.

# 11. Unified Comparison Table

| System | Primary learning object | Action representation | Most important evidence to inspect |
|-|-|-|-|
| RT-1 | Multitask conditional action sequences | Discrete action tokens | Multitask scale and long-tail tasks |
| PaLM-E | Embodied multimodal representations and language outputs | Continuous control is not the sole objective | Positive transfer and language reasoning |
| RT-2 | Action tokens conditioned on vision-language knowledge | Action tokens | Semantic generalization and real-world control boundaries |
| RoboCat | Multi-robot, multitask policy | Policy actions | Data loop for new tasks |
| RT-X/Octo | Cross-dataset, cross-embodiment policy | Unified or adapted actions | Strict embodiment holdouts |
| OpenVLA | Open-source VLM-conditioned action policy | Discretized continuous actions | Reproducibility, adaptation cost, and closed-loop performance |
| RDT/π0 | Multimodally conditioned generative action distribution | Diffusion or Flow action chunks | Multimodal coverage, latency, and control frequency |
| GR00T/Gemini/Helix | Hierarchical semantic reasoning and continuous control | Varies by system | Public data, holdout design, and safety metrics |

# 12. Generalization Must Be Disaggregated

An “unseen task” may refer to at least a new background, a new object instance, a new object category, a new language composition, a new skill composition, new dynamics, a new robot, or a new task. Different holdouts correspond to different levels of difficulty and cannot be collapsed into a single generalization success rate.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBEW1JvYm90IERlbW9uc3RyYXRpb25zXSAtLT4gQkNbQ29uZGl0aW9uYWwgQWN0aW9uIExlYXJuaW5nXQogICAgVkxbSW50ZXJuZXQgSW1hZ2UtVGV4dC9MYW5ndWFnZSBEYXRhXSAtLT4gU1tTZW1hbnRpYyBCYWNrYm9uZV0KICAgIFMgLS0+IEJDCiAgICBYW0Nyb3NzLUVtYm9kaW1lbnQgRGF0YV0gLS0+IEJDCiAgICBCQyAtLT4gUFtQcmV0cmFpbmVkIFZMQV0KICAgIFAgLS0+IEZUW1RhcmdldC1TY2VuYXJpbyBQb3N0LVRyYWluaW5nXQogICAgRlQgLS0+IEVbUmVhbC1Xb3JsZCBEZXBsb3ltZW50IEV4cGVyaWVuY2VdCiAgICBFIC0tPiBSTFtDb3JyZWN0aW9uL1ZhbHVlL0V4cGVyaWVuY2UgTGVhcm5pbmddCiAgICBSTCAtLT4gUA==" />

# 13. Minimal Paper Reproduction Experiments

1. Hold the robot data fixed and compare training the vision encoder from scratch against using a vision-language pretrained backbone.
2. Hold the amount of target-task data fixed while progressively adding data from other tasks and other robots.
3. Compare action tokens, MSE, and generative action chunks, reporting mode coverage, latency, and smoothness.
4. Conduct separate holdouts for objects, language compositions, task compositions, and embodiments.
5. Perturb the target object deliberately and test whether the policy can recover through closed-loop control rather than merely replaying training trajectories.

# 14. Exercises

1. Compare RT-2 and π0 in terms of learning object, supervision signal, action representation, training data, and deployment interface.
2. Explain why the primary challenge of Open X-Embodiment is not data-format conversion.
3. Design an ablation that distinguishes gains from vision-language pretraining from gains due to the amount of robot data.
4. Explain the respective responsibilities of the slow semantic module and the fast action module in a dual-system architecture.
5. Define an evaluation for “generalization to a new robot” that does not leak embodiment information.

# Primary Sources

- [RT-1](https://robotics-transformer1.github.io/)
- [PaLM-E](https://palm-e.github.io/)
- [RT-2](https://robotics-transformer2.github.io/)
- [RoboCat](https://deepmind.google/discover/blog/robocat-a-self-improving-robotic-agent/)
- [Open X-Embodiment / RT-X](https://robotics-transformer-x.github.io/)
- [Octo](https://octo-models.github.io/)
- [OpenVLA](https://openvla.github.io/)
- [NVIDIA GR00T](https://developer.nvidia.com/isaac/gr00t)
- [Gemini Robotics](https://deepmind.google/discover/blog/gemini-robotics-brings-ai-into-the-physical-world/)
- [Figure Helix](https://www.figure.ai/news/helix)
