# 스택 / Stack Data Structure

## 📌 Definition

A **Stack** is a linear data structure that follows the **LIFO (Last In First Out)** principle.  
The last element inserted into the stack is the first one to be removed.  
All insertions (`push`) and deletions (`pop`) happen at the **top** of the stack.

---

## 🧠 How It Works

- **Push**: Add an element to the top of the stack.
- **Pop**: Remove the top element from the stack.
- **Top/Peek**: View the top element without removing it.
- **isEmpty**: Check if the stack is empty.
- **isFull**: (In fixed-size stacks) Check if the stack has reached its capacity.

Internally, a stack can be implemented using:
- **Arrays** (fixed size),
- **Linked Lists** (dynamic size),
- **Deques** (double-ended queues for enhanced flexibility).

---

## ⏱ Time and Space Complexity

| Operation   | Time Complexity | Space Complexity |
|-------------|------------------|-------------------|
| push()      | O(1)             | O(1)              |
| pop()       | O(1)             | O(1)              |
| top()/peek()| O(1)             | O(1)              |
| isEmpty()   | O(1)             | O(1)              |
| isFull()    | O(1)             | O(1)              |

---

## ✅ Characteristics

### ➕ Advantages
- Simple and easy to implement.
- Fast constant-time operations.
- Useful in problems involving **reversal**, **matching**, and **backtracking**.
- Can be implemented with arrays or linked lists depending on need.

### ➖ Disadvantages
- Limited access (only top accessible).
- Fixed-size stacks may overflow (static implementation).
- Recursive stack usage can lead to overflow in deep recursions.

---

## 🧭 When to Use

- When the order of elements must be reversed.
- When tracking function calls or states (as in recursion).
- For expression parsing, undo features, and tree/graph traversal.
- When you need to match pairs (e.g., parentheses, tags).

---

## 🔍 Typical Applications

- **Function Call Stack** in recursion and execution tracking.
- **Undo/Redo** functionality in text editors.
- **Expression Parsing** (infix to postfix, postfix evaluation).
- **Balanced Parentheses** checking.
- **Depth-First Search (DFS)** in trees and graphs.
- **Browser History** navigation.

---