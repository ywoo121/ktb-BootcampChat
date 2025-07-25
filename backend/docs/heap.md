# 힙 / Heap Data Structure

## 📌 Definition

A **Heap** is a specialized **complete binary tree** that satisfies the **heap property**:
- In a **Min Heap**, each parent node is **less than or equal** to its children.
- In a **Max Heap**, each parent node is **greater than or equal** to its children.

Heaps are most commonly used to implement **priority queues**, and support efficient access to the minimum or maximum element.

---

## 🧠 How It Works

- A **heap** is typically implemented as an **array**, using the following index relationships:
  - `parent(i) = (i - 1) // 2`
  - `left(i)   = 2 * i + 1`
  - `right(i)  = 2 * i + 2`

### Heap Operations:

| Operation       | Description                                  |
|-----------------|----------------------------------------------|
| `insert(x)`     | Insert a new element and heapify up          |
| `extractMin()`  | Remove the minimum element and heapify down  |
| `decreaseKey(i, newVal)` | Decrease value and heapify up       |
| `delete(i)`     | Replace with `-∞`, heapify up, then pop      |
| `getMin()`      | Return the minimum value (Min Heap)          |

---

## ⏱ Time and Space Complexity

| Operation       | Time Complexity | Space Complexity |
|-----------------|------------------|------------------|
| insert          | O(log n)         | O(1)             |
| extractMin      | O(log n)         | O(1)             |
| decreaseKey     | O(log n)         | O(1)             |
| delete          | O(log n)         | O(1)             |
| getMin / getMax | O(1)             | O(1)             |

---

## ✅ Characteristics

### ➕ Advantages
- Efficient for dynamic priority queue operations.
- Fast access to the minimum or maximum value.
- Predictable performance with logarithmic time bounds.

### ➖ Disadvantages
- Not suitable for search operations (not ordered).
- More complex than simple list or queue structures.

---

## 🧭 When to Use

- When you need **efficient retrieval of the minimum or maximum element**.
- In algorithms that require **priority-based processing**, such as greedy approaches.
- When sorting is required but not repeatedly (e.g. **Heap Sort**).

---

## 🔍 Typical Applications

- **Priority Queues**: Insert, extract-min/max in O(log n) time.
- **Graph Algorithms**:
  - **Dijkstra’s Algorithm** (Min Heap)
  - **Prim’s MST Algorithm**
- **Heap Sort**: O(n log n) time sorting algorithm.
- **Huffman Encoding**: Frequency-based compression using Min Heap.
- **Scheduling Systems**: Job/task management based on priority.
- **Top K Problems**: Kth smallest/largest elements in an array.
- **Load Balancing**: Assigning lowest-load server via Min Heap.

---