# 투 포인터 / Two Pointers Technique

## 📌 Definition

The **Two Pointers** technique is an efficient method for solving problems on **sorted arrays or sequences**, especially where you're required to find **pairs or subarrays** that satisfy certain conditions like a specific sum, difference, or product.

---

## 🧠 How It Works

1. **Initialize Two Pointers**:
   - `left = 0` (start of the array)
   - `right = n - 1` (end of the array)

2. **While** `left < right`:
   - Compute `current_sum = arr[left] + arr[right]`
   - If `current_sum == target`: pair found
   - If `current_sum < target`: increment `left` to increase the sum
   - If `current_sum > target`: decrement `right` to decrease the sum

3. Return whether a valid pair was found.

---

## ✅ Example

```python
def two_sum(arr, target):
    arr.sort()  # Make sure the array is sorted
    left, right = 0, len(arr) - 1

    while left < right:
        total = arr[left] + arr[right]
        if total == target:
            return True
        elif total < target:
            left += 1
        else:
            right -= 1
    return False

# Example usage:
arr = [0, -1, 2, -3, 1]
target = -2
print("true" if two_sum(arr, target) else "false")
```

**Output:**
```
true
```

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity | Space Complexity |
|--------------|------------------|------------------|
| All Cases    | O(n)             | O(1)             |

- If sorting is needed: O(n log n)
- After sorting: pointer traversal takes O(n)

---

## 🧭 When to Use

- Array is sorted or can be sorted
- Find pairs, triplets, or subarrays with a given sum or difference
- Problems involving merging or comparing sequences

---

## 📚 Applications

- Two Sum (sorted array)
- Three Sum (with outer loop)
- Trapping Rain Water
- Container With Most Water
- Remove Duplicates In-place
- Merge Sorted Arrays
- Minimum Window Substring (with variation)

---

## 🔍 Why It Works

- The array is sorted; therefore:
  - Moving `left` rightward increases sum
  - Moving `right` leftward decreases sum
- Every step **guarantees elimination** of impossible pairs

Thus, no valid pair is missed during traversal.

---

## 📎 Related Concepts

- Sliding Window Technique
- Binary Search
- Hashing (for Two Sum in unsorted arrays)
- Greedy Algorithms