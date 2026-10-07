# TraceFlow — Offline Intelligent Java Program Analysis & Visualization Platform

**TraceFlow** is a 100% offline, full-stack intelligent Java program analysis and execution visualization platform. It helps students, educators, and beginner developers understand how Java source code compiles, structures its control flow, executes step-by-step at runtime, and surfaces potential logic bugs using local machine learning.

---

## 🚀 Key Highlights & Architecture

- **100% Offline Operation**: Zero external API dependencies, zero cloud AI calls, zero Python bridge. Runs completely locally on your machine.
- **JavaParser AST & CFG Engine**: Generates Abstract Syntax Trees, calculates cyclomatic complexity, discovers recursion, flags common anti-patterns, and builds visual Control Flow Graphs.
- **JDI Dynamic Execution Tracer**: Leverages the Java Debug Interface (`com.sun.jdi.CommandLineLaunch`) to single-step execution, observe method entry/exits, inspect live local variables, compute mutation diffs, and enforce runtime loop safeguards.
- **Weka J48 Decision Tree Classifier**: Trains locally on 10 extracted behavioral features (loop counts, mutation frequency, recursion depth, exception events, null accesses) to categorize execution into 5 classes with confidence ratings.
- **Interactive React Studio**:
  - **CodeViewer**: Line-stepping editor with breakpoint indicators and syntax highlighting.
  - **FlowGraph**: Interactive visual SVG flowchart with zoom/pan and glowing active node synchronization.
  - **VariablePanel**: Live variable state inspection and mutation history sparkline.
  - **TraceTimeline**: Scrubber player with play/pause, step forward/back, and speed controls.
  - **BugPredictionCard**: Machine learning classification, confidence meter, and plain-language beginner explanations.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Java 17+, Spring Boot 3.3.5, Spring Security, Spring Data JPA |
| **Parsing & AST** | JavaParser 3.26.2 (`javaparser-core`, `javaparser-symbol-solver-core`) |
| **Execution Tracer** | Java Debug Interface (`com.sun.jdi`) |
| **Machine Learning** | Weka 3.8.6 (J48 Decision Tree, 10-fold cross validation) |
| **Persistence** | MySQL / H2 In-Memory DB (with auto-fallback & DDL generation) |
| **Authentication** | BCrypt password hashing + JJWT 0.12.6 Token Engine |

---

## 📦 Project Structure

```
TraceFlow/
├── pom.xml                               # Root Maven Project Configuration
├── mvnw.cmd                              # Maven Wrapper
├── models/                               # Local Serialized ML Models
│   ├── bug_classifier.model              # Serialized Weka J48 Decision Tree
│   └── bug_dataset.arff                  # Training Dataset
├── src/main/java/com/traceflow/
│   ├── TraceFlowApplication.java         # Spring Boot Entrypoint
│   ├── model/                            # JPA Entities (User, Project, Analysis, TraceEvent, etc.)
│   ├── repository/                       # Spring Data JPA Repositories
│   ├── parser/                           # JavaParser AST, CFG & Static Issue Analyzers
│   │   ├── JavaSourceParser.java
│   │   ├── AstAnalyzer.java
│   │   ├── ControlFlowAnalyzer.java
│   │   └── StaticIssueDetector.java
│   ├── service/                          # Core Engine Services
│   │   ├── AuthService.java
│   │   ├── ProjectService.java
│   │   ├── CompilationService.java       # Local javac Compiler Service
│   │   ├── DebugService.java             # JDI Runtime Tracing Engine
│   │   ├── TraceService.java             # Step Diffing & Timeline Service
│   │   ├── FeatureExtractionService.java # 10 ML Runtime Features Extractor
│   │   ├── MlService.java                # Weka J48 Training & Prediction
│   │   ├── ExplanationService.java       # Plain-Language Explanation Generator
│   │   └── AnalysisService.java          # Pipeline Orchestration Service
│   ├── source/controller/                # REST Controllers (Auth, File, Analysis, Trace)
│   └── util/                             # Security, JWT, Process, & File Utilities
└── frontend/                             # React 18 + Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── context/AuthContext.jsx
    │   ├── services/api.js
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── CodeViewer.jsx
    │   │   ├── FlowGraph.jsx
    │   │   ├── VariablePanel.jsx
    │   │   ├── TraceTimeline.jsx
    │   │   └── BugPredictionCard.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Dashboard.jsx
    │       ├── Upload.jsx
    │       └── AnalysisResult.jsx
```

---

## ⚡ Quick Start & Running Locally

### 1. Start the Backend Server
From the project root:
```powershell
# Run with in-memory H2 database (or omit profile for MySQL default)
java -Dspring.profiles.active=h2 -jar target/traceflow-backend-1.0.0.jar
```
*Backend runs on `http://localhost:8080` and also serves the bundled React single-page application.*

### 2. Start the Frontend Dev Server (Optional for development)
```powershell
cd frontend
npm install
npm run dev
```
*Frontend dev server runs on `http://localhost:5173` with automatic `/api` proxying to port 8080.*

---

## 🔑 Default Offline Credentials

TraceFlow initializes a local offline demo user on startup:
- **Username**: `demo`
- **Password**: `password123`

*(You can also register any new local offline account on the `/register` page).*

---

## 🧪 Curated Bug Presets

The **Upload** page (`/upload`) comes preloaded with 5 curated Java programs demonstrating each supported behavioral category:

1. **BubbleSort.java (`NORMAL`)**: Standard sorting algorithm. Demonstrates nested loops, conditional swapping, variable mutations, and clean termination.
2. **InfiniteLoopBug.java (`INFINITE_LOOP`)**: Loop missing variable increment. Hit loop safeguard at 500 steps, flagged with static warning and high iteration count.
3. **ArrayOffByOne.java (`OFF_BY_ONE`)**: Loop condition `i <= array.length`. Triggers `ArrayIndexOutOfBoundsException` on the boundary index.
4. **NullPointerBug.java (`NULL_POINTER`)**: Object dereference on an uninitialized null reference. Triggers `NullPointerException`.
5. **UnboundedRecursion.java (`RECURSION_RISK`)**: Recursive countdown without a terminating base case. Tracing flags high stack frame depth.

---

## 📡 REST API Reference

- `POST /api/auth/register` — Register a new local account.
- `POST /api/auth/login` — Login and receive JWT access token.
- `POST /api/projects/upload` — Upload a `.java` file.
- `POST /api/projects/create` — Create project with raw Java source code.
- `GET /api/projects/user/{userId}` — Retrieve user's saved Java files.
- `POST /api/analysis/{projectId}/start` — Run the complete analysis pipeline.
- `GET /api/analysis/{analysisId}` — Retrieve AST findings, CFG flowchart, compiler output, trace steps, and ML predictions.
- `GET /api/trace/{analysisId}/variables` — Retrieve variable mutation timelines across all recorded steps.

---

## 📜 License
MIT License. Built for offline Java education and code visualization.
