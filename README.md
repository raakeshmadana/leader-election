# Leader Election in Synchronous Networks
___
## Background
### Simulating Synchronous System
Master-Worker architecture is used to simulate the concept of rounds in a
synchronous distributed system. The workers start each round on receiving the
signal from the master, which sends the signal only after all workers have
finished processing in a round.

### Floodmax
- Leader with the maximum UID is chosen to be leader.
- Each process floods the maximum UID it encounters on every outgoing link.
- All processes receive the value of the maximum UID in O(diameter) rounds.

### Termination
Since the individual processes have no idea about the underlying network
topology, they cannot terminate in `diameter` rounds. Convergecast mechanism can
be used to terminate.
#### Convergecast
A spanning tree is built on the fly using the floodmax messages. A distinguished
source worker starts this process. It takes O(diameter) rounds for the source
worker to know about the completion of the tree-build, when it takes the
decision to terminate the floodmax algorithm.

Read more about convergecast
[here](http://www.cs.yale.edu/homes/aspnes/pinewiki/ConvergeCast.html)

### Input to the master
- Number of processes
- A Unique ID (UID) for each process
- Connectivity information as an adjacency matrix

The master, on receiving this input spawns the worker processes. Each worker
process knows only about its neighbors. (All links are __bidirectional__)

### Output
- Leader's UID
- The spanning tree built as an
  - Adjacency List
  - Adjacency Matrix
