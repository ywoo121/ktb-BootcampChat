# 큐 / Queue Data Structure

## 📌 Definition

A **Queue** is a linear data structure that follows the **FIFO (First In First Out)** principle.  
The first element added to the queue is the first one to be removed.  
It is analogous to a queue in real life, such as people standing in line — the first person in is the first one served.

---

## 🧠 How It Works

A queue maintains two main pointers:
- **Front**: Indicates the element to be dequeued next.
- **Rear**: Indicates the position where a new element will be enqueued.

### Basic Operations:
- `enqueue(x)`: Add element `x` to the rear.
- `dequeue()`: Remove and return element from the front.
- `peek()/front()`: View the front element without removing.
- `isEmpty()`: Check if queue is empty.
- `isFull()`: (In fixed-size implementations) Check if queue is full.

### Implementations:
- Using **arrays**
- Using **linked lists**
- Using **circular arrays**
- Using **two stacks**
- Using **deque (double-ended queue)**

---

## ⏱ Time and Space Complexity

| Operation   | Time Complexity | Space Complexity |
|-------------|------------------|-------------------|
| enqueue     | O(1)             | O(1)              |
| dequeue     | O(1)             | O(1)              |
| peek/front  | O(1)             | O(1)              |
| isEmpty     | O(1)             | O(1)              |
| isFull      | O(1)             | O(1)              |

---

## ✅ Characteristics

### ➕ Advantages
- Simple to implement.
- Constant time insertion and deletion.
- Naturally models producer-consumer scenarios.

### ➖ Disadvantages
- In array-based implementations, memory may be wasted unless managed using circular arrays.
- Fixed-size queues can overflow if not dynamically resized.

---

## 🧭 When to Use

- When order of processing matters (First-In-First-Out).
- For scheduling tasks or buffering data.
- In breadth-first search or level-order tree traversals.

---

## 🔍 Typical Applications

- **CPU Scheduling** (Round Robin)
- **Breadth First Search (BFS)** in graphs/trees
- **I/O Buffers**, task queues
- **Print Spoolers**
- **Message Queues** in operating systems
- **Topological Sorting**
- **Handling Requests in Web Servers**

---