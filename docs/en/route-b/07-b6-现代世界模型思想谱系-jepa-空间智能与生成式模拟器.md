---
title: "B6｜The Modern Genealogy of World Models: JEPA, Spatial Intelligence, and Generative Simulators"
sourceToken: IhJ3dxNiMoTluHxSHL0cYbkunTf
sourceRevision: 21
license: Apache-2.0
translationSource: "route-b/07-b6-现代世界模型思想谱系-jepa-空间智能与生成式模拟器.md"
translationSourceHash: 7f7c92575de1a1635fcb7997a54d6b8e1406b55e9d9e35cd58d04f964e6195ea
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/IhJ3dxNiMoTluHxSHL0cYbkunTf) · Source Revision 21

::: tip 💡
**Course positioning:** Rather than cataloging “world model products” by company or paper, this lesson addresses a more important question: how are today’s distinct technical lineages gradually converging into world models suitable for Physical AI?
:::

# Learning Objectives

After completing this lesson, readers should be able to diagram five world model lineages; explain the continuity of Yann LeCun’s arguments from Autonomous Machine Intelligence through I-JEPA, V-JEPA, and V-JEPA 2; explain Fei-Fei Li’s technical motivation for moving from visual intelligence toward spatial intelligence, persistent 3D worlds, and World Labs; distinguish among a Renderer, Simulator, Planner, and Controller; and determine whether a generative world model has truly entered the robotics closed loop.

# 1. Why “World Model” Is Becoming Increasingly Confusing

Different communities use the same term to answer different questions. Control researchers ask whether state transitions are sufficient to stabilize a system; reinforcement learning researchers ask whether a model can improve sample efficiency and long-term returns; vision researchers ask whether a representation captures objects, motion, and space; generative modeling researchers ask whether a model can produce coherent, controllable futures; and robotics researchers ultimately ask whether predictions can change actions and improve real-world success rates under contact, latency, and disturbances.

World models therefore cannot be classified merely by whether they predict the future. A more effective comparison framework asks six questions: What is represented? What is predicted? Is action treated as an intervention variable? Who consumes the output? How does the output enter the physical closed loop? What evidence demonstrates its value for control?

# 2. Five Lineages and Their Core Tensions

| Lineage | Primary Representation | Primary Prediction | Output Consumer | Core Gap |
|-|-|-|-|-|
| Classical control and system identification | Estimable physical states and parameters | State transitions after actions are applied | Kalman Filter, MPC, trajectory optimizer | Open-world perception and model mismatch |
| Decision-oriented latent world models | Reward- and control-relevant latent variables | Latent state, reward, value, or policy | Planner, tree search, Actor-Critic | Spatial interpretability and grounding in real-world physics |
| JEPA predictive representations | Abstract, predictable visual-temporal representations | Target representations of masked regions or future states | Downstream recognition, action-conditioned dynamics, and planning | Good representations do not automatically yield good control |
| Spatial intelligence | Persistent objects, geometry, viewpoints, and 3D worlds | Novel views, spatial relationships, and world changes | Renderer, simulator, spatial reasoning system, and planning system | Geometric consistency does not automatically include force and contact dynamics |
| Generative interactive environments and WAMs | Video, world states, actions, or their joint tokens | Action-conditioned futures and executable actions | Data engine, planner, policy, or robot | Causal action semantics, latency, and real-world closed-loop evidence |

These lineages do not replace one another chronologically. Modern systems often draw on several at once: they learn JEPA or generative priors from large-scale video, acquire spatial structure through 3D supervision, perform embodiment grounding with robot action data, and then convert predictions into behavior through MPC, value functions, or action heads.

# 3. The Foundation: From “Known Dynamics” to “Learned Internal Models”

Classical control has long placed models at the center of the closed loop. A state-space model is written as $s_{t+1}=f(s_t,a_t)+\epsilon_t$; a state estimator recovers states that cannot be observed directly from noisy measurements; MPC searches for finite-horizon actions within the model, executes only the first action, and then observes again. This tradition establishes the most stringent criteria for a world model: actions are intervention variables, model outputs are consumed by a decision-maker, and prediction errors must ultimately be evaluated in terms of closed-loop stability, constraint violations, and task outcomes.

World Models, PlaNet, Dreamer, MuZero, and TD-MPC transfer this idea to high-dimensional observations and learned representations. Together, they form the “decision world model” lineage discussed in detail in B5. The genuinely new challenge for modern visual world models is not to reinvent internal models, but to learn sufficiently general world structure from massive volumes of action-free or weakly action-labeled video, and then connect that structure to control using a relatively small amount of robot data.

# 4. Yann LeCun’s Approach: Predict Abstract Structure Rather Than Reconstruct Every Pixel

## 4.1 Autonomous Machine Intelligence: The World Model as the Core of Hierarchical Intelligence

In the Autonomous Machine Intelligence architecture, Yann LeCun organizes perception, a world model, short-term memory, a cost module, an actor, and a configurator into a single system. The central claim is that an agent must internally predict the consequences of actions and select actions according to objectives or costs; however, because the future contains a great deal of unpredictable detail, pixel-by-pixel generation is not necessary for acquiring common sense and planning capabilities.

This claim is closely aligned with traditional model-based control, but advances the learning target from manually defined states to hierarchical representations learned from perceptual data. It also explains JEPA’s point of departure: the model should predict the future in a more stable and abstract information space.

## 4.2 I-JEPA: Predicting Missing Regions in Image Representation Space

I-JEPA uses a context encoder to process visible image regions and a target encoder to produce representations of masked regions. A predictor then predicts the target representations conditioned on the context and position. The abstract objective can be written as:

$$\mathcal L_{JEPA}=\|\hat z_y-\operatorname{sg}(z_y)\|_2^2$$

> **Interpretation:** The predictor is not responsible for reconstructing every pixel in the target region; instead, it approximates the abstract representation produced by the target encoder.

Its value lies in bypassing texture, lighting, and stochastic details, thereby forcing the representation to preserve object-level semantics and structure. However, I-JEPA itself is primarily a method for learning static visual representations: it has no action conditioning or explicit reward, nor does it demonstrate closed-loop control.

## 4.3 V-JEPA: From Spatial Masking to Spatiotemporal Video Prediction

V-JEPA extends the prediction target to spatiotemporal regions in video. The context must use motion, object persistence, and temporal structure to infer masked content, making the resulting representation closer to a dynamic world than single-frame features are. Its primary objective remains learning predictable video representations rather than generating sharp pixels.

Here, “understanding dynamics” must be distinguished from “understanding the consequences of actions.” Natural video can teach a model how objects move and how people interact, but it cannot automatically tell a robot what result a particular joint action will produce. Without actions and proprioceptive states, the model primarily learns observational dynamics rather than intervention-capable dynamics.

## 4.4 V-JEPA 2: Connecting Video Representations to Action-Conditioned Planning

V-JEPA 2 connects large-scale self-supervised video representations to an action-conditioned world model and demonstrates zero-shot planning and robot control. This marks the first clear bridge in the JEPA lineage between “good representations” and “predictive models usable for decision-making”: first, learn abstract regularities of the world from video; then, use action-labeled robot trajectories to learn $F(z_t,a_t)\rightarrow z_{t+1}$; finally, compare candidate actions in latent space.

The most important evidence is not performance on video benchmarks, but whether pretraining improves counterfactual action prediction, planning efficiency, and real-world task success while holding the amount of robot data fixed. JEPA’s central advantage is the hypothesis that abstract representations can reduce pixel-level noise and rollout cost. Its risk is that the encoder may also discard control-critical details such as contact points, small clearances, and changes in friction.

# 5. Fei-Fei Li’s Approach: From Visual Recognition to Spatial Intelligence

## 5.1 From “What Is in the Image?” to “How Does the World Exist?”

Visual intelligence, exemplified by ImageNet, enabled machines to recognize objects, but Physical AI requires answers to more specific questions: Where is an object? Does it remain the same object from different viewpoints? Does it continue to exist when occluded? Can a person or robot navigate around it, grasp it, push it, or enter it? How do spatial relationships update when the environment changes? The spatial intelligence emphasized by Fei-Fei Li is precisely a shift from 2D recognition toward persistent, interactive, 3D world understanding.

This approach differs from JEPA in its focus. JEPA first asks, “What representations are worth predicting?” Spatial intelligence first asks, “What kind of world must an intelligent agent understand?” The former emphasizes the level of abstraction of the prediction target; the latter emphasizes that objects, geometry, viewpoints, persistence, and affordances must have explicit grounding in the representation.

## 5.2 World Labs and Marble: Generatable, Explorable, and Exportable 3D Worlds

World Labs’ Marble demonstrates the creation of 3D worlds from text, images, video, or rough layouts, while supporting viewpoint exploration and outputs such as splats, meshes, and video. Its importance extends beyond “3D content generation”: it elevates the world representation from a fixed video sequence into a spatial object that can be queried from novel viewpoints and explored persistently.

However, Marble is closer to general-purpose spatial world generation and rendering infrastructure than to a complete robotics dynamics model. A scene may be geometrically and visually coherent while still failing to model object mass, friction, contact stiffness, actuator limits, and control latency. Spatial intelligence provides the world structure necessary for Physical AI, but action interventions and physical feedback are still required to complete the grounding process.

## 5.3 Renderer, Simulator, and Planner: A Useful Functional Taxonomy, Not a Unified Academic Definition

In 2026, World Labs proposed a functional taxonomy of Renderer, Simulator, and Planner: a Renderer produces observable results from a world representation; a Simulator advances the world state according to actions or events; and a Planner compares futures within the model and selects behavior. This taxonomy helps identify what functions a system actually provides, but it is an engineering-oriented functional classification rather than a definition of world models uniformly accepted by the academic community.

| Function | Input | Output | Validation Question for Physical AI |
|-|-|-|-|
| Renderer | World state and camera conditions | Image, depth, or novel view | Are geometry and object identity consistent across viewpoints? |
| Simulator | Current state and action/event | Next state or future trajectory | When the action is replaced, does the future branch counterfactually in the correct way? |
| Planner | Goal, candidate behaviors, and predictive model | Action, subgoal, or plan | Does it improve real-world closed-loop success while controlling risk? |
| Controller | Reference trajectory, state feedback, and constraints | Joint position, velocity, torque, or contact force | Does it ensure stability, latency tolerance, disturbance recovery, and constraint satisfaction? |

The Controller must be listed separately because generating worlds, simulating futures, and selecting plans cannot replace high-frequency physical execution. This is especially true for humanoid robots: a world model may provide visual subgoals or short-horizon trajectories, but the Whole-Body Controller remains responsible for balance, contact switching, torque limits, and disturbance recovery.

# 6. The Generative Simulator Approach: From Video Distributions to Interactive Environments

UniSim, Genie, Genie 2, and Cosmos represent another path to scale: using large generative models to convert video priors into controllable environments, training data, or Physical AI infrastructure. Collectively, they show that internet and real-world video contain rich regularities of objects, motion, and scene changes, but “controllability” exists at several levels of strength.

| Approach | Source of Actions | Primary Output | Essential Audit |
|-|-|-|-|
| UniSim | Actions or control conditions in the data | Generative interactive simulator | Action semantics, long-horizon consistency, and sim-to-real gains |
| Genie | Latent actions discovered from video | Interactive generative environment | How latent actions map to real embodiments and control frequencies |
| Genie 2 | User/agent interaction conditions | Large-scale interactive world generation | Environmental consistency, task evaluability, and physical fidelity |
| Cosmos | Multiple conditioning modalities and Physical AI data | World foundation models and data infrastructure | Synthetic-data bias, conditioning correctness, and downstream closed-loop gains |

Generating realistic futures proves only that the model fits a visual distribution. To qualify as a world model for control, actions must become genuine intervention variables: when the initial observation is held fixed and the action is replaced, the predicted world should branch in the physically correct direction. The predictions must also be consumed by a planner or policy and ultimately change real-world task outcomes.

# 7. Yann LeCun and Fei-Fei Li: How the Two Approaches Converge

| Comparison Dimension | Yann LeCun/JEPA Lineage | Fei-Fei Li/Spatial Intelligence Lineage | Requirement After Convergence |
|-|-|-|-|
| Primary question | Which abstract representations are most valuable to predict? | What kind of 3D world must intelligence understand? | Learn a state that is both predictable and spatially grounded |
| View of pixel generation | Unpredictable details need not be reconstructed | Rendering is one interface for querying the world | Pixel output is optional; world structure is essential |
| Time | Learn dynamic regularities through video prediction | Objects and space must persist across viewpoints and time | Form a persistent, time-varying 3D state |
| Action | Requires an additional action-conditioned model to connect to planning | Must advance from an explorable world to an intervention-capable world | Make action a causal intervention variable |
| Control gap | Abstract representations may ignore fine-grained contact | Geometric worlds may lack mechanics and actuator constraints | Integrate embodiment, force sensing, latency, and closed-loop feedback |

Their point of convergence can be summarized as follows: **JEPA addresses “do not predict irrelevant details,” while spatial intelligence addresses “do not discard world structure.”** For Physical AI, a good world state must be compressed while preserving objects, geometry, contact, and reachability; it must predict both natural evolution and the effects of action interventions; and it must support high-level planning while connecting downward to controllers.

# 8. From Representation to Control: Four Gates That Must Be Crossed

1. **Predictive representation.** The model can predict objects, motion, or abstract futures from history rather than merely memorizing dataset textures.
2. **Action grounding.** Robot actions, proprioceptive states, and temporal alignment enter the model; when an action changes, the prediction changes counterfactually in the correct way.
3. **Decision interface.** Predictions are actually consumed by MPC, search, a value function, a policy, or an action head rather than being used only for visualization.
4. **Physical closed loop.** The system improves success rates, recovery rates, and safety under real-world contact, latency, disturbances, and out-of-distribution conditions.

Any work that completes only the first two steps may be an excellent world representation or simulator, but it should not directly claim to have produced a physical world model suitable for control.

# 9. Why the Next Step Naturally Leads to 4D and World Action Models

JEPA provides efficient predictive representations, spatial intelligence demands persistent 3D structure, generative simulators provide high-capacity future generation, and decision world models provide planning and value interfaces. Their natural point of convergence is a model that jointly handles observation histories, time-varying 3D worlds, actions, and task conditions.

Here, 4D means 3D + time: rather than merely generating 2D video, the model must maintain geometric consistency across viewpoints and time. A World Action Model goes further by placing future world states and action generation in a joint model. Together, they address the coupling between “how the spatial world changes” and “how the robot acts,” but they still do not constitute complete physics: mass, friction, contact forces, compliance, actuator dynamics, and latency may remain unidentifiable.

B7 will specifically examine WAM4D, X-WAM, causal visibility, asynchronous denoising, geometric supervision, World–Action consistency, Whole-Body Control interfaces, and real-world closed-loop evaluation. This lesson only establishes the entry point, avoiding overlap with B7.

# 10. A Review Checklist That Avoids Being Misled by Model Names

| Question | Minimum Evidence | Common Misinterpretation |
|-|-|-|
| What is represented? | Probes, visualizations, or ablations demonstrating the presence of objects, geometry, and action-relevant variables | A high-dimensional latent space necessarily contains complete information |
| What is predicted? | Multi-step, hierarchical, and out-of-distribution prediction error | A sharp single frame implies long-horizon correctness |
| Are actions causal? | Intervention experiments that change the action while holding observations fixed, or shuffle action-video pairings | Including an action token in the input means the model understands actions |
| Who consumes the output? | An explicit interface to a planner, value function, policy, or controller | Showing generated video qualifies as planning |
| How does it enter the closed loop? | Sensor frequency, inference latency, replanning frequency, and low-level control interface | An offline benchmark can replace an execution system |
| Does it improve control? | Real-world success rates, recovery rates, safety, and calibration under fixed data and compute budgets | Better geometry or video metrics necessarily produce control gains |

# 11. Recommended Reading Order

First read B0 to establish a unified definition, then B1/B2 to understand latent dynamics and model-based planning. Use B5 to study the decision-oriented lineage of World Models, Dreamer, MuZero, and TD-MPC. Use this lesson to understand the modern convergence of JEPA, spatial intelligence, and generative simulators. Finally, read B7 to examine system interfaces among 4D world states, WAMs, and Whole-Body Control.

# 12. Key Resources

- [A Path Towards Autonomous Machine Intelligence](https://openreview.net/forum?id=BZ5a1r-kVsf)
- [Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture](https://arxiv.org/abs/2301.08243)
- [Revisiting Feature Prediction for Learning Visual Representations from Video](https://arxiv.org/abs/2404.08471)
- [V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning](https://arxiv.org/abs/2506.09985)
- [Meta: V-JEPA 2 World Models and Benchmarks](https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/)
- [Fei-Fei Li: With Spatial Intelligence, AI Will Understand the Real World](https://www.ted.com/talks/fei_fei_li_with_spatial_intelligence_ai_will_understand_the_real_world)
- [World Labs: Marble World Model](https://www.worldlabs.ai/blog/marble-world-model)
- [World Labs: A Functional Taxonomy of World Models](https://www.worldlabs.ai/blog/taxonomy-of-world-models)
- [UniSim](https://universal-simulator.github.io/unisim/)
- [Genie](https://sites.google.com/view/genie-2024/)
- [Genie 2](https://deepmind.google/discover/blog/genie-2-a-large-scale-foundation-world-model/)
- [NVIDIA Cosmos](https://www.nvidia.com/en-us/ai/cosmos/)

# 13. Review Questions

1. Why does JEPA’s approach of “predicting abstract representations” not mean that it has already learned robot control?
2. Compared with 2D visual recognition, which variables does Fei-Fei Li’s concept of spatial intelligence require to persist?
3. Why is an excellent Renderer not necessarily a Simulator, and an excellent Simulator not necessarily a Planner?
4. Design an experiment to distinguish whether a model is actually using action conditions or merely continuing common video patterns from its dataset.
5. Explain why 4D geometry is an important but insufficient condition for a physical world model.
6. In a humanoid robot, how should responsibilities be divided among the world model, MPC, and the Whole-Body Controller?
