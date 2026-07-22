---
title: "C0 | Value, Rewards, and Learning from Experience: How Physical AI Improves Behavior from Outcomes"
sourceToken: KsX3dNJTcoG4f6xo1OpcFWaOnqg
sourceRevision: 27
license: Apache-2.0
translationSource: "route-c/01-c0-价值-奖励与经验学习-physical-ai-如何从结果中改进行为.md"
translationSourceHash: 3ac02153ef06262efaf18eeaa60938df17560bdcb4e4b80aece88b17ff5e7dad
---

> [Original Feishu document](https://archebase.feishu.cn/docx/KsX3dNJTcoG4f6xo1OpcFWaOnqg) · Source revision 27

::: tip 💡
**Track overview:** Policy imitation studies “what others did,” while value learning and reinforcement learning study “which behaviors are better in the long run.” Starting from probabilistic expectations and conditional returns, this lesson connects Bellman equations, TD, Actor-Critic, Offline RL, preferences, human corrections, and experience learning for large-scale robot models.
:::

# Learning Objectives

After completing this lesson, you should be able to distinguish among rewards, returns, values, Q-values, and Advantage; derive Bellman recursions and TD targets; explain policy gradients and Actor-Critic; understand out-of-distribution overestimation in Offline RL; distinguish among human correction, preference learning, and reinforcement learning; and assess how experience learning improves VLAs and how it is shaped by world models and data engines.

# 1. Why Expert Actions Are Still Not Enough

Behavior cloning learns:

$$\pi_\theta(a\mid s)\approx\pi_{\mathrm{expert}}(a\mid s)$$

> **Reading:** Behavior cloning makes the current policy’s action distribution at each state resemble the expert policy’s action distribution.

**Derivation:** This is supervised conditional-distribution fitting. It uses only what the expert selected, not the long-term outcomes after those actions or the erroneous states caused by the policy itself.

It tells the model what the expert did, but does not directly tell the model:

- Which of several feasible actions is better in the long run.
- Why failed actions failed.
- How to recover from erroneous states caused by the policy itself.
- Whether the task can be completed faster or more reliably than by the expert.

The value-based approach adds outcome signals, allowing the model to compare behaviors rather than merely reproduce them.

# 2. Rewards, Returns, and Values

## 2.1 Reward

$$r_t=r(s_t,a_t,s_{t+1})$$

> **Reading:** The reward at step t is jointly determined by the current state, current action, and next state.

**Derivation:** A reward is the evaluation function for a single-step transition. Only by encoding termination, collisions, distance, energy consumption, or human preferences into r do we define what the optimization process considers “good.”

A reward evaluates a single transition and can come from task completion, distance, collisions, energy consumption, human preferences, or a learned reward model. A reward is not objective truth; it is the designer’s encoding of the task.

## 2.2 Return

$$G_t=\sum_{k=0}^{T-1-t}\gamma^k r_{t+k}$$

> **Reading:** Starting at time t, sum every reward up to the terminal point after discounting it according to the number of steps from the present.

**Derivation:** A finite trajectory ends at step T-1, so there are T-t reward terms; gamma controls the importance of the future relative to the present.

Read this as: “Starting from the current time, compute the weighted sum of future rewards using discount factor $\gamma$.” The larger $\gamma$ is, the more weight is placed on long-term outcomes.

## 2.3 State Value and Action Value

$$V^\pi(s)=\mathbb E_{\tau\sim\pi}[G_t\mid s_t=s]$$

> **Reading:** When following policy pi, the state value from state s is the conditional expectation of all possible future returns.

**Derivation:** Taking the conditional expectation over actions sampled from the policy, environment transitions, and subsequent trajectories compresses stochastic long-term outcomes into a scalar for the state.

$$Q^\pi(s,a)=\mathbb E_{\tau\sim\pi}[G_t\mid s_t=s,a_t=a]$$

> **Reading:** If action a is first forced in state s and policy pi is followed thereafter, the action value is the conditional expectation of the resulting future return.

**Derivation:** Compared with V, Q additionally conditions on the first action, so it can directly compare different actions in the same state.

They are conditional expectations of stochastic future returns. A value function is not an action generator; it is a long-term evaluation of a state or action.

# 3. Bellman Recursion: Decomposing a Long-Horizon Problem into One Step

From the definition of return:

$$G_t=r_t+\gamma G_{t+1}$$

> **Reading:** The current return equals the reward from the current step plus the discounted return from the next time step.

**Derivation:** Separate the first term r_t from the finite sum and factor one gamma out of all remaining terms to obtain the recursive definition of return.

Taking the conditional expectation of both sides:

$$Q^\pi(s_t,a_t)=\mathbb E\!\left[r_t+\gamma V^\pi(s_{t+1})\mid s_t,a_t\right]$$

> **Reading:** Under policy pi, the value of the current state-action pair equals the immediate reward plus the expected discounted value of the next state.

**Derivation:** Substitute the return recursion into the conditional expectation defining Q, then marginalize over the next state and the actions subsequently taken under pi to obtain the Bellman expectation equation.

This is the Bellman expectation equation. It states that the value of the current action equals the immediate reward plus the discounted value of the next state.

The optimal action value satisfies:

$$Q^*(s,a)=\mathbb E\!\left[r+\gamma\max_{a'}Q^*(s',a')\mid s,a\right]$$

> **Reading:** The optimal Q-value equals the current reward plus the expected discounted value of the best subsequent action in the next state.

**Derivation:** Replace the expectation over the next action under a fixed policy with the maximum over available actions in the next state to obtain the Bellman optimality equation.

Robot tasks are difficult because the state is usually partially observable, rewards are sparse, contact outcomes appear after a delay, and real-world interaction is expensive.

# 4. How Value Functions Learn from Data

## 4.1 Monte Carlo

After waiting for a trajectory to end, use the actual return as supervision:

$$\mathcal L_V=\mathbb E\!\left[(V_\phi(s_t)-G_t)^2\right]$$

> **Reading:** The Monte Carlo value loss is the expected squared error between the predicted value and the actual return of the complete trajectory.

**Derivation:** Once the trajectory ends, G_t can be used directly as a supervision target. The conditional-mean solution to least-squares regression is precisely the expected return; the cost is high variance for long-horizon returns and the need to wait until termination.

The target has no bootstrap bias, but its variance is high, and long-horizon tasks must wait until termination.

## 4.2 Temporal Difference

TD uses a one-step bootstrap target:

$$y_t=r_t+\gamma(1-d_t)V_{\bar\phi}(s_{t+1})$$

> **Reading:** The TD target equals the current reward plus the discounted target value of the next state when the episode has not terminated.

**Derivation:** Replace the complete return with the one-step Bellman recursion. Here, d_t is the termination indicator, and target-network parameters bar phi are updated more slowly, reducing oscillation in the bootstrap target.

$$\mathcal L_{\mathrm{TD}}=\mathbb E\!\left[(V_\phi(s_t)-\operatorname{sg}(y_t))^2\right]$$

> **Reading:** The TD loss makes the current value prediction approach the stop-gradient bootstrap target.

**Derivation:** This regresses against a one-step TD target. Stopping the gradient prevents the optimizer from simultaneously changing the target branch, although training still retains the bias introduced by bootstrapping.

Read this as: “Make the current value approach the one-step reward plus the model’s prediction of the next state’s value.” TD reduces variance, but because the target itself depends on an estimate, it can introduce bias and instability.

<MermaidDiagram encoded="Zmxvd2NoYXJ0IFRCCiAgICBTW0N1cnJlbnQgc3RhdGUgb3IgaGlzdG9yeV0gLS0+IEFbQWN0b3Igc2FtcGxlcyBhbiBhY3Rpb25dCiAgICBBIC0tPiBFW0V4ZWN1dGUgaW4gdGhlIHJlYWwgZW52aXJvbm1lbnRdCiAgICBFIC0tPiBSW1Jld2FyZCBhbmQgdGVybWluYXRpb25dCiAgICBFIC0tPiBTMltOZXh0IHN0YXRlXQogICAgUzIgLS0+IFZbVGFyZ2V0IENyaXRpYyBwcmVkaWN0cyB0aGUgbmV4dCB2YWx1ZV0KICAgIFIgLS0+IFlbQ29uc3RydWN0IFREIC8gbGFtYmRhLXJldHVybiB0YXJnZXRdCiAgICBWIC0tPiBZCiAgICBZIC0tPiBMW1VwZGF0ZSBDcml0aWNdCiAgICBMIC0tPiBBRFZbRXN0aW1hdGUgUSBhbmQgQWR2YW50YWdlXQogICAgQURWIC0tPiBVW1VwZGF0ZSBBY3RvciB1bmRlciBhIEtMIGNvbnN0cmFpbnRdCiAgICBVIC0tPiBBCiAgICBFIC0tPiBT" />

# 5. Advantage: How Much Better Than the Current Average Choice?

$$A^\pi(s,a)=Q^\pi(s,a)-V^\pi(s)$$

> **Reading:** Advantage is the action value minus the state value obtained by averaging under the current policy in the same state.

**Derivation:** Subtracting a state baseline from Q does not change the relative ranking of actions, but it removes the common offset caused by the inherent difficulty of the state, thereby reducing policy-gradient variance.

A positive Advantage means that the action is better than the policy’s average choice in that state, while a negative Advantage means that it is worse. Advantage removes differences in baseline difficulty across states, allowing policy updates to focus more on the relative contribution of each action.

In robot data, Advantage can come from a critic or be approximated using changes in success probability, human preferences, or task-stage evaluations.

# 6. Policy Gradients and Actor-Critic

The policy seeks to maximize:

$$J(\theta)=\mathbb E_{\tau\sim\pi_\theta}[G_0]$$

> **Reading:** The policy objective is the expected initial return when sampling an entire trajectory from the initial state according to the policy.

**Derivation:** Treat the trajectory distribution parameterized by the policy as a random variable and take the expectation of the task return to obtain the scalar objective to be maximized.

The policy-gradient theorem gives:

$$\nabla_\theta J=\mathbb E\!\left[\sum_t\nabla_\theta\log\pi_\theta(a_t\mid s_t)Q^\pi(s_t,a_t)\right]$$

> **Reading:** At each step, multiply the gradient of the action’s log probability by that action’s Q-value, then sum along the trajectory and take the expectation.

**Derivation:** Apply the log-derivative trick to the trajectory probability, rewriting the derivative of the return with respect to the parameters as the product of the action log-probability gradient and the return. The environment transition does not directly depend on theta.

Informally, increase the probability of high-value actions and decrease the probability of low-value actions. In practice, Advantage commonly replaces Q:

$$\nabla_\theta J\approx\mathbb E\!\left[\sum_t\nabla_\theta\log\pi_\theta(a_t\mid s_t)A^\pi(s_t,a_t)\right]$$

> **Reading:** The policy update is weighted only by the action’s Advantage relative to the average for the same state, rather than by the absolute scale of the full Q-value.

**Derivation:** Subtracting the action-independent state baseline V from Q leaves the expected policy gradient unchanged. In practice, a critic estimates Advantage, so this is an approximation.

The Actor generates actions, while the Critic estimates value. Errors in the Critic are passed directly to the Actor as incorrect update directions, so calibration and data coverage are critical.

# 7. KL-Regularized Policy Improvement

A large pretrained policy should not change drastically based on a small amount of reward data. One can optimize:

$$\max_{\pi(\cdot\mid s)}\;\mathbb E_{a\sim\pi(\cdot\mid s)}[A^{\pi_{\mathrm{ref}}}(s,a)]-\beta D_{\mathrm{KL}}\!\left(\pi(\cdot\mid s)\,\Vert\,\pi_{\mathrm{ref}}(\cdot\mid s)\right)$$

> **Reading:** In each state, choose a policy that increases the expected Advantage relative to the reference policy while remaining close to the reference action distribution; beta controls the degree of conservatism.

**Derivation:** This is a policy-improvement objective with a KL trust region. The first term encourages high-Advantage actions, while the second penalizes distribution shift. Lagrangian optimization over discrete action probabilities yields the following expression.

The closed-form optimal distribution has the form:

$$\pi_{\mathrm{new}}(a\mid s)=\frac{\pi_{\mathrm{ref}}(a\mid s)\exp(A(s,a)/\beta)}{\sum_{a'}\pi_{\mathrm{ref}}(a'\mid s)\exp(A(s,a')/\beta)}$$

> **Reading:** The new policy equals the reference policy multiplied by an exponential Advantage weight, then divided by the sum of all action weights for normalization.

**Derivation:** Add the constraint that the probabilities sum to one to the preceding KL-regularized objective, set the derivative with respect to each action probability to zero, and solve for the Gibbs distribution. The smaller beta is, the more aggressively the policy favors high-Advantage actions.

This shows that the new policy exponentially reweights high-Advantage actions relative to the reference policy. $\beta$ controls the magnitude and conservatism of the improvement.

# 8. Why Offline RL Is Difficult

Offline RL uses only a fixed dataset $\mathcal D$. The policy may select actions that almost never appear in the data, while the critic assigns them unrealistically high values because of function extrapolation. This is called extrapolation error.

| Problem | Mechanism | Common Mitigation |
|-|-|-|
| Out-of-distribution actions | The value network extrapolates into regions without data | Conservative value estimation, behavior constraints |
| Sparse rewards | Key actions are difficult to localize | Stage labels, reward shaping, preferences |
| Mixed-quality data | Successful and failed actions overlap | Conditional policies, reweighting, value-based filtering |
| Partial observability | The same image corresponds to different hidden states | History, memory, and state estimation |

The objective of Offline RL is not simply to delete failure data, but to use outcome signals to identify when and why failures occur and learn to recover from or avoid them.

# 9. Human Corrections, Preferences, and Reward Learning

| Signal | Information Provided | Suitable For | Limitation |
|-|-|-|-|
| Human takeover | The correct action in an erroneous state | Recovery policies | Expensive and subject to intervention-selection bias |
| Pairwise preference | Whether trajectory A is better than B | Tasks for which rewards are difficult to specify | Preference consistency and annotation cost |
| Success label | Outcome of the entire trajectory | Large-scale outcome learning | Difficult credit assignment |
| Automated metric | Distance, speed, force, time | Dense feedback | Susceptible to reward hacking |

A reward model learns $r_\psi(\tau)$ or segment scores and is then used for policy optimization. It converts human judgment into scalable supervision, but can also amplify annotation bias.

# 10. How Experience Learning Connects to VLAs

Large VLAs typically first acquire foundational capabilities through imitation learning and then improve using deployment data:

1. Deploy the current VLA.
2. Collect autonomous successes, failures, and human takeovers.
3. Train a value model, success predictor, or preference model.
4. Estimate Advantage for trajectories or actions.
5. Update the VLA through reweighting, conditioning, distillation, or policy optimization.
6. Redeploy and continue collecting data.

RECAP is an example of this paradigm. Its primary model follows the VLA approach, while its experience-improvement mechanism belongs to this track.

# 11. The Relationship Between World Models and Value Learning

| World Model | Value Function |
|-|-|
| Predicts future states or representations | Compresses future cumulative return |
| Can generate imagined rollouts | Can evaluate rollouts and terminal states |
| Errors arise from dynamics prediction | Errors arise from return extrapolation and credit assignment |
| Supports explicit planning | Supports action ranking and policy gradients |

Dreamer-style methods imagine the future within a world model and then train an Actor-Critic; model-free RL does not explicitly predict future states. The two approaches are not mutually exclusive.

# 12. A Two-Action Toy Example

In state $s$, a robot can choose either “fast grasp” or “slow grasp.” A successful fast grasp receives 1, a failed one receives 0, and its success rate is 0.6. The slow grasp has a success rate of 0.9 but incurs a time penalty of 0.2.

$$Q(s,a_{\mathrm{fast}})=0.6$$

> **Reading:** The expected task return of the fast-grasp action equals the success probability of 0.6 multiplied by the success reward of 1.

**Derivation:** The failure reward is zero, so the expected return is simply the success probability multiplied by the success reward.

$$Q(s,a_{\mathrm{slow}})=0.9-0.2=0.7$$

> **Reading:** The slow grasp’s expected success reward of 0.9 minus the time penalty of 0.2 gives a total return of 0.7.

**Derivation:** Add the success benefit and time cost under the same reward definition. Although the slow grasp takes longer, it is still better than the fast grasp under the current weighting.

If most expert data consists of fast grasps, behavior cloning will favor fast grasps; value learning can identify that slow grasps have a higher long-term return. If the time penalty increases to 0.4, the optimal choice changes again. This demonstrates that policy improvement depends on the reward definition.

# 13. Minimal Experiment: Fixed Data, Comparative Policy Improvement

Construct a two-stage toy grasping environment. In the first step, choose a fast or slow grasp; in the second, choose placement or recovery depending on whether the grasp is stable. Generate a fixed offline dataset containing more fast-grasp examples but a higher success rate for slow grasps, while retaining failure and takeover trajectories.

1. Train behavior cloning, Advantage-weighted behavior cloning, and a conservative offline Q method on exactly the same data.
2. Fix network capacity, training steps, and the reward definition, changing only the policy-improvement algorithm.
3. Report in-distribution action accuracy, actual return, recovery success rate, and collision rate separately.
4. Gradually remove slow-grasp data and observe the critic’s out-of-distribution overestimation and policy degradation.
5. Change the time penalty and verify whether the value ranking changes systematically according to the reward definition.
6. Use a binned reliability diagram to check whether predicted Q-values are calibrated against actual success rates.

# 14. Failure Modes and Diagnostics

| Failure Mode | Diagnostic Evidence | Mitigation |
|-|-|-|
| Reward hacking | Return increases while actual success, safety, or stability declines | Multi-metric constraints, human audits, regression testing on counterexamples |
| Out-of-distribution overestimation | High-Q actions are rare in the data and fail during real execution | Conservative value estimation, behavior constraints, uncertainty gating |
| Credit-assignment error | Whole-trajectory labels cannot localize the stage responsible for success or failure | Stage rewards, segment preferences, supervision at takeover times |
| Miscalibrated Critic | Value bins do not correspond to actual success rates | Calibration, target networks, broader coverage, and stratified evaluation |
| Policy forgetting | Reward-task performance improves while foundational skills and language following degrade | KL regularization, mixed pretraining data, capability regression suites |
| Intervention-selection bias | Takeover data covers only errors that humans detect in time | Record non-intervention controls, active sampling, causal analysis |

# 15. Trustworthy Evaluation

1. **Equal-data comparison:** Compare standard SFT with value/Advantage-based methods.
2. **Value calibration:** Determine whether predicted value bins agree with actual success rates.
3. **Safety metrics:** Collisions, peak force, and takeover rate must not be obscured by average return.
4. **Task stages:** Report approach, contact, manipulation, release, and recovery separately.
5. **Out-of-distribution evaluation:** Use new objects, initial states, and dynamics parameters.
6. **Confidence intervals:** Success rates must include the number of trials and uncertainty.

# 16. Exercises

1. Derive the Bellman expectation equation from the definition of return.
2. Explain the bias-variance difference between Monte Carlo and TD.
3. Derive why an Advantage baseline does not change the expected policy gradient.
4. Design an experiment that distinguishes gains from additional data from gains due to the RL algorithm.
5. Design a reward for a contact task and list possible forms of reward hacking.
6. Explain why π0.6\* is simultaneously an example of a VLA lab and the value-based track.

# 17. Paper Landscape and Evidence Boundaries

| Work | Paper Fact | Author Interpretation | Course Assessment |
|-|-|-|-|
| SAC | Optimizes expected return and policy entropy using a continuous-action Actor-Critic | The maximum-entropy objective can improve exploration and robustness | It is a baseline for online continuous control, but real-robot sample, safety, and reset costs must be accounted for separately |
| CQL | Applies conservative regularization to the values of actions unsupported by offline data | Conservative Q estimation can mitigate out-of-distribution overestimation | Reducing overestimation does not automatically produce a better policy; comparisons against behavior cloning and controls for data coverage are required |
| IQL | Avoids explicitly evaluating out-of-distribution actions and updates the policy through expectile value estimation and Advantage weighting | It can enable stable offline learning without a behavior-policy model | Performance remains limited by coverage of high-quality behavior in the data; it cannot create evidence for entirely absent skills |
| DAgger | Iteratively collects expert corrections in states visited by the current policy, mitigating distribution shift in imitation learning | Online corrections can cover states caused by the policy itself | It is primarily interactive imitation rather than reward-based RL, but is extremely important for producing recovery data in Physical AI |
| RECAP | Uses success, failure, and correction data from VLA deployments to continue improving the policy | Feeding real-world experience back into training can scale general-purpose robot-policy capabilities | The amount of additional data must be fixed and compared against standard SFT to distinguish gains from the value mechanism rather than data scale |

[π0.6\* / RECAP: How VLAs Learn from Deployment Experience](/en/route-a/06-a3-4-π0-6-recap-机器人如何从成功-失败和纠正中改进)

<bookmark name="Soft Actor-Critic" href="https://arxiv.org/abs/1801.01290"></bookmark>

<bookmark name="Conservative Q-Learning" href="https://arxiv.org/abs/2006.04779"></bookmark>

<bookmark name="Offline Reinforcement Learning with Implicit Q-Learning" href="https://arxiv.org/abs/2110.06169"></bookmark>

<bookmark name="DAgger" href="https://proceedings.mlr.press/v15/ross11a.html"></bookmark>
