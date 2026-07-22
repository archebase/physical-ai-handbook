---
title: "G2 | Data Engines, Reproducibility, and Versioning: Preserving the Training Facts of Physical AI"
sourceToken: SuTNdWNMEoY6KixxjJecCKbLnXt
sourceRevision: 15
license: Apache-2.0
translationSource: "route-g/04-g2-数据引擎-复现与版本-physical-ai-的训练事实如何不丢失.md"
translationSourceHash: 3feda0519a79179df83a6c0df585dea02252ef1150d0f269e348625d2769baf4
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/SuTNdWNMEoY6KixxjJecCKbLnXt) · Source Revision 15

::: tip 💡
**Mechanism lesson:** Robot data is not a folder of “images plus actions.” It is an evidence chain containing time, coordinate frames, hardware, software, tasks, operators, quality states, and causal relationships. The goal of a data engine is to make it possible to trace what each model saw, how the data was aligned, and why it was selected.
:::

# Learning Objectives

After completing this lesson, you should be able to design an episode schema; handle multisensor time synchronization, coordinate frames, and action semantics; define immutable data versions and training manifests; establish lineage, quality gates, deduplication, splitting, and replay mechanisms; and determine whether growth in data scale actually adds useful information.

# 1. An Episode Is the Smallest Causal Unit

An episode should describe at least:

$$\mathcal E=(O_{0:T},Q_{0:T},A_{0:T},L,G,M,R)$$

> **Interpretation:** An episode consists of an observation sequence, a proprioceptive state sequence, an action sequence, a language or task description, a goal definition, metadata, and an outcome.

**Derivation:** Policy supervision requires not only input O and action A, but also the robot’s own state Q, the task L and goal G associated with the action, the collection and hardware conditions M, and the final outcome R. Only by binding these fields into the same indivisible causal unit can we reconstruct the information visible to the model at the time, the action semantics, and the success criterion.

Saving only image frames and actions loses task boundaries, failure causes, control frequencies, hardware states, and action semantics. The episode schema should be able to answer: What did the model see at the time? In which coordinate frame and units was the action executed? Why was the episode judged a success or failure?

# 2. Time Synchronization Determines Whether Supervision Is Correct

Policy training aims to learn the decision information corresponding to $a_t$, but camera exposure, encoding, networking, controllers, and logging all introduce latency. The actual alignment may be:

$$a_t\leftrightarrow\left(o_{t-\delta_o},q_{t-\delta_q}ight)$$

> **Interpretation:** The action actually executed at time t should be paired with the observation from the earlier time delta_o and the proprioceptive state from the earlier time delta_q, rather than being mechanically aligned by log row number.

**Derivation:** The decision chain includes acquisition, encoding, transmission, inference, and controller buffering, so the action takes effect based on a past perceptual state. Causal pairings are obtained by using hardware timestamps to estimate the latency of each signal relative to the time when the action takes effect. If post-action images are used, future information leaks into training.

If log row numbers are treated as representing the same instant, the model will learn to predict an action from an image captured after the action occurred. Offline loss may be very low, but the causal input will be unavailable at deployment time. Device clocks, the master clock, sampling times, arrival times, and estimated latencies should all be retained.

# 3. Coordinate Frames and Action Schemas

| Field | Must Be Specified |
|-|-|
| Reference frame | base, world, camera, tool, object |
| Action type | absolute/incremental, position/velocity/torque/impedance |
| Rotation representation | Euler, axis-angle, quaternion, 6D |
| Units | m/mm, rad/degree, N/Nm |
| Frequency | raw sampling rate, policy frequency, control frequency |
| Gripper semantics | width, velocity, force, or discrete open/close |

In cross-embodiment training, padding provides only tensor compatibility; the schema specifies what each dimension physically represents.

# 4. A Data Version Is Not a Folder Date

A reproducible data version should be defined by a content-addressed manifest:

$$v=H(\text{episode hashes},\text{schema},\text{transforms},\text{filters},\text{split})$$

> **Interpretation:** A data version is the content address obtained by applying a deterministic hash function to episode content hashes, the schema, all transformations, filtering rules, and splitting rules.

**Derivation:** First compute a digest for the immutable episode content. Then serialize the ordered manifest and all processing configurations into a canonical representation and hash them as well. Any change to an input byte, rule, or ordering changes the digest; exactly the same facts and processing should produce the same version, thereby supporting deduplication, caching, and auditing.

Any change to filtering, resampling, label correction, coordinate transformation, or splitting must produce a new version and must not overwrite data in place. Content addressing also requires canonical serialization and a fixed hash algorithm; otherwise, the same manifest may produce different digests solely because its fields are ordered differently.

![Course Whiteboard](/media/QyplwuJhPhKMBLbAl69ceNbPnSb.jpg)

# 5. Training Experiment Contract

A model artifact must be bound to:

- The code commit, container image, and dependency lockfile.
- The data manifest and sampling weights.
- The model architecture, initialization checkpoint, and tokenizer.
- The optimizer, learning-rate schedule, random seeds, and precision mode.
- The hardware topology, batch semantics, and gradient accumulation.
- The evaluation code, task version, and release thresholds.

“The same YAML” does not guarantee reproducibility if the underlying data, dependencies, pretrained weights, or nondeterministic operators differ.

# 6. Data Quality Is Multidimensional

| Dimension | Examples | Detection |
|-|-|-|
| Completeness | dropped frames, missing actions, truncation | sequence lengths and timestamp monotonicity |
| Consistency | incorrect units, incorrect coordinates, reversed gripper direction | schema validation and physical bounds |
| Causal alignment | image captured after the action | latency sweeps and cross-correlation |
| Task validity | mismatch between language and trajectory | spot checks, model-assisted review, and replay |
| Coverage | only one object/operator or only successful trials | distribution reports and embedding visualizations |

# 7. Deduplication, Leakage, and Splitting

Similarity between adjacent frames does not itself constitute data leakage. The real danger is allowing the same episode, the same collection script, or near-duplicate objects to appear in both training and test sets. Splitting should be performed upstream in the causal chain, for example through group splits by object instance, scene, operator, robot, date, or collection batch.

Near-duplicate detection can combine content hashes, perceptual hashes, trajectory features, and metadata keys. Every automated deduplication operation must retain an audit log to avoid deleting recovery actions that are similar but critical.

# 8. Data Mixing and Effective Sample Size

Multisource training commonly uses:

$$p_{\mathrm{mix}}(d)=\frac{w_d n_d^\alpha}{\sum_j w_j n_j^\alpha}$$

> **Interpretation:** The sampling probability for data source d equals its manual weight multiplied by its data volume raised to the power alpha, divided by the sum of the corresponding scores for all data sources.

**Derivation:** Sampling in proportion to raw scale corresponds to alpha equal to one, while sampling all data sources with approximately equal probability corresponds to alpha equal to zero. Raising n_d to a power interpolates between the two, after which it is multiplied by the manual quality or task weight w_d and normalized into a probability distribution. This equation controls how often data is seen; it does not imply that every sample contributes the same amount of new information.

Setting alpha below one prevents a large data source from completely overwhelming a small but important source. However, teams must still report how often each source was actually sampled, its coverage of distinct tasks and objects, and the loss of information caused by repeated trajectories, rather than reporting only raw hours.

**Effective sample size.** When samples are weighted during training or evaluation, highly concentrated weights reduce the true amount of information. If the unnormalized weight is omega_i:

$$N_{\mathrm{eff}}=\frac{\left(\sum_i\omega_i\right)^2}{\sum_i\omega_i^2}$$

> **Interpretation:** The effective sample size equals the square of the sum of the weights divided by the sum of the squared weights.

**Derivation:** The variance of the weighted mean of independent, identically distributed samples is proportional to the sum of the squared weights. Equating this variance with the variance of the mean of N_eff equally weighted samples and rearranging yields the formula. When all weights are equal, N_eff equals the number of samples; when a small number of samples carry most of the weight, N_eff decreases substantially.

# 9. How Failure Data Enters the Next Version

Failure feedback should pass through the following stages: collection triggering, automatic clustering, severity classification, root-cause annotation, representative selection, corrective-data design, retraining, and targeted regression testing. Directly upweighting all failures during training amplifies repeated patterns and may also teach the model to approach failure states without providing recovery labels.

# 10. Minimal Data Engine Experiment

**Test data.** Generate a set of episodes containing vision, proprioception, actions, tasks, outcomes, and complete timestamps, while retaining an immutable raw layer. Then inject known errors to verify whether the data engine can detect, isolate, and trace them.

| Injection or Operation | Invariant That Must Be Verified | Output Metrics |
|-|-|-|
| 100 ms image misalignment, control timestamp drift, and dropped frames | The aligner must not pair actions with future observations and must be able to flag uncertain time windows | latency estimation error, misalignment detection rate, and false-positive rate |
| Confusion between meters/millimeters, degrees/radians, and base/world coordinates | Schema validation and physical bounds must block errors before training | field-level hit rate, missed-error types, and affected episodes |
| Duplicated episodes, near-duplicate recovery trajectories, and splitting within the same burst | Deduplication must retain audit logs, and group splits must prevent leakage from causally upstream groups | duplicate recall, erroneous deletion rate, and train-test similarity |
| Changes to labels, filters, transformations, or splits | Every change must generate a new content address, while old versions remain fully readable | version determinism, change manifest, and rollback success rate |
| Changes to data-mixing weights and alpha | The manifest must record expected and actual sampling distributions | per-source sample counts, task coverage, and effective sample size |
| Reverse lookup from a checkpoint | The data version, code, configuration, initialization, hardware, and evaluation protocol must be identifiable | lineage completeness rate and number of missing edges |

**Minimal outputs.** A version-difference report, data-quality dashboard, split-leakage report, actual mixture distribution, lineage directed graph, and a complete trace from an online failure to corrective data, a new model, and regression testing.

**Passing criteria.** Raw data is immutable; version hashes are reproducible; every checkpoint can be traced backward; validator recall on known errors reaches the predefined threshold; and there is no leakage between the test and training sets involving a shared source burst, object instance, or manual correction.

# 11. Failure Modes

| Failure Mode | Immediate Consequence | Decisive Check | Remediation |
|-|-|-|-|
| A cleaning script overwrites raw data in place | The original facts cannot be recovered, and all subsequent versions lose their audit foundation | Inspect object-storage immutability policies and write logs | Make raw storage append-only; write transformed outputs to a new layer and record the parent version |
| Corrected labels reuse the old version number | The same version name refers to different training facts | Recompute the content hash and compare manifests | Use content addressing; require a new version for every label or rule change |
| Training and test sets share a collection burst | Background, operator, and trajectory-template leakage inflate offline scores | Compute lineage intersections by burst, date, object, and operator | Perform group splitting upstream in the causal chain, then generate frames after splitting |
| Only data hours are counted | Repeated stationary segments and a single task are mistaken for scale growth | Report distinct episodes, tasks, objects, action entropy, and N_eff | Prioritize collection according to effective coverage and marginal benefit |
| Cross-robot normalization discards units and limits | The same tensor dimension corresponds to different physical commands | Invert canonical actions back into each original robot’s action space and replay them | Retain the embodiment-adapter version, units, coordinates, and validity mask |
| Deployment logs cannot associate models with firmware | Online regressions cannot be reproduced, and algorithmic issues cannot be distinguished from system issues | Randomly sample failures and replay their complete lineage | At runtime, record the model, configuration, firmware, calibration, and data versions |

# 12. Exercises

1. Define a hardware-extensible action schema for a dual-arm robot.
2. Explain why both sampling time and arrival time must be retained.
3. Design a splitting rule that prevents object-instance leakage.
4. Derive the meanings of $\alpha=0$ and $\alpha=1$ in temperature-based sampling.
5. Draw the complete lineage from an online failure to the release of a new model.

# Relationship to Other Tracks

Track E determines which representations can transfer across embodiments, while G2 ensures that the original semantics are not lost in the pipeline. The supervision signals in Tracks A/B/C/D all depend on the episode contract. The control frequencies, timestamps, and hardware versions in Track F are part of the data schema.

# 13. Evidence Matrix for Data Governance and Robot Data Research

| Work | Paper Facts | Authors’ Interpretation | Course Assessment |
|-|-|-|-|
| Gebru et al.｜Datasheets for Datasets | This work proposes using standardized documentation to record a dataset’s motivation, composition, collection, preprocessing, uses, and maintenance. | The authors treat a dataset as an engineering artifact that requires clear responsibility boundaries and usage instructions, rather than as an anonymous collection of files. | A robot dataset datasheet must additionally include action semantics, coordinate frames, frequencies, embodiment, time synchronization, and safety labels. |
| Sambasivan et al.｜Data Cascades | This study documents how upstream data problems in high-stakes AI projects produce long-lasting, compound, and difficult-to-remediate downstream failures. | The authors emphasize that the low visibility of data work and organizational incentives amplify technical debt. | A validator is not a one-time cleaning script; data ownership, versioning, and feedback processes must become a continuously operating system. |
| Polyzotis et al.｜Production ML Data Management | This work summarizes challenges in data validation, features, lineage, training services, and skew management in production machine learning. | The authors note that model behavior depends on a complex production graph jointly formed by data and code. | A checkpoint alone is not a reproducible artifact; it must be bound to data, code, configuration, dependencies, and evaluation. |
| Open X-Embodiment | This work unifies multisource robot data and trains cross-embodiment RT-X policies. | The authors explore cross-robot transfer through standardized data formats and heterogeneous data mixtures. | Tensor alignment is not semantic alignment; embodiment adapters and original action contracts must be versioned. |
| DROID | DROID establishes a standardized real-world robot data-collection system spanning many scenes, tasks, and operators. | The authors use standardized hardware and collection protocols to reduce cross-site data variation. | Even with a standardized platform, site, operator, calibration, firmware, and time-synchronization information must be recorded to construct genuine holdout sets. |
| RoboMimic | RoboMimic demonstrates that offline robot-learning results are highly sensitive to data quality, observations, and training settings. | The authors use a unified benchmark to disentangle algorithmic factors from data factors. | If data versions, preprocessing, and initial-state evaluation are not fixed, “reproducing the algorithm” does not provide a meaningful comparison. |

# 14. Cross-Reading

**Read together with Track E.** Cross-embodiment learning depends on embodiment adapters and on preserving original action semantics throughout standardization.

**Read together with F3.** Temporal alignment, actuator versions, and system-identification parameters are both control facts and parts of the data schema.

**Read together with G1.** Splitting and deduplication determine whether statistical trials are independent, while data lineage determines whether multiple trials and the selection process can be audited.

**Read together with G3-G4.** Data generated by deployment monitoring can enter safe retraining and rollback workflows only when it is bound to the model, firmware, and failure root cause.
