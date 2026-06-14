export const DEFAULT_NOTEBOOK_TREE = [
  {
    id: "nb-node-1",
    title: "Algorithms & Complexities",
    status: "solved",
    collapsed: false,
    type: "folder",
    body: `<h2>Quick Big-O Summary</h2><ul><li><strong>O(1)</strong>: Constant — direct hash lookup</li><li><strong>O(log N)</strong>: Logarithmic — binary search trees</li><li><strong>O(N)</strong>: Linear — standard single loops</li><li><strong>O(N log N)</strong>: Log-Linear — heapsort, mergesort</li></ul><h2>Code Sandbox: Binary Search (C++)</h2><pre class="code-block" data-lang="cpp"><code>int binarySearch(vector&lt;int&gt;&amp; nums, int target) {
    int left = 0, right = nums.size() - 1;
    while (left &lt;= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] &lt; target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}</code></pre><div class="rendered-callout callout-note"><div class="callout-header" contenteditable="false"><span class="callout-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span><span class="callout-title">NOTE</span></div><div class="callout-body"><p><strong>Active Recall Trigger</strong>: What are the time and space complexities of binary search? When does it fail?</p><p><strong>Solution Key</strong>: Time O(log N), Space O(1) iterative / O(log N) recursive. Fails on unsorted arrays — always verify sorted precondition.</p></div></div><p><br></p>`,
    children: [
      {
        id: "nb-node-1-1",
        title: "Binary Search Deep Dive",
        status: "review",
        type: "file",
        body: `<p>Always watch out for integer overflows when calculating midpoints.</p><p>Use <code>int mid = left + (right - left) / 2;</code> rather than <code>(left + right) / 2</code> — the latter can overflow when both values are near INT_MAX.</p><div class="rendered-callout callout-tip"><div class="callout-header" contenteditable="false"><span class="callout-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21h6M9 17h6M12 2v3M5 12h3M16 12h3M12 22a5 5 0 0 1-5-5h10a5 5 0 0 1-5 5z"/></svg></span><span class="callout-title">TIP</span></div><div class="callout-body"><p>For rotated sorted array problems, binary search still applies — check which half is sorted first.</p></div></div><p><br></p>`,
        children: []
      }
    ]
  },
  {
    id: "nb-node-2",
    title: "Low-Latency HFT Designs",
    status: "todo",
    collapsed: true,
    type: "folder",
    body: `<p>Architecting ultra-low latency execution pathways for high-frequency trading systems.</p><h2>Key Architectural Paradigms</h2><ul><li>Pinning threads to isolated CPU cores to eliminate OS scheduler interference.</li><li>Avoiding dynamic heap allocation (Zero GC) — use arena/pool allocators.</li><li>Utilizing single-writer lock-free ring buffers (Disruptor pattern).</li><li>Bypassing standard Linux network sockets via kernel bypass (Solarflare EF_VI).</li></ul><div class="rendered-callout callout-important"><div class="callout-header" contenteditable="false"><span class="callout-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span><span class="callout-title">IMPORTANT</span></div><div class="callout-body"><p>The critical path must have <strong>zero dynamic allocations</strong>. Pre-allocate all memory at startup before market open.</p></div></div><p><br></p>`,
    children: []
  }
];

export const DEFAULT_STATE = {
  activeTab: "learning-dashboard",
  activeDomain: "",
  activePatternId: "disruptor",
  activeQuestionId: null,
  activeCompanyId: null,
  theme: "light",
  streak: 5,
  lastStudiedDate: new Date().toISOString().slice(0, 10),
  prepPlan: [
    {
      week: 1,
      title: "Low-Latency & Lock-Free Systems",
      focus: "HFT Core Architecture",
      tasks: [
        { id: "p-1-1", text: "Read LMAX Disruptor whitepaper", checked: true },
        { id: "p-1-2", text: "Implement a Lock-Free Ring Buffer in C++ / Java", checked: false },
        { id: "p-1-3", text: "Study Cache Line bouncing & padding techniques", checked: true }
      ]
    },
    {
      week: 2,
      title: "Core Networking & Multicast",
      focus: "L4 Protocols & Bypass",
      tasks: [
        { id: "p-2-1", text: "Understand TCP three-way handshake & teardown", checked: true },
        { id: "p-2-2", text: "Research Solarflare Kernel Bypass (EF_VI, TCP Direct)", checked: false },
        { id: "p-2-3", text: "Write basic UDP Multicast receiver and publisher", checked: false }
      ]
    },
    {
      week: 3,
      title: "C++ Memory Paradigms",
      focus: "Allocators & Optimizations",
      tasks: [
        { id: "p-3-1", text: "Study Custom Allocators (Arena, Pool)", checked: false },
        { id: "p-3-2", text: "Review smart pointer under-the-hood layouts", checked: false },
        { id: "p-3-3", text: "Analyze RAII patterns in resource management", checked: false }
      ]
    },
    {
      week: 4,
      title: "Linear Data Structures",
      focus: "NeetCode Standard Prep",
      tasks: [
        { id: "p-4-1", text: "Complete Arrays & Hashing (NeetCode 150)", checked: true },
        { id: "p-4-2", text: "Solve Two Pointers easy/medium items", checked: true },
        { id: "p-4-3", text: "Attempt Sliding Window core challenges", checked: false }
      ]
    },
    {
      week: 5,
      title: "Linux Kernel Deep Dives",
      focus: "OS Level Performance Tuning",
      tasks: [
        { id: "p-5-1", text: "Implement CPU Affinity pinning using pthread APIs", checked: false },
        { id: "p-5-2", text: "Configure Hugepages in a Linux Sandbox environment", checked: false },
        { id: "p-5-3", text: "Compare epoll() vs poll() vs select()", checked: false }
      ]
    },
    {
      week: 6,
      title: "Financial Exchange Protocols",
      focus: "Decoding and Transport Layers",
      tasks: [
        { id: "p-6-1", text: "Build a highly-optimized FIX session parser", checked: false },
        { id: "p-6-2", text: "Compare FAST Compression vs simple FIX tag-value", checked: false },
        { id: "p-6-3", text: "Study Nasdaq ITCH and OUCH direct binary feeds", checked: false }
      ]
    }
  ],
  domains: {},
  neetcode: [
    { id: "nc-1", title: "Contains Duplicate", difficulty: "Easy", topic: "Arrays & Hashing", status: "Done", link: "https://leetcode.com/problems/contains-duplicate/", code: "class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        unordered_set<int> seen;\n        for (int x : nums) {\n            if (seen.count(x)) return true;\n            seen.insert(x);\n        }\n        return false;\n    }\n};", notes: "Standard hash set insertion. Very fast." },
    { id: "nc-2", title: "Valid Anagram", difficulty: "Easy", topic: "Arrays & Hashing", status: "To Do", link: "https://leetcode.com/problems/valid-anagram/", code: "", notes: "" },
    { id: "nc-3", title: "Two Sum", difficulty: "Easy", topic: "Arrays & Hashing", status: "Doing", link: "https://leetcode.com/problems/two-sum/", code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> m;\n        for (int i = 0; i < nums.size(); ++i) {\n            int diff = target - nums[i];\n            if (m.count(diff)) return {m[diff], i};\n            m[nums[i]] = i;\n        }\n        return {};\n    }\n};", notes: "One-pass hash map search. O(N) time." },
    { id: "nc-4", title: "Group Anagrams", difficulty: "Medium", topic: "Arrays & Hashing", status: "Needs Review", link: "https://leetcode.com/problems/group-anagrams/", code: "", notes: "Sort each word to create a unique hash map key." },
    { id: "nc-5", title: "Valid Palindrome", difficulty: "Easy", topic: "Two Pointers", status: "Done", link: "https://leetcode.com/problems/valid-palindrome/", code: "", notes: "Use two pointers moving inwards. Ignore non-alphanumeric." },
    { id: "nc-6", title: "Two Sum II - Input Array Is Sorted", difficulty: "Medium", topic: "Two Pointers", status: "Needs Review", link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", code: "", notes: "Classic two pointer squeeze. Target match determines pointer increment." },
    { id: "nc-7", title: "Best Time to Buy & Sell Stock", difficulty: "Easy", topic: "Sliding Window", status: "Done", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", code: "", notes: "Track minimum buy price dynamically while sliding right pointer." },
    { id: "nc-8", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topic: "Sliding Window", status: "To Do", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", code: "", notes: "" },
    { id: "nc-9", title: "Invert Binary Tree", difficulty: "Easy", topic: "Trees", status: "Done", link: "https://leetcode.com/problems/invert-binary-tree/", code: "", notes: "Standard post-order traversal swaps left and right child." },
    { id: "nc-10", title: "Maximum Depth of Binary Tree", difficulty: "Easy", topic: "Trees", status: "To Do", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", code: "", notes: "" }
  ],
  companies: [
    {
      id: "citadel",
      name: "Citadel / Citadel Securities",
      type: "Quantitative Fund / Market Maker",
      topics: ["Extreme C++ performance", "Advanced multi-threading", "Low-latency systems design", "Quant algorithms"],
      status: "Interviewing",
      rounds: [
        { num: 1, title: "Online Assessment (OA)", desc: "Hard algorithmic coding challenges (2-3 items on Hackerrank/Codility)." },
        { num: 2, title: "Technical Phone Screens", desc: "1-2 deep-dive sessions focusing on OS internals, concurrency models, and C++ memory layouts." },
        { num: 3, title: "Onsite Loop", desc: "4-5 rounds of intense C++ speed constraints, distributed low-latency design, statistical probability, and behavioral fits." }
      ]
    },
    {
      id: "optiver",
      name: "Optiver",
      type: "Proprietary Market Maker",
      topics: ["80-in-8 Mental Math", "Hardware-software co-design", "Network stack optimizations", "C++ templates"],
      status: "In Progress",
      rounds: [
        { num: 1, title: "Mental Math Test", desc: "80 questions in 8 minutes speed test. Strict penalty thresholds." },
        { num: 2, title: "Technical Interviews", desc: "C++ syntax optimization tests, socket programming, and memory barriers discussion." },
        { num: 3, title: "Onsite Simulation", desc: "Collaborative systems design, refactoring a performance-sensitive codebase, and quick trading games." }
      ]
    },
    {
      id: "janestreet",
      name: "Jane Street",
      type: "Proprietary Trading Firm",
      topics: ["OCaml / Functional paradigms", "Advanced probability", "System designs without locks", "Algorithmic thinking"],
      status: "Applied",
      rounds: [
        { num: 1, title: "Coding Interview", desc: "Clean, elegant functional-style code challenges emphasizing invariants and recursion." },
        { num: 2, title: "Probability & Estimation", desc: "Brainteasers, game theory, and rapid quantitative mathematical estimation rounds." },
        { num: 3, title: "System Architecture Onsite", desc: "Building scalable, crash-resistant pipelines. Deep focus on data structures and system invariants." }
      ]
    },
    {
      id: "google",
      name: "Google",
      type: "Technology Giant",
      topics: ["Standard LeetCode DSA", "Web-scale Distributed Systems", "System engineering patterns"],
      status: "Rejected",
      rounds: [
        { num: 1, title: "Technical Screener", desc: "1 standard LeetCode Medium/Hard algorithmic challenge." },
        { num: 2, title: "Onsite Loop", desc: "3 algorithmic coding rounds, 1 system design round, and 1 'Googleyness' behavioral round." }
      ]
    }
  ],
  patterns: [
    {
      id: "disruptor",
      title: "LMAX Disruptor Pattern",
      subtitle: "High-throughput, low-latency inter-thread messaging",
      content: `### What is the LMAX Disruptor?
The LMAX Disruptor is a lock-free, high-performance inter-thread communication library based on a ring buffer data structure. It avoids lock contention by using a pre-allocated circular array and memory sequence barriers.

### Core Principles
- **Pre-allocated Memory:** Memory is allocated up front. This eliminates continuous garbage collection (GC) sweeps or heap allocation overheads in the critical execution path.
- **Lock-Free Sequences:** Uses CPU CAS (Compare-And-Swap) operations and volatile sequence counters, completely avoiding kernel-level mutex locks.
- **Cache Line Padding:** Pads sequence trackers to prevent "false sharing" (where two cores write to different variables in the same cache line, triggering unnecessary cache invalidation).

\`\`\`cpp
// High-performance cache-padded sequence tracker in C++
struct alignas(64) PaddedSequence {
    volatile int64_t value = -1;
    // 56 bytes of padding to fill out the remaining 64-byte L1 cache line
    int64_t padding[7]; 
};
\`\`\``
    },
    {
      id: "socket-bypass",
      title: "Kernel Bypass & TCP Direct",
      subtitle: "Bypassing the OS network stack for ultra-low latency",
      content: `### The OS Bottleneck
Standard Linux TCP/IP socket transitions trigger hardware interrupts and context switches into kernel space. This introduces variable latency spikes (jitter) from microsecond to millisecond levels, which is unacceptable in automated market-making.

### Kernel Bypass Mechanisms
- **Direct User-Space Access:** Dedicated network cards (NICs), like Solarflare, map the network card rings directly into user-space memory maps.
- **Solarflare EF_VI / Onload:** EF_VI provides direct raw Ethernet frame ring access. Onload dynamically intercepts standard BSD socket calls (socket, send, recv) and runs them in user space, achieving sub-microsecond latency without code modifications.

\`\`\`cpp
// User-space raw packet reception loop using EF_VI
while (running) {
    if (ef_eventq_poll(&event_q, events, 1) > 0) {
        char* packet_buffer = ef_pkt_get_buf(&packet_ring, events[0]);
        process_feed(packet_buffer);
    }
}
\`\`\``
    },
    {
      id: "linux-isol",
      title: "Thread Pinning & CPU Affinity",
      subtitle: "Eliminating OS context switches via core isolation",
      content: `### Why Core Isolation Matters
By default, the Linux OS scheduler moves threads between CPU cores dynamically to balance load. This invalidates CPU L1/L2 caches and causes heavy latency spikes due to register reloading and context switching.

### How to Pin Threads
- **Kernel Boot Parameters:** Add \`isolcpus=4-7\` to isolation cores at the OS bootloader level. This prevents the scheduler from scheduling normal user tasks on these cores.
- **Programmatic Pinning:** Call \`pthread_setaffinity_np\` inside the thread execution sequence to bind it strictly to the designated isolated core.

\`\`\`cpp
// Pinning C++ thread directly to core 4
cpu_set_t cpuset;
CPU_ZERO(&cpuset);
CPU_SET(4, &cpuset);
pthread_t current_thread = pthread_self();
pthread_setaffinity_np(current_thread, sizeof(cpu_set_t), &cpuset);
\`\`\``
    }
  ]
};
