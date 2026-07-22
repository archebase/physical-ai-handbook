---
title: "A1｜Action Representation and Generative Policies: From Continuous Control to the FAST Tokenizer"
sourceToken: Oes8d8LFno763NxcWFucK7kMnZy
sourceRevision: 24
license: Apache-2.0
translationSource: "route-a/02-a1-动作表示与生成式策略-从连续控制到-fast-tokenizer.md"
translationSourceHash: 9ae4199f119aea0cd8902802b77b52fb47440aa4b6c7e7831446ea3de8f8600f
---

> [Original Feishu Document](https://archebase.feishu.cn/docx/Oes8d8LFno763NxcWFucK7kMnZy) · Source Revision 24

::: tip 💡
**Course positioning:** This chapter investigates which random variables should be used to represent actions. FAST is an important case study, but not the complete answer. Readers will compare point regression, autoregressive tokens, Diffusion, and Flow Matching to understand how the choice of representation determines the loss function, inference speed, multimodal expressiveness, and cross-robot transfer.
:::

# 1. What Is an Action? From Control Variables to Random Variables

**Learning objectives:** After completing this chapter, readers should be able to distinguish among position, velocity, torque, and end-effector delta actions; derive action tokens from quantization rules; derive autoregressive cross-entropy; explain why DCT compresses smooth trajectories; and compare the statistical assumptions and inference costs of token-based, Diffusion, and Flow policies.

An H-step, d-dimensional action chunk contains H times d continuous values. If every value is independently quantized into a token, the sequence becomes very long. Moreover, because adjacent actions are highly correlated, the model wastes substantial capacity repeatedly representing smooth trajectories.

Actions do not naturally exist as sequences of tokens. Engineers first select the control interface and then determine which random variables the model should learn. Common actions include joint positions $q^{cmd}$, joint velocities $\dot q^{cmd}$, torques $\tau^{cmd}$, end-effector pose deltas $\Delta x$, and gripper commands. The same robot trajectory corresponds to different data distributions under different control interfaces.

| Action interface | Advantages | Implicit dependencies | Common risks |
|-|-|-|-|
| Joint position | Stable and easy to collect | Low-level position controller | Inconsistent semantics across robots |
| Joint velocity | Local and directly responsive | Control frequency and integration | Drift caused by latency |
| End-effector delta | Intuitive for object manipulation | Inverse kinematics and coordinate frames | Singularities and unreachable poses |
| Torque or force | Suitable for contact control | High-frequency feedback and dynamics | Difficult safety management and cross-platform transfer |

For an action chunk $A_t=[a_t,\ldots,a_{t+H-1}]\in\mathbb{R}^{H\times d}$, the representation must simultaneously handle continuous precision, temporal correlation, multimodal solutions, inference latency, and dimensional differences among embodiments.

# 2. The Three Steps of FAST

1. **Discrete cosine transform:** Transform the action trajectory along the temporal dimension into the frequency domain, concentrating smooth motion into a small number of low-frequency coefficients.
2. **Quantization:** Scale and quantize the frequency-domain coefficients according to the statistical range of each action dimension.
3. **Byte-pair encoding:** Apply BPE to common coefficient combinations to further reduce the number of tokens.

For a single action dimension x, the DCT can be written as:

$$X_k=\sum_{n=0}^{H-1}x_n\cos\left[\frac{\pi}{H}\left(n+\frac12\right)k\right]$$

> **Reading:** The k-th DCT coefficient equals the sum of the elementwise products between the entire H-step action sequence and the k-th cosine basis function.

**Derivation:** DCT-II projects a time series onto cosine bases of different frequencies. Different implementations may include normalization factors in either the forward or inverse transform; as long as encoding and decoding use the same convention, the reconstruction relationship remains unchanged.

Low-frequency X_k coefficients describe the overall direction and velocity, while high-frequency coefficients describe rapid changes. Robot actions are typically temporally smooth and are therefore more compressible than with direct pointwise quantization.

### Formula Visualization｜How DCT Projects a Temporal Trajectory onto Frequency Bases

![Course Whiteboard](/media/Xxhuw9Vmvh543ib4vtycKOoPnRc.jpg)

# 3. Four Approaches to Parameterizing Action Distributions

Action representation is not merely a data-compression problem. It determines which mathematical object the model fits directly and how actions are obtained during inference.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCiAgICBDW09ic2VydmF0aW9uIGFuZCB0YXNrIGNvbnRleHRdIC0tPiBSW1BvaW50IHJlZ3Jlc3Npb25dCiAgICBDIC0tPiBBUltBdXRvcmVncmVzc2l2ZSBhY3Rpb24gdG9rZW5zXQogICAgQyAtLT4gRElbRGlmZnVzaW9uIFBvbGljeV0KICAgIEMgLS0+IEZNW0Zsb3cgTWF0Y2hpbmcgUG9saWN5XQogICAgUiAtLT4gQTFbT2J0YWluIHRoZSBtZWFuIGFjdGlvbiBpbiBvbmUgZm9yd2FyZCBwYXNzXQogICAgQVIgLS0+IEEyW0RlY29kZSB0b2tlbiBieSB0b2tlbl0KICAgIERJIC0tPiBBM1tNdWx0aS1zdGVwIGRlbm9pc2luZ10KICAgIEZNIC0tPiBBNFtJbnRlZ3JhdGUgdGhlIHZlY3RvciBmaWVsZF0=" />

::: tip 💡<p><b>Interactive Validation｜Action Representation and FAST Tokenizer Lab</b></p><p>Vary the codebook size, action-chunk length, and action complexity to observe the trade-offs among quantization compression, reconstruction error, and temporal consistency.</p><p><a href="https://archebase.feishuapp.com/app/app_17aeahgcwtv">Action Representation and FAST Tokenizer Lab</a></p><p><button action="OpenLink" src="https://archebase.feishuapp.com/app/app_17aeahgcwtv">Open the Interactive Lab</button></p><bookmark name="Action Representation and FAST Tokenizer Lab" href="https://archebase.feishuapp.com/app/app_17aeahgcwtv"></bookmark>:::

## 3.1 Point Regression

The model outputs the conditional mean $\mu_\theta(c)$ and is trained with MSE:

$$\mathcal L_{\mathrm{MSE}}=\mathbb E\left[\left\|a-\mu_\theta(c)\right\|_2^2\right]$$

> **Reading:** Mean squared error averages, over the context and ground-truth action data, the squared distance between the ground-truth action and the model's conditional mean.

**Derivation:** If the conditional action follows a Gaussian distribution with fixed variance, its negative log-likelihood, after removing constants, is proportional to this squared error.

This is equivalent to assuming a unimodal Gaussian distribution with fixed variance. Its advantage is low latency because it requires only one forward pass; its disadvantage is that multiple valid trajectories may be averaged together.

## 3.2 Autoregressive Action Tokens

First, an encoder $T$ converts an action chunk into a discrete sequence $y_{1:M}=T(A)$, after which the model learns:

$$p_\theta(y_{1:M}\mid c)=\prod_{m=1}^{M}p_\theta(y_m\mid y_{<m},c)$$

> **Reading:** The probability of the complete action-token sequence equals the product of each token's probability conditioned on the preceding tokens and the context.

**Derivation:** This follows by expanding the joint distribution of the discrete sequence using the probability chain rule.

The cross-entropy loss is:

$$\mathcal L_{\mathrm{AR}}=-\mathbb E\left[\sum_{m=1}^{M}\log p_\theta(y_m\mid y_{<m},c)\right]$$

> **Reading:** The autoregressive loss sums the negative log conditional probability of each ground-truth action token and then averages over the training samples.

**Derivation:** Taking the logarithm of the preceding joint probability expression converts the product into a sum; maximizing sequence likelihood is therefore equivalent to minimizing per-token cross-entropy.

This can be read as: “Given the context and the action tokens already generated, increase the probability of the next ground-truth token.” This approach can directly reuse language-model training infrastructure, but inference latency increases with the number of tokens, and errors in early tokens alter the conditioning for subsequent tokens.

## 3.3 Diffusion Policy

Diffusion typically trains a network to predict noise or the score, progressively restoring a noisy action to a data sample. Using noise prediction as an example:

$$A^{(\tau)}=\sqrt{\bar\alpha_\tau}\,A+\sqrt{1-\bar\alpha_\tau}\,\varepsilon,\qquad \varepsilon\sim\mathcal N(0,I)$$

> **Reading:** The noisy action at diffusion time tau is obtained by adding scaled standard Gaussian noise to a scaled version of the ground-truth action.

**Derivation:** The forward diffusion process adds Gaussian noise at each step. By combining the multi-step Gaussian transitions, an action at any noise level can be sampled directly from the ground-truth action. bar alpha controls how much data is retained and how much noise is added.

$$\mathcal L_{\mathrm{diff}}=\mathbb E_{A,\varepsilon,\tau}\left[\left\|\varepsilon-\varepsilon_\theta(A^{(\tau)},\tau,c)\right\|_2^2\right]$$

> **Reading:** The Diffusion loss, averaged over actions, noise, and diffusion time, encourages the network's predicted noise to match the Gaussian noise that was actually added.

**Derivation:** Because the noise is sampled by us during training, it provides a known supervision signal. After learning noise prediction at every noise level, the model can generate actions through repeated denoising during inference.

The model learns “which part of the noise should be removed” at different noise levels. It can represent multimodal continuous actions, but it requires multi-step sampling, and control latency depends on the number of denoising steps and the network size.

## 3.4 Flow Matching Policy

Flow Matching learns a continuous-time vector field that transports a simple noise distribution into the action distribution:

$$\frac{dA^{(\tau)}}{d\tau}=v_\theta(A^{(\tau)},\tau,c)$$

> **Reading:** The rate of change of the action state along flow time tau equals the velocity predicted by the model given the current action state, time, and context.

**Derivation:** During training, a probability path between noise and ground-truth actions is constructed, and the velocity along that path is fitted. During inference, this ordinary differential equation is integrated from an initial noise sample. Flow Matching does not require the stochastic forward process used by Diffusion.

| Method | Direct fitting target | Inference | Multimodality | Primary cost |
|-|-|-|-|-|
| MSE | Conditional mean | One forward pass | Weak | Averaged actions |
| Autoregressive tokens | Discrete-sequence probability | Token by token | Strong | Quantization error and serial latency |
| Diffusion | Noise or score | Multi-step denoising | Strong | Sampling computation |
| Flow Matching | Probability-flow vector field | ODE integration | Strong | Integration steps and numerical error |

These are not mutually exclusive approaches to Physical AI; rather, they are different parameterizations of the action distribution within the direct-policy paradigm. A tokenizer can also serve as a pretraining interface, while continuous Flow or Diffusion handles the final fine-grained control.

# 4. Differences Between π0-FAST and π0 Flow

| Dimension | π0 Flow | π0-FAST |
|-|-|-|
| Action representation | Continuous action chunks | Discrete FAST tokens |
| Training objective | Flow Matching | Cross-entropy |
| Inference method | Multi-step integration | Autoregressive token generation |
| Advantages | Fine-grained continuous actions and parallel action-chunk generation | Unified with the standard VLM training paradigm, facilitating heterogeneous co-training |

# 5. FAST+ and a Universal Action Vocabulary

FAST+ uses large-scale cross-robot trajectories to train a universal action tokenizer. It attempts to decouple the tokenizer from any single robot or action space, allowing data with different control frequencies, degrees of freedom, and action ranges to enter a unified autoregressive training pipeline.

# 6. What Role Does FAST Play in Mixed Pretraining?

The first stage of π0.5 must simultaneously learn web question answering, vision-language tasks, high-level subtasks, and multi-robot actions. FAST converts robot actions into discrete tokens as well, allowing these heterogeneous supervision signals to share a unified cross-entropy training objective. The second stage then introduces a Flow Matching Action Expert to recover continuous-action precision.

::: tip 🔍
FAST does not claim that discrete actions are necessarily superior to continuous actions. Instead, it provides a bridge: first use unified tokens to learn broad knowledge, and then use a continuous Action Expert to specialize the controller.
:::

# 7. How Should Tokenizers and Generative Policies Be Evaluated?

Compression ratio is not the only objective. An action representation is useful for Physical AI only if it preserves control-relevant information after compression.

| Evaluation level | Question | Recommended metrics |
|-|-|-|
| Reconstruction | Can the original action be recovered from the tokens? | Position, velocity, orientation, and torque reconstruction errors |
| Statistical | Are token sequences too long or their distributions imbalanced? | Sequence length, entropy, long-tail frequency, and vocabulary reuse across tasks |
| Generation | Can the representation express multiple valid trajectories? | Mode coverage, conditional consistency, and sample diversity |
| Control | Do reconstruction or generation errors affect success rates? | Task success rate, smoothness, collision rate, and recovery rate |
| Transfer | Can token semantics be reused across robots? | Cross-embodiment linear probes, few-shot adaptation, and zero-shot failure distributions |

Open-loop representation error and closed-loop task error must be reported separately. A model with highly accurate token reconstruction may still be less reliable than one with greater reconstruction error if it introduces even a slight delay during transitions between contact states.

## Supplementary Chapter Exercises

1. Given two action trajectories that pass an obstacle on the left and right, respectively, explain how MSE, AR tokens, Diffusion, and Flow would represent them.
2. Derive the upper bound on quantization error for a uniform quantization step $\Delta$, and discuss how it changes with the action range.
3. Design a control-relevant tokenizer evaluation: while keeping the number of tokens fixed, compare whether contact events are preserved.
4. Explain why sharing a vocabulary across robots does not mean that cross-robot action semantics have already been aligned.

## Exercises

1. Construct a smooth sinusoidal action and a high-frequency jittering action, and compare the sparsity of their DCT coefficients.
2. Analyze the potential control-latency bottlenecks of autoregressive FAST.
3. Explain why a universal tokenizer still cannot automatically solve cross-robot action-semantic alignment.

## Original Sources

<bookmark name="Official FAST Paper" href="https://arxiv.org/abs/2501.09747"></bookmark>

<bookmark name="OpenPI" href="https://github.com/Physical-Intelligence/openpi"></bookmark>

# Minimal Reproduction Experiment｜Bimodal Action Distribution

Construct a 2D obstacle-avoidance dataset: given the same starting point, endpoint, and obstacle, half of the expert trajectories pass on the left and the other half pass on the right. The conditional action distribution therefore has two valid modes.

1. Regress action chunks with MSE and observe whether the predictions pass through the obstacle between the two modes.
2. Quantize the actions into tokens, generate them autoregressively, and plot the quantization error and decoding latency.
3. Sample 100 trajectories using Diffusion and Flow Matching, and plot the trajectory density and mode coverage.
4. Use the same model parameter count and training data to compare success rate, mode entropy, inference latency, and trajectory smoothness.
5. Vary the token codebook, number of diffusion steps, and number of ODE integration steps, and plot the quality-latency Pareto curve.

This experiment should allow readers to see directly that MSE learns the conditional mean, discrete tokens learn sequence probabilities, Diffusion learns denoising/the score, and Flow Matching learns a vector field that transports noise into the action distribution. Different representations require the model to learn different mathematical objects.
