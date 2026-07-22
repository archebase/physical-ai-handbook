---
title: "B2｜Model-Based Planning: How MPC, CEM, and Trajectory Optimization Turn Predictions into Actions"
sourceToken: TeKPdruXAoYZvFx0gKHc1Po4n4d
sourceRevision: 20
license: Apache-2.0
translationSource: "route-b/03-b2-模型式规划-mpc-cem-与轨迹优化如何把预测变成动作.md"
translationSourceHash: 9a4289ea1b545066e8671306384b464a25274b8233f6ba3e7619bc74ed7c5121
---

> [Original Feishu document](https://archebase.feishu.cn/docx/TeKPdruXAoYZvFx0gKHc1Po4n4d) · Source revision 20

::: tip 💡
**Mechanisms lesson:** A world model is responsible only for prediction; a planning algorithm selects actions based on those predictions. Starting from finite-horizon optimization, this lesson derives MPC, random shooting, CEM, and gradient-based trajectory optimization, and analyzes the relationships among model error, planning horizon, computational budget, and real-world closed-loop control.
:::

# Learning Objectives

After completing this lesson, you should be able to formulate a finite-horizon planning objective; explain receding-horizon control; implement random shooting and CEM; distinguish differentiable planning from black-box planning; understand terminal value and constraints; analyze the relationship between planning horizon and model error; and design experiments on model exploitation bias, computational latency, and closed-loop replanning.

# 1. Mathematical Formulation of the Planning Problem

Given the current latent state $z_t$ and a world model:

$$z_{k+1}=f_\phi(z_k,a_k)$$

> **Interpretation:** The deterministic world model computes the next latent state from the latent state and action at step k.

**Derivation:** This is the case in which the conditional transition distribution degenerates into a point estimate. If the model outputs a distribution, the subsequent planning objective must also take an expectation over model stochasticity or estimate it through sampling.

Finite-horizon planning selects an action sequence:

$$a_{t:t+H-1}^*=\arg\max_{a_{t:t+H-1}}\mathbb E_{p_\phi}\!\left[\sum_{k=0}^{H-1}\gamma^k r(z_{t+k},a_{t+k})+\gamma^H V(z_{t+H})\right]$$

> **Interpretation:** Among all candidate action sequences of length H, select the one that maximizes the expected discounted rewards predicted by the model plus the terminal value.

**Derivation:** Truncate the infinite-horizon return after the first H steps and use the terminal value to approximate the remaining tail return. Under stochastic dynamics, take an expectation over predicted trajectories; under a deterministic model, this expectation reduces to a single rollout.

A planner requires four elements: the current state, a predictive model, an objective/reward, and an action-search method. Without any one of these, a world model will not automatically produce behavior.

# 2. Model Predictive Control

At each step, MPC solves for an action sequence of length $H$, but executes only the first action or first few actions:

1. Estimate the state $z_t$ from the current observation.
2. Optimize the future action sequence.
3. Execute the first action $a_t^*$.
4. Obtain a new observation and update the state.
5. Replan from the new state.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBPW05ldyBvYnNlcnZhdGlvbl0gLS0+IFNbU3RhdGUgZXN0aW1hdGlvbl0KICAgIFMgLS0+IFBbR2VuZXJhdGUgY2FuZGlkYXRlIGFjdGlvbiBzZXF1ZW5jZXNdCiAgICBQIC0tPiBNW1dvcmxkIG1vZGVsIHJvbGxvdXRdCiAgICBNIC0tPiBSW0NvbXB1dGUgcmV3YXJkIC8gdGVybWluYWwgdmFsdWUgLyBjb25zdHJhaW50c10KICAgIFIgLS0+IFVbVXBkYXRlIGNhbmRpZGF0ZXMgdXNpbmcgZWxpdGUgc2FtcGxlcyBvciBncmFkaWVudHNdCiAgICBVIC0tPiBQCiAgICBSIC0tPiBBW1NlbGVjdCBhbmQgZXhlY3V0ZSB0aGUgZmlyc3QgYWN0aW9uXQogICAgQ1tTYWZldHkgY29uc3RyYWludHMgYW5kIHVuY2VydGFpbnR5XSAtLT4gQQogICAgQSAtLT4gRVtSZWFsIGVudmlyb25tZW50XQogICAgRSAtLT4gTw==" />

::: tip 💡<p><b>Interactive Validation｜World Model, MPC, and CEM Planning Lab</b></p><p>Vary the planning horizon, number of candidates, and model error to observe how rollout error affects the actions selected by CEM.</p><p><a href="https://archebase.feishuapp.com/app/app_17aeaj1ym56">World Model, MPC, and CEM Planning Lab</a></p><p><button action="OpenLink" src="https://archebase.feishuapp.com/app/app_17aeaj1ym56">Open Interactive Lab</button></p><bookmark name="World Models, MPC & CEM Planning Lab" href="https://archebase.feishuapp.com/app/app_17aeaj1ym56"></bookmark>:::

Replanning allows real observations to continuously correct model error, which is the key reason model-based control can work with an imperfect model.

# 3. Random Shooting

The simplest sampling-based planning method is:

1. Sample $N$ action sequences from the action distribution.
2. Roll out each sequence using the world model.
3. Compute the return.
4. Select the sequence with the highest return.

The estimated objective is:

$$\hat J(a_{t:t+H-1})=\sum_{k=0}^{H-1}\gamma^k\hat r_{t+k}+\gamma^H\hat V_{t+H}$$

> **Interpretation:** The estimated return of a candidate action sequence equals the sum of discounted predicted rewards along the model rollout plus the discounted terminal value.

**Derivation:** Replace the unknown true rewards and value in the preceding planning objective with predictions from the world model and critic. If the model is stochastic, average over multiple sampled trajectories or use a risk statistic.

Random shooting is easy to implement and suitable for black-box models, but the proportion of useful samples becomes extremely low in high-dimensional, long-horizon action spaces.

# 4. Cross-Entropy Method

CEM iteratively concentrates a parameterized distribution on high-return regions. Let the action-sequence distribution be:

$$a_{t:t+H-1}\sim\mathcal N(\mu,\Sigma)$$

> **Interpretation:** Concatenate the entire action sequence of length H into a vector and sample it from a Gaussian search distribution with mean mu and covariance Sigma.

**Derivation:** CEM does not solve directly for the optimal action. Instead, it iteratively fits a distribution to high-return regions. A Gaussian is convenient for sampling and parameter re-estimation with continuous actions, but this does not imply that the true optimum follows a Gaussian distribution.

In each iteration:

1. Sample $N$ action sequences.
2. Compute the predicted return of each sequence.
3. Select the top $\rho N$ elite sequences.
4. Re-estimate the mean and covariance of the action-sequence distribution from the elite samples.
5. Repeat for $K$ iterations.

$$\begin{aligned}M&=\lceil\rho N\rceil,\\ \mu_{\mathrm{new}}&=\frac{1}{M}\sum_{i\in\mathcal E}a^{(i)},\\ \Sigma_{\mathrm{new}}&=\frac{1}{M}\sum_{i\in\mathcal E}(a^{(i)}-\mu_{\mathrm{new}})(a^{(i)}-\mu_{\mathrm{new}})^{\top}\end{aligned}$$

> **Interpretation:** First select the M elite sequences with the highest returns, then update the search distribution using their sample mean and sample covariance.

**Derivation:** Treat the elite set as samples conditioned on a high-return event and fit a Gaussian distribution by maximum likelihood. The closed-form solution is the mean and covariance of the elite samples.

A smoothed update can be used:

$$\mu\leftarrow\alpha\mu_{\mathrm{new}}+(1-\alpha)\mu_{\mathrm{old}}$$

> **Interpretation:** The new search mean is a weighted combination of the current iteration’s elite mean and the previous iteration’s mean, with weights determined by alpha.

**Derivation:** This is exponential smoothing, not an inherent requirement of CEM. It reduces abrupt distribution shifts caused by finite sampling. A larger alpha tracks the current elite samples more closely, whereas a smaller alpha is more stable but converges more slowly.

CEM does not require the model to be differentiable with respect to actions, making it suitable for discrete actions, nonsmooth rewards, and complex generative models. Its disadvantage is the large number of rollouts required; real-time control therefore needs efficient latent dynamics and parallel computation.

# 5. Gradient-Based Trajectory Optimization

If the model and reward are differentiable, one can directly compute:

$$\nabla_{a_{t:t+H-1}}J$$

> **Interpretation:** This is the gradient of the planning return J with respect to every action component in the entire action sequence.

**Derivation:** Backpropagation through differentiable rewards and dynamics uses the chain rule to propagate the sensitivity of future rewards to states back to each action. As the horizon increases, gradients are more likely to vanish, explode, or amplify model error.

Then iterate:

$$a\leftarrow a+\eta\nabla_a J$$

> **Interpretation:** Move the candidate actions one step in the gradient direction that increases the return most rapidly, with the step size controlled by eta.

**Derivation:** From the first-order Taylor expansion of J around the current actions, a small step along the positive gradient can increase the local approximation of the return. If actions are bounded, projection, parameterization, or constrained optimization is also required.

Gradient-based planning is sample-efficient, but it can become trapped in local optima and may optimize along erroneous directions in the model. Contact transitions and discrete skills can make gradients discontinuous or meaningless.

| Method | Requires differentiability | Computation | Suitable for |
|-|-|-|-|
| Random shooting | No | Many independent rollouts | Low-dimensional, short-horizon problems; baselines |
| CEM | No | Multiple sampling iterations | Black-box models and nonsmooth objectives |
| Gradient optimization | Yes | Backpropagation | Continuous, smooth dynamics |
| Tree search | No | Branch expansion | Discrete actions or skills |

# 6. Why Terminal Value Matters

A finite horizon causes myopia. Add a terminal value:

$$J_H=\sum_{k=0}^{H-1}\gamma^k r_{t+k}+\gamma^H V(z_{t+H})$$

> **Interpretation:** The H-step truncated return consists of the rewards from the first H steps plus the discounted value of the state at step H.

**Derivation:** Split the infinite-horizon return at H: the first segment is rolled out explicitly, while the conditional expectation of the remaining segment is approximated by the value function. If the value estimate is unbiased and accurate, the two segments recover the original long-term objective.

The value function approximates long-term outcomes beyond the horizon, so the planner does not need to unroll the entire task to completion. However, an erroneous critic can cause the planner to prefer terminal states that merely appear to have high value.

# 7. Constraints and Safety

Planning must do more than maximize reward; it must also satisfy:

$$g(z_k,a_k)\le 0$$

> **Interpretation:** Every predicted state and action must make the constraint function g no greater than zero.

**Derivation:** Express joint, velocity, collision, or force limits as an implicit representation of the feasible set. Hard constraints require every candidate to remain within this set. Merely adding g to the reward creates a soft penalty and does not automatically provide a safety guarantee.

Constraints can include joint limits, velocity limits, collisions, forces, and workspace boundaries. They can be handled by:

- Rejecting infeasible candidates.
- Adding penalties to the reward.
- Mapping actions into the feasible set.
- Using an independent safety filter.

Soft penalties cannot guarantee hard safety. Real robots usually require a deterministic safety layer outside the planner.

# 8. The Three-Way Horizon Trade-Off

| Increasing the horizon | Benefit | Cost |
|-|-|-|
| Looks farther ahead | Reduces myopia | Accumulates model error |
| Introduces more action variables | Represents complex plans | Increases the search dimension exponentially |
| Uses longer rollouts | Captures delayed outcomes | Increases inference latency |

The best horizon depends on world-model quality, control frequency, task delay, and terminal-value accuracy. Longer is not always better.

# 9. Model Exploitation Bias

A planner does not use a model passively; it actively searches for weaknesses in the model’s predictions. For example, if the model underestimates collisions, the optimizer may select trajectories that pass through obstacles.

A risk-sensitive objective can be used:

$$J_{\mathrm{risk}}=\mathbb E[J]-\lambda\sqrt{\operatorname{Var}(J)}$$

> **Interpretation:** The risk-sensitive score equals the mean predicted return minus lambda times the standard deviation of the return.

**Derivation:** This is a conservative mean-minus-standard-deviation heuristic: among trajectories with similar means, it penalizes those with greater predictive disagreement. It is not a universal risk theorem; lambda must be selected based on the return scale, calibration, and task risk.

Alternatively, ensemble disagreement, OOD states, and uncertainty can be penalized. Validation in the real environment is still ultimately required.

# 10. Warm Starts and Real-Time Performance

Optimal action sequences in adjacent control cycles are usually similar. The previous sequence can be shifted left and used as the mean of the new distribution:

$$\mu_t^{\mathrm{init}}=\left[a_{t:t+H-2}^{*},a_{\mathrm{tail}}\right]$$

> **Interpretation:** The initial mean for the current cycle takes the H−1 actions that remain unexecuted in the previous cycle’s optimal sequence and appends a terminal action.

**Derivation:** After the first action from the previous cycle is executed, the remaining actions naturally shift left by one time step. Appending a hold action, zero action, or terminal action supplied by a policy prior restores the sequence length to H.

Warm starts reduce the number of search iterations and improve action continuity. Real-time systems must also manage the number of rollouts, batch parallelism, model latency, and planning timeouts.

# 11. Skill-Level Planning

For long-horizon tasks, searching over low-level actions is too expensive. Planning can instead be performed in skill space:

$$\omega_{k:k+K-1}^{*}=\arg\max_{\omega_{k:k+K-1}}\mathbb E\!\left[\sum_{j=0}^{K-1}\gamma^j R(z_{k+j},\omega_{k+j})+\gamma^K V(z_{k+K})\right]$$

> **Interpretation:** Among skill sequences of length K, select the sequence that maximizes the expected skill-level rewards plus the terminal value.

**Derivation:** Replace low-level actions with skill variables that persist for multiple steps, making state transitions semi-Markov transitions after skill execution. Indexing through k+K−1 includes exactly K skills.

The world model predicts the state after each skill, while a low-level policy executes the skill. A skill-level model is more efficient, but it requires reliable initiation, termination, and failure detection.

# 12. One-Dimensional Cart Experiment

The objective is to stop a cart at position 1. The action is acceleration, and the system has damping and action limits.

1. Implement linear dynamics and a learned model with error.
2. Compare random shooting, CEM, and gradient optimization.
3. Sweep the horizon, number of candidates, and number of CEM iterations.
4. Introduce a bias that causes the model to underestimate damping.
5. Compare open-loop execution of the full sequence with MPC replanning after every step.
6. Add an uncertainty penalty and observe the success rate and degree of conservatism.

# 13. Credible Evaluation

- Correlation between predicted return in the model and true return.
- Distribution of planning time and timeout rate.
- Task success, completion time, energy consumption, and safety.
- Curves across different horizons and computational budgets.
- Calibration between world-model ensemble disagreement and real failures.
- Ablations of the world model, terminal value, and replanning frequency.

# 14. Literature Landscape and Evidence Boundaries

The results of a planning algorithm depend strongly on the world model, reward, constraints, and computational budget. The “paper facts” below describe only what each method explicitly does; the “lesson assessment” identifies what additional evidence is still needed for real robots.

| Work | Paper facts | Authors’ interpretation | Lesson assessment |
|-|-|-|-|
| Cross-Entropy Method | Repeatedly fits a parameterized sampling distribution using elite samples | A rare-event estimation method can be converted into black-box optimization | A strong general-purpose baseline for sampling-based robot planning, but highly sensitive to the horizon, sample count, and temporal correlations between actions |
| MPPI | Updates the control sequence using sampled controlled trajectories and exponential weighting | Information-theoretic control enables real-time sampling-based MPC | Suitable for continuous control and parallel rollouts; real-world deployment must separately report the noise scale, constraints, and latency |
| PlaNet | Uses CEM for online planning in the latent space of an RSSM | Pixel-based control can be achieved through latent planning | Demonstrates the feasibility of combining representations with planning, but gains on visual benchmarks do not directly establish physical reliability on contact-rich robots |
| TD-MPC2 | Jointly learns latent dynamics, reward, value, and a policy prior, and performs short-horizon planning | Model-based control can scale to multitask settings and larger models | A strong modern baseline for B2; fair comparisons must hold model capacity, planning budget, and control frequency fixed |
| MuZero | Uses tree search over a learned latent model that predicts reward, value, and policy | A planning model does not need to reconstruct real observations | Shows that discrete skill- or decision-level search is another viable path, but continuous robot control still requires action parameterization and a low-level control interface |

<bookmark name="The Cross-Entropy Method for Combinatorial and Continuous Optimization" href="https://doi.org/10.1023/A:1010091220143"></bookmark>

<bookmark name="Information Theoretic MPC for Model-Based Reinforcement Learning" href="https://arxiv.org/abs/1707.02342"></bookmark>

<bookmark name="PlaNet" href="https://arxiv.org/abs/1811.04551"></bookmark>

<bookmark name="TD-MPC2" href="https://arxiv.org/abs/2310.16828"></bookmark>

<bookmark name="MuZero" href="https://arxiv.org/abs/1911.08265"></bookmark>

# 15. Lesson Exercises

1. Write pseudocode for random shooting and CEM by hand.
2. Explain why MPC executes only the first action.
3. Compare hard constraints with reward penalties.
4. Construct a counterexample in which a planner exploits a model error.
5. Explain how terminal value can reduce the required horizon and what bias it may introduce.
6. Reformulate low-level action planning as skill-level planning.
