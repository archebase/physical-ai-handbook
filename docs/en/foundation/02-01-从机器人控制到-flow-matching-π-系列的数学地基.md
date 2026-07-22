---
title: "01｜From Robot Control to Flow Matching: The Mathematical Foundations of the π Series"
sourceToken: KV1rdMZd5o9rufxEtV0cnxL8nWe
sourceRevision: 77
license: Apache-2.0
translationSource: "foundation/02-01-从机器人控制到-flow-matching-π-系列的数学地基.md"
translationSourceHash: 49f74a9f362f92faaf7a8fad44c808a69bfa30241dba8650f27f7a1e977a6c82
---

> [Original Lark Document](https://archebase.feishu.cn/docx/KV1rdMZd5o9rufxEtV0cnxL8nWe) · Source Revision 77

::: tip 🎯
**Chapter objective:** Starting from the fundamental problem of robot policy learning, derive behavior cloning, action chunks, and conditional Flow Matching, and establish the unified notation required to understand π0 and π0.5.
:::

# 1. What Exactly Is a Robot Policy Learning?

On the surface, robot policy training takes the form of “input observations, output actions.” From the perspective of statistical learning, however, what it truly learns is: **given the current observation, history, and task conditions, which future behaviors are more likely to come from successful demonstrations.**

::: tip 💡
**In one sentence:** A robot typically does not directly learn an explicit set of physical laws. Instead, its parameters encode a conditional behavior distribution that jointly compresses scene understanding, task intent, motion patterns, and biases in the demonstration data.
:::

## 1.1 From Expert Data to a Conditional Behavior Distribution

### Supplement｜Why the Probability Takes This Form

<cite doc-id="VHxJdi6dDoEz2AxGfCbcwIannwd" file-type="docx" title="01A｜Why Probabilities Look Like This: From Conditional Probability to Robot Action Distributions" type="doc"></cite>

A detailed derivation of conditional probability, continuous probability density, multimodal mixtures, the joint distribution of action chunks, maximum likelihood, and their relationship to Flow Matching.

Let the expert dataset be:

$$\mathcal{D}=\left\{\left(o_t^{(i)},l^{(i)},A_t^{(i)}\right)\right\}_{i=1}^{N}$$

> **Reading:** Dataset D consists of N samples, each containing the current observation, a language condition, and a future action chunk.

**Derivation:** A trajectory is segmented over time into supervised samples. The action-chunk length H determines the short-term time horizon covered by each prediction.

Where:

- $o_t$: the robot observation at time $t$, including multiple image streams, proprioceptive state, and historical information;
- $l$: the language task or another goal condition;
- $A_t=(a_t,\ldots,a_{t+H-1})$: the action chunk for the next $H$ steps.

Maximum-likelihood training requires the model to assign the highest possible probability to expert actions:

$$\theta^{*}=\arg\max_{\theta}\sum_{i=1}^{N}\log\pi_{\theta}\!\left(A_t^{(i)}\mid o_t^{(i)},l^{(i)}\right)$$

> **Reading:** Find parameters theta that maximize the sum of the log-probabilities of all expert action chunks under their corresponding observation and language conditions.

**Derivation:** The joint likelihood of the samples is the product of their conditional probabilities. Taking the logarithm converts this into a sum objective.

Equivalently, minimize the negative log-likelihood:

$$\mathcal{L}_{\mathrm{BC}}(\theta)=-\mathbb{E}_{(o,l,A)\sim\mathcal{D}}\left[\log\pi_{\theta}(A\mid o,l)\right]$$

> **Reading:** The behavior cloning loss is the average negative log-probability of expert action chunks; minimizing it is equivalent to maximizing likelihood.

**Derivation:** Multiply the maximum-likelihood objective by negative one, then use the empirical dataset average to approximate the expectation.

The gradient update is:

$$\nabla_{\theta}\mathcal{L}_{\mathrm{BC}}=-\mathbb{E}_{\mathcal{D}}\left[\nabla_{\theta}\log\pi_{\theta}(A\mid o,l)\right]$$

> **Reading:** The gradient of the loss with respect to the parameters equals the negative expectation of the gradient of the expert actions’ log-probability, and the optimizer updates the parameters in the opposite direction.

**Derivation:** Differentiate the negative log-likelihood term by term, using the fact that expectation and differentiation can be interchanged under standard regularity conditions.

This means that the model does not store demonstrations one by one. Instead, it continuously adjusts its parameters so that expert behaviors have higher probability under similar observations and task conditions.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCkFbRXhwZXJ0IGRlbW9uc3RyYXRpb24gZGF0YV0gLS0+IEJbVmlzdWFsIGFuZCBwcm9wcmlvY2VwdGl2ZSBvYnNlcnZhdGlvbnNdCkEgLS0+IENbTGFuZ3VhZ2UgdGFza10KQSAtLT4gRFtGdXR1cmUgYWN0aW9uIGNodW5rXQpCIC0tPiBFW1JlcHJlc2VudGF0aW9uIGxlYXJuaW5nXQpDIC0tPiBFCkQgLS0+IEZbQ29uZGl0aW9uYWwgbGlrZWxpaG9vZCBvYmplY3RpdmVdCkUgLS0+IEYKRiAtLT4gR1tHcmFkaWVudC1iYXNlZCBwYXJhbWV0ZXIgdXBkYXRlc10KRyAtLT4gSFtDb25kaXRpb25hbCBiZWhhdmlvciBkaXN0cmlidXRpb25dCkggLS0+IElbUm9ib3QgY2xvc2VkLWxvb3AgZXhlY3V0aW9uXQ==" />

## 1.2 What Capabilities Are Encoded in the Model Parameters?

| Level | What is learned | Source of supervision | What is not guaranteed |
|-|-|-|-|
| **Scene representation** | Objects, positions, occlusion, spatial relationships, and visual features | Visual pretraining, image-text data, and robot images | Does not guarantee an understanding of true 3D geometry |
| **Task conditioning** | Associations among language, objects, target states, and manipulation stages | Language annotations and task demonstrations | Does not guarantee a causal task model |
| **Affordances** | Which objects can be grasped, pulled, pushed, placed, or used | Statistics of hand-object and robot-object interactions | Does not guarantee reachability for the current robot |
| **Motion primitives** | Local patterns such as approach, grasp, lift, rotate, and release | Action trajectories and temporal structure | Does not guarantee that actions satisfy all dynamic constraints |
| **Behavior distribution** | The probabilistic structure of different strategies, speeds, grasp types, and paths | Diverse expert demonstrations | Does not guarantee coverage of recovery behaviors outside the demonstrations |

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCkFbVmlzdWFsIGFuZCBwcm9wcmlvY2VwdGl2ZSBvYnNlcnZhdGlvbnNdIC0tPiBCW1NjZW5lIGFuZCBvYmplY3QgcmVwcmVzZW50YXRpb25zXQpDW0xhbmd1YWdlIHRhc2tdIC0tPiBEW1Rhc2sgY29uZGl0aW9ucyBhbmQgdGFyZ2V0IHN0YXRlc10KQiAtLT4gRVtPYmplY3QgYWZmb3JkYW5jZXMgYW5kIHJlbGF0aXZlIGdlb21ldHJ5XQpEIC0tPiBFCkUgLS0+IEZbTW90aW9uIHByaW1pdGl2ZXMgYW5kIHRhc2sgc3RhZ2VzXQpGIC0tPiBHW0Rpc3RyaWJ1dGlvbiBvdmVyIGZ1dHVyZSBhY3Rpb24gY2h1bmtzXQpHIC0tPiBIW0xvdy1sZXZlbCBjb250cm9sbGVyIGFuZCByb2JvdCBkeW5hbWljc10KSCAtLT4gSVtPdXRjb21lIGluIHRoZSBwaHlzaWNhbCB3b3JsZF0=" />

Therefore, “the robot has learned to grasp a cup” is not a single piece of knowledge, but a combination of multiple capabilities: recognizing the cup, identifying a grasp region, choosing an approach direction, generating the timing for gripper closure, and continuing to make decisions from new observations after execution.

## 1.3 Action Chunks Capture Short-Term Behavioral Structure

A single-step policy learns:

$$\pi_{\theta}(a_t\mid o_t,l)$$

> **Reading:** The policy assigns a conditional probability to a single-step action given the observation and language condition.

**Derivation:** This is the definition of a single-step policy: the current observation and task serve as conditions, while the network parameters theta determine the action distribution. It is the special case of an action-chunk policy when H equals 1.

This is the special case of the action-chunk distribution when H=1; it does not specify how actions affect the future.

An action-chunk policy learns the joint distribution of a future action sequence:

$$\pi_{\theta}(A_t\mid o_t,l)=\pi_{\theta}(a_t,\ldots,a_{t+H-1}\mid o_t,l)$$

> **Reading:** Given the current observation and language condition, the policy assigns probability to the joint distribution of the entire action segment from t to t+H-1.

**Derivation:** Treating H consecutive actions as a single random vector allows joint modeling to preserve correlations across both action dimensions and time.

From the perspective of probability theory, it can be factorized as:

$$\pi_{\theta}(A_t\mid o_t,l)=\prod_{h=0}^{H-1}\pi_{\theta}\!\left(a_{t+h}\mid a_{t:t+h-1},o_t,l\right)$$

> **Reading:** The joint probability of an action chunk can be factorized in temporal order into the product of the conditional probability of each action given all preceding actions, the current observation, and the language condition.

**Derivation:** This is the probability chain rule. A generative action model can also sample the chunk jointly and does not actually need to decode it step by step according to this product.

In practice, Flow Matching or Diffusion Policy usually generates the entire action segment jointly, without requiring explicit step-by-step autoregression. Action chunks allow the model to learn:

- synchronization and ordering between two arms;
- short-term continuity among approach, contact, force application, and release;
- relatively stable motion intent over a period of time;
- correlations among action dimensions rather than predicting each joint independently.

However, the larger $H$ is, the smoother the short-term actions become but the slower the closed-loop feedback becomes; the smaller $H$ is, the more promptly errors can be corrected, but inference overhead and local jitter may increase. The action chunk is a choice of timescale for the control interface, not merely a training technique.

## 1.4 Why MSE Can Learn an “Average but Incorrect” Action

Suppose a deterministic model outputs $f_{\theta}(o,l)$ and uses mean squared error:

$$\mathcal{L}_{\mathrm{MSE}}=\mathbb{E}\left[\left\|A-f_{\theta}(o,l)\right\|_2^2\right]$$

> **Reading:** MSE is the expected squared Euclidean distance between the ground-truth action chunk and the action chunk output by the model.

**Derivation:** A deterministic model compresses all conditional actions into a single point, so it cannot represent sampling probabilities or multiple modes.

Let the condition be $c=(o,l)$. The risk under a fixed condition is:

$$R(f\mid c)=\mathbb{E}\left[\left\|A-f(c)\right\|_2^2\mid c\right]$$

> **Reading:** For a fixed condition c, the risk is the conditional expectation of the squared distance between the predicted action f(c) and the random ground-truth action A.

**Derivation:** Group the overall MSE by condition and first study the optimal output under each observation and language condition.

Differentiate with respect to $f(c)$:

$$\frac{\partial R}{\partial f}=2\left(f(c)-\mathbb{E}[A\mid c]\right)$$

> **Reading:** The gradient of the risk with respect to the prediction vector f(c) is twice the difference between the predicted action and the conditional mean action.

**Derivation:** Differentiate the squared norm dimension by dimension, then take the conditional expectation over the random action.

Setting the derivative to zero yields the optimal solution:

$$f^{*}(c)=\mathbb{E}[A\mid c]$$

> **Reading:** The deterministic prediction that minimizes MSE risk is the conditional mean of the action chunk under the given condition.

**Derivation:** Setting the gradient in the previous equation to zero shows that the prediction equals the conditional mean; therefore, the optimum under squared loss is not an arbitrary quantile.

Thus, MSE learns the conditional mean. If the same observation admits two successful paths, one going around the left and one around the right:

$$p(A\mid c)=\frac{1}{2}\delta(A-A^{L})+\frac{1}{2}\delta(A-A^{R})$$

> **Reading:** The action distribution consists of two discrete successful modes, each placing half of the probability mass near either the left-detour action chunk or the right-detour action chunk.

**Derivation:** A Dirac delta concentrates probability mass on a single action chunk; a mixture of two deltas represents a bimodal distribution rather than an average trajectory.

Then:

$$f^{*}(c)=\frac{A^{L}+A^{R}}{2}$$

> **Reading:** When the left and right modes are equally probable, the MSE-optimal action is the element-wise sum of the two action segments divided by two.

**Derivation:** Directly substitute the conditional expectation of the bimodal distribution into the mean formula.

This average trajectory may head directly into the obstacle, following neither the left detour nor the right detour.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IExSCkFbU2FtZSBvYnNlcnZhdGlvbiBhbmQgdGFza10gLS0+IEJbU3VjY2Vzc2Z1bCBtb2RlIDE6IGdvIGxlZnRdCkEgLS0+IENbU3VjY2Vzc2Z1bCBtb2RlIDI6IGdvIHJpZ2h0XQpCIC0tPiBEW011bHRpbW9kYWwgYWN0aW9uIGRpc3RyaWJ1dGlvbl0KQyAtLT4gRApEIC0tPiBFW01TRSBjb25kaXRpb25hbCBtZWFuXQpFIC0tPiBGW01vdmUgdG93YXJkIHRoZSBtaWRkbGVdCkYgLS0+IEdbUG9zc2libGUgY29sbGlzaW9uIG9yIGluZmVhc2libGUgZXhlY3V0aW9uXQpEIC0tPiBIW0Zsb3cgLyBEaWZmdXNpb24gc2FtcGxpbmddCkggLS0+IElbU2VsZWN0IG9uZSBjb21wbGV0ZSBzdWNjZXNzZnVsIG1vZGVd" />

The value of Flow Matching lies not merely in producing smoother actions, but in its ability to represent and sample from continuous, multimodal action distributions.

## 1.5 Training Learns the Expert Distribution, While Deployment Encounters the Policy’s Own Distribution

Behavior cloning optimizes the loss under the expert state distribution:

$$\mathcal{L}_{\mathrm{BC}}=\mathbb{E}_{o\sim d_{E}}\left[\ell\!\left(\pi_{\theta}(o),a_E\right)\right]$$

> **Reading:** The behavior cloning loss is the expected loss between policy actions and expert actions under the state distribution d_E visited by the expert.

**Derivation:** Denote the marginal observation distribution of the training samples by d_E, then average the single-step supervised loss under that distribution.

During deployment, however, the states visited by the robot are generated by its own policy:

$$o_t\sim d_{\pi_{\theta}}$$

> **Reading:** During deployment, robot observations come from the state or observation distribution induced by the current policy theta itself.

**Derivation:** During deployment, policy actions are repeatedly applied to advance the environment. The long-run visitation frequency of observations forms d_pi_theta; therefore, this distribution is jointly induced by the policy and the environment dynamics.

This distribution is not a fixed sampling distribution from the training set. It is a visitation distribution jointly determined by the policy, dynamics, and accumulated historical errors.

As soon as an early action exhibits a small deviation, subsequent images, object positions, and contact states all change. In general:

$$d_{\pi_{\theta}}\neq d_E$$

> **Reading:** The distribution visited by the deployed policy is generally not equal to the expert training distribution.

**Derivation:** As long as the policy makes action errors, the dynamics will push the state into different regions unless the environment and policy possess special invariance properties.

This is covariate shift. Even high static action-prediction accuracy may still lead to gradual divergence during a closed-loop rollout.

The physical system also satisfies:

$$s_{t+1}=F(s_t,a_t,\xi_t),\qquad o_t=G(s_t)+\epsilon_t$$

> **Reading:** The next state is produced from the current state, action, and disturbances through the real dynamics F; the current observation is produced from the state through the observation function G, with added noise.

**Derivation:** The first equation is the state transition, and the second is the sensor observation model. Chaining them together yields the closed loop through which policy actions affect future observations.

Here, $F$ denotes the real dynamics, while $\xi_t$ includes friction, contact, object mass, and external disturbances. A standard behavior cloning policy does not necessarily learn $F$ explicitly; it may absorb some of these regularities only indirectly through demonstration statistics.

## 1.6 What the Robot Does Not Learn Automatically

### Extension｜Physical Causality and Embodied Chain of Thought

<cite doc-id="PVpkdjZk9oZtxbxBIu3cfRXKnI1" file-type="docx" title="01B｜Physical Causality and Embodied Chain-of-Thought: How Robots Progress from Imitation to Closed-Loop Reasoning" type="doc"></cite>

Physical causality changes the structure of the world represented by the model, while embodied chain of thought changes how the robot observes, predicts, acts, verifies, and recovers.

- **It does not automatically learn complete physical equations.** This requires a world model, system identification, or interaction-based supervision.
- **It does not automatically learn causal relationships.** Correlated backgrounds, objects, and actions may be associated incorrectly.
- **It does not inherently acquire contact force information.** With only RGB images and joint positions, it is difficult to distinguish stable contact, slip, and excessive force.
- **It does not guarantee safety or reachability.** A high-probability demonstration action does not necessarily satisfy the current robot’s collision, velocity, and torque constraints.
- **It does not guarantee error recovery.** If the training data consists almost entirely of successful trajectories, the policy will not naturally learn how to regrasp and replan after failure.
- **It does not learn general intelligence beyond the task.** Its capability boundary is jointly determined by data coverage, model architecture, the control interface, and real-world feedback.

::: tip 📌
**Section takeaway:** A robot policy learns the conditional behavior distribution defined by expert data. A VLM provides conditional representations, action chunks express short-term behavioral structure, and Flow Matching represents continuous, multimodal actions. True closed-loop reliability also depends on data coverage, feedback frequency, dynamic constraints, and failure recovery.
:::

Three questions naturally follow: Why does behavior cloning on the expert distribution accumulate errors in closed-loop execution? Why does MSE produce an incorrect mean for multimodal actions? And how does Flow Matching generate a complete, coherent action mode from noise?

# 2. Why Behavior Cloning Alone Is Not Enough

The previous section established that behavior cloning optimizes under the expert state distribution $d_E$, while deployment encounters the state distribution $d_{\pi_\theta}$ generated by the policy itself. This section further explains why even a very small single-step error continuously changes subsequent inputs throughout the closed-loop system.

## 2.1 Errors Affect Not Only Actions but Also the Next Observation

The robot environment evolves according to the following closed-loop recurrence:

$$s_{t+1}=F(s_t,a_t),\qquad a_t\sim\pi_\theta(\cdot\mid o_t,l),\qquad o_t=G(s_t)$$

> **Reading:** The state transitions according to the real dynamics, the action is sampled from the policy conditioned on the current observation, and the observation is obtained from the current state through G.

**Derivation:** These three components correspond to the environment, policy, and sensors; together, they form the closed-loop recurrence.

If an action deviation $\Delta a_t$ occurs at time $t$, it causes a state deviation:

$$\Delta s_{t+1}\approx\frac{\partial F}{\partial s}\Delta s_t+\frac{\partial F}{\partial a}\Delta a_t$$

> **Reading:** The state deviation at the next time step is approximately equal to the current state deviation propagated through the Jacobian of the dynamics with respect to the state, plus the action deviation propagated through the Jacobian of the dynamics with respect to the action.

**Derivation:** Apply a first-order Taylor expansion to F(s,a) around the nominal trajectory and neglect second-order terms.

The new state then produces new images, object positions, and contact relationships. At the next step, the model is no longer making predictions along the original expert trajectory; it is continuing to predict from a shifted state that it created itself.

## 2.2 Why Long-Horizon Tasks Fail More Easily

Suppose the policy has a single-step error probability $\epsilon$ on expert states, and the task horizon is $T$. Under a simple upper-bound analysis, the cumulative cost of pure behavior cloning may reach:

$$J(\pi_\theta)-J(\pi_E)=\mathcal{O}(T^2\epsilon)$$

> **Reading:** Under a simple analysis with a finite task horizon, single-step error probability epsilon, and bounded cost and dynamics, the upper bound on the cumulative cost of behavior cloning relative to the expert grows quadratically with T.

**Derivation:** If the single-step error rate under the training distribution is epsilon, earlier errors can move the policy into increasingly unfamiliar states, causing the error probability at step t to grow at most linearly with t. Summing over T steps yields the quadratic order T squared epsilon.

**Conditions of applicability:** This order of growth is not a theorem for every robotic system. It illustrates that error states may continue to be visited at subsequent time steps.

The reason is that an early error does not merely incur a one-time cost; it may also place many subsequent time steps in regions not covered by the training data. Once interactive data aggregation expands training coverage to states visited by the policy itself, the typical upper bound can improve to approximately:

$$J(\pi_\theta)-J(\pi_E)=\mathcal{O}(T\epsilon)$$

> **Reading:** Under typical assumptions where interactive data aggregation covers states visited by the policy itself and the cost of expert corrections is controlled, the order of cumulative cost can improve from T squared epsilon to T epsilon.

**Derivation:** Data aggregation requests expert labels for states visited by the current policy, allowing the error at each step to be controlled at order epsilon. Summing over T time steps yields the linear order T epsilon.

**Conditions of applicability:** This improvement is not automatic; performance depends on data-aggregation coverage, expert-label quality, and the expressive capacity of the policy class.

The exact order depends on the assumptions, but the core conclusion is robust: **long-horizon tasks require far broader coverage of the closed-loop distribution than offline action prediction does.**

## 2.3 What Action Chunks Can Mitigate—and What They Cannot Solve

- They can reduce local action discontinuities caused by frequent inference;
- They can represent short-term bimanual coordination and stable motion intent;
- They cannot automatically fill in shifted states absent from the training data;
- An overly long chunk may also cause the robot to continue executing an outdated plan after an anomaly occurs.

## 2.4 Methods That Truly Improve Closed-Loop Reliability

- Collect perturbation, failure, and recovery data;
- Cover states visited by the policy itself through human intervention or DAgger-like methods;
- Use short-horizon receding-horizon replanning instead of executing an entire long trajectory at once;
- Add checks for object states, contact, and task-completion conditions;
- Optimize real rollout outcomes through reinforcement learning, experience learning, or online feedback.

::: tip 💡
**Core distinction:** Behavior cloning answers, “What should I do in expert states?” A closed-loop policy must also answer, “What should I do next after I have already deviated?”
:::

# 3. Why Not Regress Actions Directly with MSE?

Section 1 established that the optimal solution of deterministic MSE regression is the conditional mean. This section addresses a more general question: why do robot actions require a complete conditional distribution rather than a single optimal point?

## 3.1 The Same Task Condition May Admit Multiple Correct Modes

Given condition $c=(o,l)$, the action distribution can be written as a mixture of multiple modes:

$$p(A\mid c)=\sum_{k=1}^{K}w_k(c)p_k(A\mid c),\qquad w_k(c)\ge0,\quad\sum_{k=1}^{K}w_k(c)=1$$

> **Reading:** The conditional action distribution is a weighted sum of K mode distributions, where each weight depends on the condition, is nonnegative, and all weights sum to one.

**Derivation:** First select a latent behavior mode according to the mode weights, then sample an action from that mode’s distribution.

Different modes may correspond to:

- going around an obstacle from the left or the right;
- using the left hand, right hand, or both hands;
- different grasp locations and grasp types;
- moving an obstacle first or directly manipulating the target;
- a fast but higher-risk strategy, or a slower but more robust strategy.

## 3.2 What Information Is Lost by Point Regression?

A deterministic model outputs only:

$$A_{\mathrm{pred}}=f_\theta(c)$$

> **Reading:** A deterministic model maps condition c to a unique predicted action chunk.

**Derivation:** For the same condition, the deterministic regressor f_theta returns only one vector. Without an additional latent variable or sampling noise, repeated calls produce the same predicted action.

It has no explicit sampling variable and therefore cannot represent multiple action modes and their probabilities under the same condition.

Regardless of how many modes the true distribution contains, they must ultimately be compressed into a single point. The model cannot represent:

- how many feasible solutions currently exist;
- the probability and uncertainty of each solution;
- how to sample a complete, internally consistent trajectory;
- how to select another mode when one mode is infeasible.

## 3.3 A Generative Model Learns “How to Produce Samples”

Flow Matching, Diffusion Policy, and discrete autoregressive action models do not directly require the network to output the conditional mean. Instead, they learn a generative process:

$$z\sim p_0(z),\qquad A=\mathcal{G}_\theta(z;c)$$

> **Reading:** First sample z from a simple noise distribution p_0, then use the conditional generator G_theta to map the noise to an action chunk A according to c.

**Derivation:** A generative model rewrites a complex action distribution as the pushforward distribution produced by applying a conditional transformation to a simple base distribution.

Different noise samples $z$ can be mapped to different but complete action modes. Ideally:

$$\mathcal{G}_\theta(z;c)\sim p_{\mathrm{data}}(A\mid c)$$

> **Reading:** Ideally, the distribution of action chunks obtained by sampling noise z and passing it through the generator should approximate the true conditional action distribution in the data.

**Derivation:** This is the distribution-matching objective of a generative model; the training loss is only a specific surrogate used to achieve this objective.

The key is not randomness itself. Rather, the entire action segment produced by a single sample must remain mode-consistent: after choosing to go left, subsequent actions must not abruptly switch to going right.

## 3.4 Multimodal Capability Does Not Automatically Imply a Higher Success Rate

- Bad habits in the training data can also become distributional patterns;
- An excessively high sampling temperature may produce unstable actions;
- Generative models may still fail in OOD states;
- Real robots ultimately require samples to be filtered using collision, safety, and dynamics constraints.

::: tip 📌
**Conclusion of this section:** The problem with MSE is not that its formula is simple, but that it incorrectly compresses the distribution-learning problem of “multiple correct behaviors” into the point-estimation problem of “predicting an average action.” The next section introduces Flow Matching as a continuous distribution generation mechanism.
:::

# 4. From Noise to Actions: Conditional Flow Matching

Take a ground-truth action chunk A and Gaussian noise epsilon, and construct a linear probability path from noise to data:

$$\varepsilon\sim\mathcal N(0,I),\qquad A^{\tau}=(1-\tau)\varepsilon+\tau A,\quad \tau\in[0,1]$$

> **Interpretation:** epsilon is sampled from a standard Gaussian distribution. The state of A at tau is a linear interpolation between the noise and the ground-truth action chunk at time tau; tau progresses from zero to one.

**Derivation:** When tau equals zero, the result is noise; when tau equals one, the result is the ground-truth action. Linear interpolation defines the conditional path connecting the two endpoints.

The ground-truth velocity field along this path is:

$$u_{\tau}(A^{\tau}\mid A,\varepsilon)=\frac{dA^{\tau}}{d\tau}=A-\varepsilon$$

> **Interpretation:** Given the ground-truth action and noise, the ground-truth velocity of the interpolation path at flow time tau equals the ground-truth action chunk minus the noise.

**Derivation:** Differentiate the preceding equation with respect to tau. The derivative of the noise term is negative epsilon, and the derivative of the data term is A.

Given the observation, language, noisy action, and flow time τ, the network predicts the velocity:

$$v_\theta(A^{\tau},\tau,o,l)$$

> **Interpretation:** Given the current interpolated action, flow time, observation, and language conditions, the network predicts the velocity direction in which the action should move at that moment.

**Derivation:** Once the action generator is represented as an ordinary differential equation that evolves with interpolation time, the network must output a local velocity for every intermediate action, time, and condition. This function is the vector field to be learned.

v_theta is a vector field, not the final action; during inference, the velocity field must be integrated to produce a complete action chunk.

The training objective is velocity regression:

$$\mathcal L_{\mathrm{CFM}}=\mathbb E_{A,\varepsilon,\tau}\left[\left\|v_\theta(A^{\tau},\tau,o,l)-(A-\varepsilon)\right\|_2^2\right]$$

> **Interpretation:** The conditional Flow Matching loss is the expected squared error between the velocity predicted by the network and the ground-truth interpolation velocity, where the expectation is taken over data actions, noise, and flow time.

**Derivation:** During training, A and epsilon are known, so the ground-truth velocity can be constructed directly. By randomly sampling the path time, the network learns the conditional vector field along the entire path.

# 5. Why Inference Requires Multiple Network Forward Passes

Inference starts from a random-noise initial state of A and numerically integrates the ordinary differential equation:

$$\frac{dA^{\tau}}{d\tau}=v_\theta(A^{\tau},\tau,o,l)$$

> **Interpretation:** The rate of change of the action state with respect to flow time tau equals the velocity predicted by the network given the current action state, time, observation, and language conditions.

**Derivation:** Treat the trained vector field as the right-hand side of an ordinary differential equation and integrate from the noise initial condition at tau equal to zero.

Using the Euler method, the kth update is:

$$A^{\tau_{k+1}}=A^{\tau_k}+\Delta\tau\,v_\theta(A^{\tau_k},\tau_k,o,l)$$

> **Interpretation:** The Euler method multiplies the velocity at the current point by the time step Delta tau and adds the result to the current action state to obtain the next integration point.

**Derivation:** This is a first-order finite-difference approximation of the ordinary differential equation. A smaller step size generally reduces integration error but increases the number of network forward passes.

π0 uses a small number of discrete integration steps to generate an entire action chunk. Flow Matching offers fine-grained continuous action representation, but at the cost of running the Action Expert multiple times for each action chunk.

## 5.1 Minimal Reproducible Experiment

In a two-dimensional plane, construct action-chunk data in which left-detour and right-detour trajectories each account for half of the samples. Train an MSE regressor and a conditional Flow Matching model separately, then execute both in closed loop under identical perturbations to the starting point.

1. Plot the trajectory predicted by MSE and 100 trajectories sampled from the Flow model.
2. Measure left/right mode coverage, collision rate, and trajectory smoothness.
3. Increase the number of integration steps from 1 to 2, 4, 8, and 16, and plot the Pareto curve of success rate versus inference latency.
4. Vary the action-chunk length H and observe the trade-off between closed-loop recovery speed and action continuity.

The experiment must use the same training data and network capacity to avoid conflating the benefits of the generation mechanism with additional model scale.

# 6. Required Conclusions from This Chapter

- The VLM produces conditional representations relevant to the task and scene, but it is not inherently a controller.
- An Action Chunk is a control interface, not merely a training technique.
- Flow Matching addresses the generation of continuous, multimodal action distributions.
- The accumulation of closed-loop errors in behavior cloning foreshadows the introduction of experiential learning in π0.6\*.

## Derivation Exercises

1. Prove that the target velocity of the linear interpolation path is A minus epsilon.
2. Compare H=1 and H=50 in terms of inference frequency, closed-loop feedback speed, and action consistency.
3. Explain why increasing the number of Flow Matching integration steps does not necessarily improve real-robot success rates.

## Original Sources

<bookmark name="Official π0 Paper" href="https://physicalintelligence.company/download/pi0.pdf"></bookmark>

<bookmark name="Conditional Flow Matching" href="https://arxiv.org/abs/2210.02747"></bookmark>
