import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from services.pdf_service import PDFService
from config import Config

def build_all_pdfs():
    service = PDFService(Config.PDFS_DIR)

    # 1. Physics Chapter 1: Newton's Laws
    service.generate_sample_pdf(
        filename="physics_newtons_laws.pdf",
        title="Chapter 1: Newton's Laws of Motion & Classical Dynamics",
        subject="Physics (Mechanics)",
        content_sections=[
            {
                "heading": "1.1 Introduction to Classical Mechanics & Inertia",
                "subheading": "The Historical Paradigm Shift: Aristotle to Galileo and Newton",
                "text": """For nearly two millennia, the Aristotelian view dominated natural philosophy: that a body requires a continuous, active application of force to sustain uniform motion, and that coming to rest is the natural state of all terrestrial objects.\n\nGalileo Galilei challenged this doctrine through thought experiments involving smooth inclined planes. Galileo deduced that if friction could be eliminated entirely, a ball rolling down an incline and up another would attain the exact same height. If the second plane were flattened horizontally to infinity, the ball would roll forever at invariant velocity.\n\nSir Isaac Newton formalized this revolutionary insight in 1687 in the Philosophiae Naturalis Principia Mathematica as his First Law of Motion."""
            },
            {
                "formula_box": "Newton's First Law (Law of Inertia): An object at rest remains at rest, and an object in motion continues in uniform motion along a straight line at constant speed, unless acted upon by a non-zero net external force (ΣF = 0 ⟹ a = 0, v = const)."
            },
            {
                "heading": "1.2 Newton's Second Law: Force, Mass, and Acceleration",
                "subheading": "Mathematical Formulation and Momentum",
                "text": """Newton did not originally state his second law simply as F = ma, but rather in terms of quantity of motion, which modern physics defines as linear momentum (p = mv).\n\nThe second law states that the rate of change of linear momentum of a body is directly proportional to the applied net external force and occurs along the line in which that force acts.\n\nWhen mass remains invariant with respect to time (dm/dt = 0), differentiation yields the canonical equation: F_net = d(mv)/dt = m(dv/dt) = m·a."""
            },
            {
                "formula_box": "Newton's Second Law: ΣF = m · a   |   In SI Units: 1 Newton (N) = 1 kg · m/s²   |   Vector Form: ΣF_x = m a_x, ΣF_y = m a_y"
            },
            {
                "heading": "1.3 Newton's Third Law: Action-Reaction Interactions",
                "subheading": "Mutual Forces Between Two Distinct Bodies",
                "text": """Forces never occur in isolation; they are mutual interactions between pairs of bodies. Whenever body A exerts a force on body B (F_{A on B}), body B simultaneously exerts an equal magnitude, oppositely directed force back upon body A (F_{B on A}).\n\nA critical conceptual pitfall among students is wondering why action and reaction forces do not cancel each other out to zero. The fundamental reason is that action and reaction forces act on two completely distinct physical bodies, never on the same object! Therefore, they can never balance each other in a single free-body diagram."""
            },
            {
                "formula_box": "Newton's Third Law: F_{A on B} = - F_{B on A}   (Equal magnitude, opposite collinear direction, acting on different bodies)"
            },
            {
                "heading": "1.4 Free-Body Diagrams (FBD) and Friction",
                "subheading": "Systematic Problem-Solving Strategy",
                "text": """A Free-Body Diagram is an indispensable analytical schematic that isolates a single physical body and depicts all external forces acting upon it using vector arrows originating from its center of mass.\n\nFrictional forces oppose relative tangential motion between surfaces in contact:\n1. Static Friction (f_s): Resists the initiation of motion, satisfying f_s <= μ_s · N, where μ_s is the coefficient of static friction and N is the normal contact force.\n2. Kinetic Friction (f_k): Retards ongoing sliding motion, governed by f_k = μ_k · N (where typically μ_k < μ_s).""",
                "key_takeaways": [
                    "Mass is an intrinsic quantitative measure of inertia; Weight is the gravitational force W = mg.",
                    "An object in dynamic equilibrium (constant velocity) has zero net acceleration, hence ΣF = 0.",
                    "Normal force is not automatically equal to mg; it must be deduced from the equation of equilibrium along the axis perpendicular to the contact surface.",
                    "Action-reaction pairs act on different objects and never cancel out on a single object's FBD."
                ]
            }
        ]
    )

    # 2. Physics Chapter 2: Electromagnetism
    service.generate_sample_pdf(
        filename="physics_electromagnetism.pdf",
        title="Chapter 2: Electric Fields, Potential & DC Circuits",
        subject="Physics (Electromagnetism)",
        content_sections=[
            {
                "heading": "2.1 Coulomb's Law and Electrostatic Force",
                "subheading": "Inverse-Square Law for Point Charges",
                "text": """Electrostatics investigates electric charges at rest. Charles-Augustin de Coulomb demonstrated through torsion balance experiments that the electrostatic interaction force between two stationary point charges is directly proportional to the product of the magnitudes of the charges and inversely proportional to the square of the separation distance between them."""
            },
            {
                "formula_box": "Coulomb's Law: F = k · (|q1 · q2|) / r²   where k = 1 / (4πε₀) ≈ 8.99 × 10⁹ N·m²/C²"
            },
            {
                "heading": "2.2 Electric Field & Electric Potential",
                "subheading": "Vector Field and Scalar Energy Landscape",
                "text": """An electric charge alters the space surrounding it, establishing an electric field E = F / q_test (in N/C or V/m). The work required per unit test charge to move from infinity to a point in space defines the Electric Potential V.\n\nCapacitance measures the capacity of a conductor system to store electrostatic charge per unit potential difference: C = Q / V. For a parallel-plate capacitor with plate area A and separation d, C = ε₀ A / d."""
            },
            {
                "heading": "2.3 Direct Current (DC) Circuits & Kirchhoff's Laws",
                "subheading": "Current, Resistance, and Conservation Principles",
                "text": """Electric current I is the net rate of flow of electric charge: I = dQ/dt (Amperes). Ohm's law specifies that for ohmic conductors, V = I · R.\n\nFor complex multi-loop circuits, Gustav Kirchhoff formulated two conservation rules:\n1. Kirchhoff's Current Law (Junction Rule): The algebraic sum of all currents entering a junction equals the sum of currents leaving (Conservation of Charge, ΣI = 0).\n2. Kirchhoff's Voltage Law (Loop Rule): The algebraic sum of changes in potential around any closed circuit loop is zero (Conservation of Energy, ΣΔV = 0).""",
                "key_takeaways": [
                    "Electric field points away from positive source charges and toward negative charges.",
                    "Electrostatic force is conservative; hence line integral of E around any closed loop is zero.",
                    "Capacitors store potential energy U = 1/2 C V².",
                    "Kirchhoff's Junction rule reflects conservation of charge; Loop rule reflects conservation of energy."
                ]
            }
        ]
    )

    # 3. Physics Chapter 3: Optics
    service.generate_sample_pdf(
        filename="physics_optics.pdf",
        title="Chapter 3: Wave Optics & Quantum Dual Nature",
        subject="Physics (Optics & Modern Physics)",
        content_sections=[
            {
                "heading": "3.1 Wave Optics & Young's Double-Slit Experiment",
                "subheading": "Interference, Diffraction, and Wavefronts",
                "text": """Christiaan Huygens proposed that every point on an advancing wavefront acts as a secondary source of spherical wavelets. In 1801, Thomas Young proved the wave character of light by shining monochromatic light through two closely spaced parallel slits, producing an alternating pattern of bright constructive fringes and dark destructive fringes on an observation screen.\n\nConstructive interference occurs when path difference Δx = d · sin(θ) = m · λ, where m is an integer order."""
            },
            {
                "formula_box": "Double-Slit Fringe Spacing: y_m = (m · λ · L) / d   |   Fringe Width: β = (λ · L) / d"
            },
            {
                "heading": "3.2 The Photoelectric Effect & Einstein's Photon Hypothesis",
                "subheading": "Breakdown of Classical Wave Theory",
                "text": """Classical wave theory predicted that electron emission from a metal irradiated with light should depend upon intensity (amplitude) and exhibit a time lag for low intensities. Experimental observations by Heinrich Hertz and Philipp Lenard completely contradicted this:\n1. Emission is instantaneous.\n2. Kinetic energy of emitted photoelectrons depends solely on frequency, not intensity.\n3. Below a threshold frequency ν₀, zero photoelectrons are emitted regardless of intensity.\n\nAlbert Einstein resolved this in 1905 by postulating light travels in quantized packets of energy called photons: E = h·ν."""
            },
            {
                "formula_box": "Einstein's Photoelectric Equation: K_max = h·ν - Φ   where Φ = h·ν₀ is the work function of the metal"
            },
            {
                "heading": "3.3 Wave-Particle Duality & de Broglie Wavelength",
                "subheading": "Matter Waves in Quantum Mechanics",
                "text": """Louis de Broglie hypothesized in 1924 that if radiation exhibits both wave and particle characteristics, matter should likewise possess dual wave-particle properties. For any particle possessing momentum p = mv, its associated matter wavelength is λ = h / p.""",
                "key_takeaways": [
                    "Light exhibits wave phenomena during propagation (interference, diffraction) and particle behavior upon interaction/absorption (photoelectric effect).",
                    "Photon momentum is p = E/c = h/λ.",
                    "Electron diffraction confirmed matter waves experimentally."
                ]
            }
        ]
    )

    # 4. Computer Science Chapter 1: Trees & Graphs
    service.generate_sample_pdf(
        filename="cs_trees_graphs.pdf",
        title="Chapter 1: Data Structures: Trees & Balanced Search Trees",
        subject="Computer Science (Data Structures & Algorithms)",
        content_sections=[
            {
                "heading": "1.1 Hierarchical Tree Fundamentals",
                "subheading": "Nodes, Edges, Heights, and Depths",
                "text": """A tree is a non-linear, hierarchical data structure consisting of nodes connected by directed edges, containing exactly one root node and no cycles. The height of a node is the length of the longest path from that node down to a leaf. The depth of a node is the length of the path from the root to that node.\n\nA Binary Tree is a tree where each node has at most two children, designated as left child and right child."""
            },
            {
                "formula_box": "Tree Math Properties: Max nodes at level L = 2^L  |  Max nodes in binary tree of height H = 2^(H+1) - 1  |  Min height for N nodes = ⌊log₂ N⌋"
            },
            {
                "heading": "1.2 Binary Search Trees (BST)",
                "subheading": "The BST Invariant and Search Guarantees",
                "text": """A Binary Search Tree enforces the BST invariant: For every node X, all values in X's left subtree are strictly less than X.val (value < X.val), and all values in X's right subtree are strictly greater than X.val (value > X.val).\n\nThis invariant enables logarithmic search time O(log N) on average by discarding half the remaining search space at every step. However, if keys are inserted in sorted order, the BST degenerates into an unbalanced linked list with worst-case search complexity O(N)."""
            },
            {
                "heading": "1.3 Tree Traversals",
                "subheading": "Depth-First and Breadth-First Exploration",
                "text": """Traversals systematically visit each node in the tree exactly once:\n1. In-order Traversal (Left -> Root -> Right): Crucially visits nodes in strictly ascending sorted order for any valid BST.\n2. Pre-order Traversal (Root -> Left -> Right): Useful for serializing or cloning tree topologies.\n3. Post-order Traversal (Left -> Right -> Root): Crucial for bottom-up computation, deleting trees, or calculating subtree sizes.\n4. Level-order Traversal (BFS): Explores nodes level-by-level using a FIFO Queue."""
            },
            {
                "heading": "1.4 Self-Balancing Trees: AVL & Rotations",
                "subheading": "Maintaining Guaranteed O(log N) Height",
                "text": """An AVL tree is a self-balancing binary search tree where the balance factor of every node (height(left) - height(right)) is restricted to {-1, 0, +1}. When an insertion or deletion violates this constraint, local tree rotations (Left Rotation, Right Rotation, Left-Right, Right-Left) restore balance in O(1) time without violating the BST invariant.""",
                "key_takeaways": [
                    "A balanced BST guarantees O(log N) search, insertion, and deletion time.",
                    "In-order traversal of a BST always yields keys in ascending sorted order.",
                    "Unbalanced trees risk worst-case O(N) degradation into linear structures.",
                    "AVL trees maintain logarithmic height by executing O(1) pointer rotations upon imbalance."
                ]
            }
        ]
    )

    # 5. Computer Science Chapter 2: Algorithms
    service.generate_sample_pdf(
        filename="cs_algorithms.pdf",
        title="Chapter 2: Algorithmic Paradigms: Dynamic Programming",
        subject="Computer Science (Algorithms)",
        content_sections=[
            {
                "heading": "2.1 The Dynamic Programming Paradigm",
                "subheading": "Optimal Substructure and Overlapping Subproblems",
                "text": """Dynamic Programming (DP) is a powerful algorithmic optimization technique that solves complex problems by breaking them down into simpler, overlapping subproblems. Unlike Divide and Conquer (where subproblems are independent, e.g. Merge Sort), DP is applied when subproblems share sub-subproblems.\n\nTwo essential prerequisites define a problem suitable for DP:\n1. Optimal Substructure: An optimal solution to the overall problem can be constructed from optimal solutions of its constituent subproblems.\n2. Overlapping Subproblems: The recursive formulation revisits the same subproblems repeatedly rather than generating new subproblems."""
            },
            {
                "formula_box": "Fibonacci DP Recurrence: F(n) = F(n-1) + F(n-2) with F(0)=0, F(1)=1   |   Naïve Recursion: O(2^n) ⟹ DP: O(n) Time, O(1) Space"
            },
            {
                "heading": "2.2 Memoization (Top-Down) vs. Tabulation (Bottom-Up)",
                "subheading": "Design Patterns and Trade-offs",
                "text": """1. Top-Down (Memoization): Preserves the natural recursive definition and uses a hash table or array cache to store results of expensive function calls. If a subproblem was previously solved, return cached value immediately.\n2. Bottom-Up (Tabulation): Eliminates recursion completely. Iteratively fills a DP table starting from the smallest base cases up to the target state. Tabulation typically incurs lower function-call overhead and allows memory optimization."""
            },
            {
                "heading": "2.3 The 0/1 Knapsack Problem",
                "subheading": "State Formulation and Decision Trees",
                "text": """Given weights w[i] and values v[i] of N items, determine the maximum value that fits within capacity W. At each item i, we choose to either include it (if w[i] <= remaining capacity) or exclude it:\nDP[i][w] = max(DP[i-1][w], DP[i-1][w - w[i]] + v[i]).""",
                "key_takeaways": [
                    "Identify state parameters that uniquely define a subproblem.",
                    "Formulate a clean mathematical recurrence relation before writing code.",
                    "Recognize overlapping subproblems to transition exponential brute-force into polynomial DP.",
                    "Look for rolling array optimizations to reduce space complexity."
                ]
            }
        ]
    )

    # 6. Computer Science Chapter 3: OS Concurrency
    service.generate_sample_pdf(
        filename="cs_os.pdf",
        title="Chapter 3: Operating Systems: Concurrency & Synchronization",
        subject="Computer Science (Systems)",
        content_sections=[
            {
                "heading": "3.1 Processes, Threads, and Race Conditions",
                "subheading": "Shared Memory and Non-Deterministic Interleaving",
                "text": """While a process encapsulates an isolated virtual address space, threads within the same process share code, global data, and open file descriptors while maintaining private program counters, registers, and call stacks.\n\nWhen multiple threads concurrently read and write shared data without synchronization, a Race Condition occurs: the final outcome depends unpredictably on the arbitrary interleaving of thread execution scheduled by the OS."""
            },
            {
                "heading": "3.2 The Critical Section Problem & Semaphores",
                "subheading": "Mutual Exclusion, Progress, and Bounded Waiting",
                "text": """A critical section is a block of code accessing shared resources that must not be concurrently executed by more than one thread.\n\nA valid synchronization primitive must satisfy:\n1. Mutual Exclusion: At most one thread in the critical section.\n2. Progress: If no thread is in critical section, waiting threads must not be blocked indefinitely.\n3. Bounded Waiting: A limit exists on the number of times other threads can enter before a requesting thread is served.\n\nEdsger Dijkstra introduced Semaphores: integer variables manipulated exclusively through atomic operations wait() (P) and signal() (V)."""
            },
            {
                "heading": "3.3 Deadlocks and Coffman's Four Conditions",
                "subheading": "System Stagnation and Prevention",
                "text": """A deadlock is a condition where a set of threads are blocked because each holds a resource and waits for another resource held by another thread in the set.\n\nDeadlock can arise if and only if all four Coffman conditions hold simultaneously:\n1. Mutual Exclusion: At least one non-shareable resource.\n2. Hold and Wait: A thread holding at least one resource is waiting for additional resources.\n3. No Preemption: Resources cannot be forcibly seized; only voluntarily released.\n4. Circular Wait: A closed chain of threads exists where each waits for a resource held by the next.""",
                "key_takeaways": [
                    "Breaking any one of Coffman's four conditions guarantees deadlock prevention.",
                    "Mutex locks provide binary mutual exclusion; counting semaphores coordinate resource pools.",
                    "Priority inversion occurs when a lower-priority thread holds a lock required by a high-priority thread."
                ]
            }
        ]
    )

    # 7. Biology Chapter 1: Cellular Respiration
    service.generate_sample_pdf(
        filename="bio_cellular_respiration.pdf",
        title="Chapter 1: Cellular Respiration & ATP Synthesis",
        subject="Biology (Biochemistry)",
        content_sections=[
            {
                "heading": "1.1 Overview of Cellular Energy Harvest",
                "subheading": "Catabolic Oxidation of Glucose to ATP",
                "text": """Cellular respiration is the catabolic biochemical pathway by which living cells harvest chemical energy stored in glucose molecules to generate adenosine triphosphate (ATP), the universal energy currency of biological work.\n\nThe overall stoichiometric equation for aerobic cellular respiration is:\nC₆H₁₂O₆ + 6 O₂ ⟶ 6 CO₂ + 6 H₂O + ~30-32 ATP + Heat"""
            },
            {
                "heading": "1.2 The Four Sequential Stages",
                "subheading": "Glycolysis, Pyruvate Oxidation, Krebs Cycle, and Oxidative Phosphorylation",
                "text": """1. Glycolysis: Occurs in the cytoplasm. Splits 1 glucose (6C) into 2 pyruvates (3C), yielding a net gain of 2 ATP and 2 NADH without requiring oxygen.\n2. Pyruvate Oxidation: Pyruvate translocates into the mitochondrial matrix, converting to Acetyl-CoA and releasing CO₂ and NADH.\n3. Citric Acid (Krebs) Cycle: Acetyl-CoA combines with oxaloacetate (4C) to form citrate (6C). Through cyclical oxidation steps, it generates 6 NADH, 2 FADH₂, 2 ATP, and 4 CO₂ per glucose.\n4. Oxidative Phosphorylation: High-energy electrons donated by NADH and FADH₂ cascade through complexes I-IV in the inner mitochondrial membrane, driving protons (H+) into the intermembrane space."""
            },
            {
                "heading": "1.3 Chemiosmosis & ATP Synthase",
                "subheading": "The Proton Motive Force",
                "text": """Peter Mitchell's Chemiosmotic Hypothesis explains that the electrochemical proton gradient across the inner mitochondrial membrane (the proton motive force) drives the mechanical rotary motor of ATP Synthase, condensing ADP + Pi into ATP.""",
                "key_takeaways": [
                    "Glycolysis occurs anaerobically in the cytosol, yielding net 2 ATP and 2 NADH.",
                    "Krebs cycle completes the total oxidation of organic carbons to CO₂ in the mitochondrial matrix.",
                    "Oxygen serves as the terminal electron acceptor in the electron transport chain, forming H₂O.",
                    "Chemiosmosis harnesses the proton gradient to drive ATP synthase."
                ]
            }
        ]
    )

    # 8. Biology Chapter 2: Genetics
    service.generate_sample_pdf(
        filename="bio_genetics.pdf",
        title="Chapter 2: Molecular Genetics & DNA Replication",
        subject="Biology (Molecular Genetics)",
        content_sections=[
            {
                "heading": "2.1 The DNA Double Helix Architecture",
                "subheading": "Antiparallel Complementary Strands",
                "text": """James Watson and Francis Crick, utilizing Rosalind Franklin's Photo 51 X-ray diffraction data, elucidated the antiparallel double-helical structure of deoxyribonucleic acid (DNA). The sugar-phosphate backbones run in opposite directions (5' to 3' vs 3' to 5'), stabilized by interior hydrogen bonds between complementary nitrogenous bases: Adenine pairs with Thymine (2 H-bonds) and Guanine pairs with Cytosine (3 H-bonds)."""
            },
            {
                "heading": "2.2 Semiconservative Replication & The Replication Fork",
                "subheading": "Leading vs Lagging Strands and Okazaki Fragments",
                "text": """Meselson and Stahl demonstrated that DNA replication is semi-conservative: each newly synthesized DNA double-helix contains one intact template strand from the parent molecule and one newly synthesized strand.\n\nEnzymatic machinery:\n- Helicase unwinds the double helix at replication origins.\n- Topoisomerase relieves supercoiling tension ahead of the fork.\n- RNA Primase deposits short complementary RNA primers.\n- DNA Polymerase III synthesizes DNA strictly in the 5' to 3' direction.\nBecause the strands are antiparallel, the leading strand is synthesized continuously, whereas the lagging strand must be synthesized discontinuously in short segments called Okazaki fragments, subsequently joined by DNA Ligase.""",
                "key_takeaways": [
                    "DNA Polymerase can only extend strands in the 5' to 3' direction, requiring a pre-existing 3' -OH group.",
                    "Okazaki fragments on the lagging strand are sealed by phosphodiester bonds formed by DNA ligase.",
                    "Proofreading by 3' to 5' exonuclease activity ensures astronomical replication fidelity (< 1 error per 10⁹ bases)."
                ]
            }
        ]
    )

    # 9. Math Chapter 1: Calculus
    service.generate_sample_pdf(
        filename="math_calculus.pdf",
        title="Chapter 1: Differential Calculus & Optimization",
        subject="Mathematics (Calculus)",
        content_sections=[
            {
                "heading": "1.1 The Definition of the Derivative",
                "subheading": "Instantaneous Rate of Change as a Limit",
                "text": """Differential calculus studies rates of change and slopes of curves. The derivative of a function f(x) at point x represents the slope of the tangent line to the graph at that point, defined formally as the limit of the difference quotient as h approaches zero."""
            },
            {
                "formula_box": "Limit Definition of Derivative: f'(x) = lim_{h -> 0} [ f(x + h) - f(x) ] / h"
            },
            {
                "heading": "1.2 Essential Rules of Differentiation",
                "subheading": "Power, Product, Quotient, and Chain Rules",
                "text": """- Power Rule: d/dx [x^n] = n · x^(n-1)\n- Product Rule: d/dx [u(x) · v(x)] = u'(x) · v(x) + u(x) · v'(x)\n- Quotient Rule: d/dx [u(x) / v(x)] = [u'(x)v(x) - u(x)v'(x)] / [v(x)]²\n- Chain Rule for composite functions: d/dx [f(g(x))] = f'(g(x)) · g'(x)"""
            },
            {
                "heading": "1.3 Critical Points, Extrema, and Applied Optimization",
                "subheading": "First and Second Derivative Tests",
                "text": """A critical point occurs where f'(c) = 0 or f'(c) is undefined.\n- First Derivative Test: If f'(x) changes sign from positive to negative at c, f(c) is a local maximum; if negative to positive, a local minimum.\n- Second Derivative Test: If f'(c) = 0 and f''(c) > 0, the curve is concave up and f(c) is a local minimum. If f''(c) < 0, it is concave down and f(c) is a local maximum.\n\nIn applied optimization, we formulate an objective function subject to physical or economic constraints, express it in terms of a single variable, and find its global extremum on the feasible domain.""",
                "key_takeaways": [
                    "Derivative f'(x) indicates slope, instantaneous velocity, and direction of increase.",
                    "Second derivative f''(x) reveals concavity and inflection points.",
                    "Always check boundary endpoints in constrained optimization problems."
                ]
            }
        ]
    )

    # 10. Math Chapter 2: Linear Algebra
    service.generate_sample_pdf(
        filename="math_linear_algebra.pdf",
        title="Chapter 2: Linear Algebra: Vector Spaces & Transformations",
        subject="Mathematics (Linear Algebra)",
        content_sections=[
            {
                "heading": "2.1 Vector Spaces, Linear Combinations, and Span",
                "subheading": "Axiomatic Foundations",
                "text": """A vector space V over a field F is a set closed under vector addition and scalar multiplication satisfying the eight field axioms (associativity, commutativity, identity elements, and distributivity).\n\nA linear combination of vectors v1, v2, ..., vn is c1·v1 + c2·v2 + ... + cn·vn. The Span of a set of vectors is the collection of all possible linear combinations. If no vector in the set can be expressed as a linear combination of the remaining vectors, the set is Linearly Independent."""
            },
            {
                "heading": "2.2 Basis and Dimension",
                "subheading": "Minimal Spanning Coordinate Systems",
                "text": """A Basis for a vector space V is a linearly independent set of vectors that spans V. The Dimension dim(V) is the number of vectors in any basis for V (an invariant property of the space)."""
            },
            {
                "heading": "2.3 Linear Transformations, Determinants, and Eigenvalues",
                "subheading": "Geometry of Matrix Operators",
                "text": """A mapping T: V -> W is a Linear Transformation if T(u + v) = T(u) + T(v) and T(c·v) = c·T(v). Every linear map between finite-dimensional spaces can be represented as matrix multiplication T(x) = A·x.\n\nAn eigenvector v of an n x n matrix A is a non-zero vector that satisfies A·v = λ·v, where scalar λ is the associated eigenvalue. Eigenvalues are found by solving the characteristic polynomial equation det(A - λ·I) = 0.""",
                "key_takeaways": [
                    "Rank-Nullity Theorem: For an m x n matrix A, Rank(A) + Nullity(A) = n.",
                    "det(A) ≠ 0 if and only if matrix A is invertible.",
                    "Eigenvectors represent invariant directions that only undergo scalar scaling under transformation A."
                ]
            }
        ]
    )

    print("All sample academic chapter PDFs generated successfully!")

if __name__ == "__main__":
    build_all_pdfs()
