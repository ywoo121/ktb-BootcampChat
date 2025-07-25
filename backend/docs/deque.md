# 덱 / Deque (Double-Ended Queue)

## 📌 Definition

A **Deque** (Double-Ended Queue) is a **generalized queue** that allows insertion and deletion at **both the front and the back**.  
It can serve as both a **FIFO** (queue) or **LIFO** (stack) structure.

---

## 🧠 How It Works

A Deque can be implemented in two main ways:

1. **Circular Array**  
   - Fixed-size buffer with head/tail pointers that wrap around.  
   - Supports `O(1)` *amortized* `push`/`pop` at both ends.
2. **Doubly-Linked List**  
   - Each node has `prev` and `next` pointers.  
   - True `O(1)` `push`/`pop` at both ends, at the cost of extra memory per node.

**Core Operations**  
| Operation         | Description                          | Complexity |
|-------------------|--------------------------------------|------------|
| `push_front(x)`   | Insert `x` at the front              | O(1)       |
| `pop_front()`     | Remove and return front element      | O(1)       |
| `push_back(x)`    | Insert `x` at the back               | O(1)       |
| `pop_back()`      | Remove and return back element       | O(1)       |
| `front()`         | Peek at front element (no removal)   | O(1)       |
| `back()`          | Peek at back element (no removal)    | O(1)       |
| `empty()`         | Check if empty                       | O(1)       |
| `size()`          | Number of elements                   | O(1) or O(n) depending on impl. |

---

## ⏱ Time & Space Complexity

| Aspect                    | Complexity    |
|---------------------------|---------------|
| **Insertion/Deletion**    | O(1) amortized |
| **Peeking (front/back)**  | O(1)          |
| **Random access**         | O(n) (array) / O(n) (list) |
| **Space**                 | O(n)          |

---

## ✅ Characteristics

### ➕ Advantages
- Supports both **FIFO** and **LIFO** patterns.
- **Constant-time** insertion/removal at both ends.
- Ideal for **sliding-window**, **undo/redo**, and **cache** implementations.

### ➖ Disadvantages
- No efficient random indexing (unlike vector/array).
- Slightly more memory overhead than a simple queue/stack.
- Circular-buffer implementations require sizing ahead of time or resizing logic.

---

## 🧭 When to Use

- You need to **add/remove** elements at both ends.
- You’re solving **sliding-window** problems (e.g., max/min in a window).
- Implementing **0-1 BFS** or **bidirectional search**.
- Building **LRU cache** or **undo/redo** stacks.
- Managing **history buffers** (e.g., shell command history).

---

## 🔍 Typical Applications

- **Sliding-Window Maximum/Minimum**  
- **0-1 BFS** on weighted graphs  
- **LRU Cache** (move accessed item to front/back)  
- **Palindrome Checker** (compare front & back)  
- **Task Scheduling** (deque of ready tasks)  

---

## 💻 Language Support

- **C++**: `std::deque<T>`
- **Java**: `java.util.Deque<T>` (e.g., `ArrayDeque`, `LinkedList`)
- **Python**: `collections.deque`
- **JavaScript**: can emulate with `Array` (use `push`, `pop`, `shift`, `unshift`)