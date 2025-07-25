# 랜덤 알고리즘 / Randomized Algorithms

## 📌 Definition

A **Randomized Algorithm** is an algorithm that uses **randomness** as part of its logic. It makes random choices at one or more steps during execution to improve performance, simplify implementation, or handle uncertainty.

Unlike deterministic algorithms, the **same input may lead to different outcomes** on different runs.

---

## 🎲 Why Use Randomized Algorithms?

- Simpler and often **faster** than deterministic solutions.
- Useful for **approximation** when exact solutions are hard.
- Helps in **breaking worst-case patterns** (e.g., QuickSort on sorted data).
- Essential in **probabilistic modeling** and **large-scale data** problems.

---

## 📂 Types of Randomized Algorithms

### 1. **Monte Carlo Algorithms**
- Always **fast**, but **may give incorrect results** with a small probability.
- Example: **Miller-Rabin Primality Test**.
- Trade-off: **Speed over absolute correctness**.

### 2. **Las Vegas Algorithms**
- Always produce **correct results**, but **runtime is variable** due to randomness.
- Example: **Randomized QuickSort**, **Karger's Algorithm**.
- Trade-off: **Correctness over predictable runtime**.

---

## 🔁 General Structure

```python
def randomized_algorithm(input):
    while not termination_condition:
        random_choice = random()
        apply_choice()
        if valid_solution_found:
            return result
```

---

## 🔍 Analysis Techniques

### ✨ Linearity of Expectation
Used to compute the **expected cost** or time over multiple independent operations.

### 🔁 Expected Number of Trials
Used to calculate average steps before success (e.g., geometric distribution in pivot selection).

---

## ⚙ Example: Randomized QuickSort

### Idea
Pick pivot randomly to avoid worst-case O(n²) behavior of QuickSort.

### Pseudocode
```text
1. If low >= high, return.
2. Choose pivot randomly between [low, high].
3. Partition array around pivot.
4. Recur for left and right partitions.
```

### Time Complexity
- **Expected time:** O(n log n)
- **Worst-case (rare):** O(n²)

---

## 🧠 Sample Code: Simple Random Pick

```python
import random
import time

def find_solution(n):
    random.seed(time.time())
    return random.randint(1, n)

print("Solution:", find_solution(10))
```

---

## 📊 Complexity (Randomized QuickSort with central pivot check)

Let `T(n)` be the expected time:
```
T(n) < T(n/4) + T(3n/4) + O(n)
=> O(n log n)
```

---

## 📌 Applications

| Domain                  | Example Algorithm                     |
|-------------------------|---------------------------------------|
| Sorting/Search          | Randomized QuickSort, Skip Lists      |
| Graph Theory            | Karger’s Algorithm (Min-Cut)          |
| Geometry                | Randomized Closest Pair of Points     |
| Number Theory           | Miller-Rabin Primality Test           |
| Cryptography            | RSA Key Generation                    |
| Data Structures         | Hashing with randomization            |
| Approximation           | Monte Carlo simulations               |

---

## ✅ Advantages

- Often **faster** than deterministic counterparts
- Handles **adversarial input** better (e.g., pivot selection in QuickSort)
- Simpler implementations
- Suitable for **parallel/distributed systems**

---

## ❌ Disadvantages

- Results or runtime may vary between runs
- Difficult to **debug** and **test**
- Sometimes **inaccurate** (Monte Carlo)

---

## 🧭 When to Use

- When deterministic algorithms are **too slow or complex**
- For **approximate solutions**
- In **online, probabilistic, or large-scale systems**
- When randomness avoids **worst-case patterns**

---

## 📚 References

- [Randomized Algorithms Lecture Notes – TIFR](http://www.tcs.tifr.res.in/~workshop/nitrkl_igga/randomized-lecture.pdf)
- *Randomized Algorithms*, Motwani and Raghavan