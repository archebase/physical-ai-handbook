---
title: "A3.6｜OpenPI in Practice: From Data Contracts to the Robotic Closed Loop"
sourceToken: LJ64dCo1pocD71xb2XvcPN9lndr
sourceRevision: 8
license: Apache-2.0
translationSource: "route-g/02-a3-6-openpi-实践-从数据契约到机器人闭环.md"
translationSourceHash: da194c50f4f313331527ea5c98dfc62687eddb9b6d88b9b5ee4d623c804c72ff
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/LJ64dCo1pocD71xb2XvcPN9lndr) · Source Revision 8

::: tip 💡
**Chapter objective:** Map the mechanisms described in the papers to an executable training pipeline, and clarify what data, metadata, and evaluation evidence ArcheBase should produce.
:::

# 1. What OpenPI Currently Provides

- **Public models:** π0, π0-FAST, and π0.5; the current OpenPI repository does not include every model released by Physical Intelligence.
- **π0.5 limitations:** Training and inference for π0.5 in the public repository currently support only the Flow Matching head; a complete FAST pretraining recipe is not provided.
- **Frameworks:** A native JAX path and PyTorch implementations of π0 and π0.5; PyTorch currently does not support π0-FAST, LoRA, FSDP, mixed precision, or EMA.
- **Base checkpoints:** The official documentation states that the models were pretrained on more than 10,000 hours of robot data, and provides adaptation or fine-tuning examples for DROID, ALOHA, LIBERO, and other datasets.
- **Resource requirements:** Official single-GPU estimates are more than 8 GB of VRAM for inference, more than 22.5 GB for LoRA fine-tuning, and more than 70 GB for full fine-tuning; actual consumption varies by configuration.
- **System interfaces:** LeRobot data conversion, normalization assets, training configurations, and a remote Policy Server.

These are the capability boundaries described in the current public README. This course does not present π0.6\* or π0.7 features that have not been added to OpenPI as capabilities already supported by the open-source repository.

# 2. Minimal Training Loop

1. Convert the raw data into a LeRobot Dataset.
2. Define field mappings for observations, states, actions, and prompts.
3. Compute normalization statistics for states and actions.
4. Select a π0 or π0.5 Base Checkpoint.
5. Perform LoRA or full fine-tuning.
6. Launch the Policy Server and conduct closed-loop evaluation in simulation or on a real robot.

```bash
uv run scripts/compute_norm_stats.py --config-name pi05_libero
XLA_PYTHON_CLIENT_MEM_FRACTION=0.9 uv run scripts/train.py pi05_libero --exp-name=my_experiment
uv run scripts/serve_policy.py policy:checkpoint --policy.config=pi05_libero --policy.dir=checkpoints/pi05_libero/my_experiment/20000
```

## 2.1 Normalization Is the Contract Between the Model and the Robot

OpenPI supports both z-score normalization and quantile normalization. The z-score form is:

$$\tilde a_j=\frac{a_j-\mu_j}{\sigma_j+10^{-6}}$$

> **Interpretation:** Subtract the training-data mean from the j-th action dimension, then divide by the standard deviation plus a small constant that prevents division by zero.

**Derivation:** Centering removes offsets across different action dimensions, while division by the standard deviation gives each dimension approximately the same scale, preventing dimensions with large numerical values from dominating the loss.

The quantile form uses the 1st and 99th percentiles of the training set:

$$\tilde a_j=2\frac{a_j-q_{01,j}}{q_{99,j}-q_{01,j}+10^{-6}}-1$$

> **Interpretation:** Linearly map the action’s position relative to the 1st and 99th percentiles to a range of approximately negative one to positive one.

**Derivation:** First map the quantile interval to zero through one, then multiply by two and subtract one. Quantiles are less susceptible than minimum and maximum values to being dominated by a small number of outliers, but values outside the interval must still be handled explicitly in both the data pipeline and the controller.

Inference must use the same statistics associated with the checkpoint for denormalization. An incorrect dimension order, unit, or gripper direction will not trigger a tensor error, but it will directly alter the physical action executed by the robot.

## 2.2 Latency Budget for the Remote Policy Server

$$T_{\mathrm{loop}}=T_{\mathrm{capture}}+T_{\mathrm{encode}}+T_{\mathrm{network}}+T_{\mathrm{infer}}+T_{\mathrm{decode}}+T_{\mathrm{control}}$$

> **Interpretation:** The robot’s total closed-loop latency equals the sum of the latency from acquisition, preprocessing, network transmission, model inference, action decoding, and control execution.

**Derivation:** These stages occur sequentially within a single request chain, so their latencies are additive. Deployments should report P50, P95, and P99 rather than only the mean inference time.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBSW1JhdyBFcGlzb2RlcyBhbmQgVGltZXN0YW1wc10gLS0+IExbTGVSb2JvdCBEYXRhc2V0XQogICAgTCAtLT4gTVtGaWVsZCBNYXBwaW5nIGFuZCBBY3Rpb24gU2VtYW50aWNzXQogICAgTSAtLT4gTltOb3JtYWxpemF0aW9uIFN0YXRpc3RpY3NdCiAgICBOIC0tPiBUW0ZpbmUtVHVuaW5nIENvbmZpZ3VyYXRpb24gYW5kIENoZWNrcG9pbnRdCiAgICBUIC0tPiBTW1BvbGljeSBTZXJ2ZXJdCiAgICBTIC0tPiBBW0Rlbm9ybWFsaXphdGlvbi9Db29yZGluYXRlIEFkYXB0YXRpb24vTGltaXQgRW5mb3JjZW1lbnRdCiAgICBBIC0tPiBDW1JvYm90IENvbnRyb2xsZXJdCiAgICBDIC0tPiBPW0Nsb3NlZC1Mb29wIExvZ3MgYW5kIEZhaWx1cmVzXQogICAgTyAtLT4gUg==" />

# 3. Data Format Is Not the Hardest Part

Converting data to LeRobot only answers whether it can be loaded. What truly determines training outcomes is the action coordinate frame, control frequency, camera calibration, time synchronization, task language, failure labels, and train-test split.

# 4. Minimal Data Objects ArcheBase Should Maintain

| Data object | Why it matters |
|-|-|
| Frame-level multiview images | Support single-frame semantics, visual state estimation, and cross-view reasoning |
| Robot and wearable-device states | Provide action, pose, contact, and human-operation context |
| Unified timeline | Ensure that images, actions, forces, and events can be aligned |
| Task and subtask boundaries | Train π0.5-style hierarchical policies |
| Failures and human interventions | Support correction and learning from experience for π0.6\* |
| Quality and policy metadata | Support π0.7-style steerable conditioning |
| Data lineage and versions | Trace training samples, operators, models, and evaluation results |

# 5. How QC and VLM Operators Enter Production

Single-frame QC operators check for blur, occlusion, and exposure; single-frame VLM operators identify objects, hands, and contact states; adjacent-frame operators determine state changes before and after an action; multimodal operators align video, glove data, robot logs, and task phases.

The key is not to annotate all data in a single pass, but to ensure that each operator reads only the required frames, time windows, views, and sensor fields while preserving output versions. When a model changes, only the affected data slices need to be reprocessed.

# 6. Data Production Roadmap for the π Series

1. **π0 stage:** Produce high-quality action chunks, multiview observations, and embodiment-specific normalization.
2. **π0.5 stage:** Add subtask language and cross-environment, cross-embodiment data.
3. **π0.6\* stage:** Systematically record autonomous failures, task rewards, and human interventions.
4. **π0.7 stage:** Add metadata for visual subgoals, quality, policy type, and control mode.

# 7. Recommended Validation Experiments

- Compare open-environment generalization with and without subtask annotations, using the same number of trajectories.
- Compare the production cost of fine-grained frame-level reads against repeatedly decoding entire videos.
- Measure changes in recovery success rate and human intervention rate after adding failure and intervention data.
- Determine whether metadata conditioning can reliably control speed, safety, and policy selection.

::: tip ✅
The ultimate goal is not merely to “support the OpenPI data format,” but to build a data system that can continuously produce task semantics, failure experience, and verifiable evaluation assets.
:::

## Original Sources

<bookmark name="OpenPI GitHub" href="https://github.com/Physical-Intelligence/openpi"></bookmark>

<bookmark name="Official OpenPI Introduction" href="https://physicalintelligence.company/blog/openpi"></bookmark>

<bookmark name="LeRobot" href="https://github.com/huggingface/lerobot"></bookmark>
