# 슬라이딩 윈도우 / Sliding Window Technique

## 📌 Definition

The **Sliding Window Technique** is a method for solving problems that involve **contiguous subarrays** or **substrings** by maintaining a “window” of elements and **updating** its result as the window moves through the data.

---

## 🧠 How It Works

There are two main flavors:

1. **Fixed-Size Window**  
   - **Initialize** the window over the first *k* elements and compute its result (sum/count/etc.).  
   - **Slide**: For each step, **remove** the contribution of the leftmost element and **add** the next element on the right.  
   - **Update** your best answer at each slide.  

2. **Variable-Size Window**  
   - Use two pointers, **left** and **right**, both starting at 0.  
   - **Expand** `right` until a condition is met (e.g. sum ≥ S, or #distinct ≤ K).  
   - **Contract** `left` while the condition still holds (to find minimal/maximal window).  
   - **Record** or **update** the result whenever the window meets the desired criteria.  

---

## ⏱ Time & Space Complexity

| Variant                   | Time Complexity | Space Complexity |
|---------------------------|-----------------|------------------|
| Fixed-Size Window         | O(n)            | O(1)             |
| Variable-Size Window      | O(n)            | O(1) or O(k)     |

---

## ✅ Characteristics

### ➕ Advantages
- **Single pass** over the data—very efficient.
- **O(1)** updates per move—no nested loops.
- Easy to implement once window logic is clear.

### ➖ Disadvantages
- Only applies to **contiguous** segments.
- Condition must be **monotonic** (expanding/retracting window preserves validity).

---

## 🧭 When to Use

- You need **sum, count, max/min**, or other aggregate over every **contiguous** subarray/substring.
- The subarray size is **fixed** (e.g. size = k) or can **grow/shrink** based on a criterion (e.g. sum ≥ S, ≤ K distinct).
- Desired time is **O(n)**, and a brute-force O(n·k) is too slow.

---

## 🔍 Typical Applications

- **Maximum sum** of any subarray of size *k*.  
- **Longest substring** with no more than *K* distinct characters.  
- **Shortest subarray** with sum ≥ *S*.  
- **Count of subarrays** whose sum equals *k*.  
- **Permutation check**: find anagram substrings in a text.  
- **0–1 BFS** level tracking (as a special deque-based window).

---

## 🛠 Example: Maximum Sum of Subarray of Size *k*

```python
def max_sum_fixed_window(arr, k):
    n = len(arr)
    if n < k:
        return None  # invalid

    # sum of first window
    window_sum = sum(arr[:k])
    max_sum = window_sum

    # slide the window
    for i in range(k, n):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)

    return max_sum

# Usage
arr = [1, 4, 2, 10, 23, 3, 1, 0, 20]
print(max_sum_fixed_window(arr, 4))  # Output: 39