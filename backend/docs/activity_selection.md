# 활동 선택 문제 / Activity Selection Problem

## 📌 Definition

The **Activity Selection Problem** is a classical optimization problem where we are given `n` activities with their **start** and **finish** times.  
The goal is to **select the maximum number of non-overlapping activities** that a single person can perform, assuming that no two activities can overlap in time.

This is solved efficiently using the **Greedy Algorithm** approach.

---

## 🧠 How It Works

### Core Idea:
Always select the **activity that finishes the earliest** (among the remaining ones) and **does not overlap** with the previously selected activity.

### Greedy Steps:
1. Pair up each activity with its `(start, finish)` time.
2. Sort the activities by their `finish` times (ascending order).
3. Initialize `last_finish_time = -∞`.
4. Traverse the sorted list:
   - If `activity.start >= last_finish_time`, select the activity.
   - Update `last_finish_time = activity.finish`.

This guarantees the maximum number of compatible (non-overlapping) activities.

---

## ⏱ Time and Space Complexity

| Step                | Time Complexity     | Space Complexity |
|---------------------|---------------------|------------------|
| Sorting             | O(n log n)          | O(n)             |
| Greedy Selection    | O(n)                | O(1) or O(n)     |
| Overall             | **O(n log n)**      | **O(n)**         |

---

## ✅ Characteristics

### ➕ Advantages
- Efficient and easy to implement.
- Optimal for the non-overlapping interval scheduling problem.
- Demonstrates the **greedy choice property** and **optimal substructure**.

### ➖ Disadvantages
- Assumes activities are independent.
- Cannot handle cases where preemption or overlap is allowed.
- Does not handle profit-based selections unless extended to Weighted Interval Scheduling.

---

## 🧭 When to Use

- When you're scheduling tasks without overlap (e.g., classroom bookings, job interviews).
- When the goal is to **maximize the number of activities** (not time or profit).
- When the input is **interval-based** and sorted or can be sorted by end times.

---

## 🔍 Typical Applications

- **Scheduling** meetings, classes, or processes.
- **CPU job scheduling** in operating systems.
- **Event organization** and calendar planning.
- **Greedy subproblems** in interval partitioning and timeline optimization.

---

## 🧾 Python Implementation (Sorting Approach)

```python
def activitySelection(start, finish):
    activities = list(zip(start, finish))
    # Sort activities by finish time
    activities.sort(key=lambda x: x[1])

    count = 0
    last_finish = -1

    for s, f in activities:
        if s > last_finish:
            count += 1
            last_finish = f

    return count

# Example usage
start = [1, 3, 0, 5, 8, 5]
finish = [2, 4, 6, 7, 9, 9]
print(activitySelection(start, finish))  # Output: 4
```

---

## 🧾 Python Implementation (Using Priority Queue)

```python
import heapq

def activitySelection(start, finish):
    pq = []
    for s, f in zip(start, finish):
        heapq.heappush(pq, (f, s))  # sort by finish time

    count = 0
    last_finish = -1

    while pq:
        f, s = heapq.heappop(pq)
        if s > last_finish:
            count += 1
            last_finish = f

    return count

# Example usage
start = [1, 3, 0, 5, 8, 5]
finish = [2, 4, 6, 7, 9, 9]
print(activitySelection(start, finish))  # Output: 4
```

---