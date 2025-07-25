# 비트마스크 / Bitwise Algorithms

## 📌 Definition

**Bitwise algorithms** manipulate the individual bits of data directly using bitwise operators. These are highly efficient in terms of speed and memory because operations are executed at the hardware level in the CPU's Arithmetic Logic Unit (ALU).  
They are useful for optimization, encoding/decoding, and solving complex problems in competitive programming.

---

## 🧠 How It Works

Bitwise algorithms perform calculations using **binary representation** of numbers and **bitwise operators** such as:
- `&` (AND)
- `|` (OR)
- `^` (XOR)
- `~` (NOT)
- `<<` (Left Shift)
- `>>` (Right Shift)

These operations are used to:
- Modify individual bits
- Set/unset/toggle bits
- Extract or encode data
- Perform fast multiplication/division by powers of two

---

## ⏱ Time and Space Complexity

| Operation                     | Time Complexity | Space Complexity |
|------------------------------|------------------|-------------------|
| Bitwise operations (AND/OR/NOT/XOR, shifts) | O(1)             | O(1)              |
| Counting set bits (naïve)    | O(log n)         | O(1)              |
| Advanced bit manipulations   | O(1) to O(log n) | O(1)              |

---

## ✅ Characteristics

### ➕ Advantages
- Extremely fast due to direct hardware-level execution.
- Reduces space usage with bit-packing techniques.
- Enables constant-time operations for many common tasks.
- Widely used in **competitive programming**, **low-level systems**, **network protocols**, etc.

### ➖ Disadvantages
- Code readability can suffer due to compact bit logic.
- Requires good understanding of binary representations.
- Errors are harder to debug.

---

## 🧭 When to Use

- You need **maximum speed** for basic operations (multiplication/division by powers of 2).
- You need to **store flags or states** in a compact way.
- You are solving problems involving **subsets, masks**, or **binary encoding**.
- You are dealing with **bitfields**, **hashing**, or **performance-critical code** (embedded systems, cryptography, image processing).

---

## 🔍 Typical Applications

- ✅ Fast multiplication/division by powers of 2 using shifts.
- ✅ Counting set bits / parity.
- ✅ Checking if a number is a **power of 2**.
- ✅ **Subset generation** using binary masks.
- ✅ **Toggling, setting, clearing** specific bits.
- ✅ **Hamming distance**, XOR-based logic.
- ✅ **Digital signal processing**, compression, and cryptography.
- ✅ Efficient **data structures** like Bloom filters, Fenwick trees (in low-level optimizations).

---

## 🔧 Common Bitwise Tricks

| Task                                    | Bitwise Technique                                      |
|-----------------------------------------|--------------------------------------------------------|
| Set bit at position `i`                 | `num |= (1 << i)`                                      |
| Clear bit at position `i`               | `num &= ~(1 << i)`                                     |
| Toggle bit at position `i`              | `num ^= (1 << i)`                                      |
| Check bit at position `i`               | `(num & (1 << i)) != 0`                                |
| Multiply `n` by 2<sup>k</sup>           | `n << k`                                               |
| Divide `n` by 2<sup>k</sup>             | `n >> k`                                               |
| Check if `n` is power of 2              | `n > 0 and (n & (n - 1)) == 0`                         |
| Count set bits (Brian Kernighan’s algo) | `while n: count += 1; n &= (n - 1)`                    |
| Rightmost set bit position              | `pos = log2(n & -n) + 1`                               |
| Compute XOR from 1 to n                 | `n,1,n+1,0` depending on `n % 4`                       |

---

## 💡 Summary

- Bitwise algorithms leverage **binary-level data manipulation** for performance and space optimization.
- They are essential in systems programming, compression, and **algorithmic problem-solving**.
- While powerful, they demand precision and understanding of **binary arithmetic**.

---
