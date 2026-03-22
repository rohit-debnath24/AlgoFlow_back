# AlgoForge Lite Contracts

PyTeal app implements pay-on-success and reputation deltas for executor nodes.

- Global: total_jobs, total_failures
- Local per node: rep, s (success count), f (fail count)
- Methods:
  - create: init globals
  - opt-in: init local state
  - submit(status, payout):
      * status=1: increment success, reputation +1, optional payout payment
      * status=0: increment fail, reputation -1

Build:
```
python app.py > approval.teal
```
Use algokit/goal to deploy; ensure app account is funded for payouts.
