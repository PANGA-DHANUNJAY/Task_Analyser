# 📌 Smart Task Analyzer

A mini-application that analyzes tasks and intelligently prioritizes them based on urgency, importance, effort, and dependencies.

This project contains:

- **Django REST backend** for scoring and sorting tasks  
- **HTML/CSS/JavaScript frontend** for adding, analyzing, and viewing tasks  
- **Reusable scoring algorithm**  
- **Cycle dependency detection**  
- **Unit tests for algorithm correctness**  
- **“Suggest Top 3 Tasks” API**  

---

## 🚀 Project Structure

**Root:** `task-analyzer/`

### Backend

**Files:**

- `manage.py`
- `task_analyzer/`
  - `settings.py`
  - `urls.py`
  - `wsgi.py`
- `tasks/`
  - `models.py`
  - `serializers.py`
  - `scoring.py`
  - `views.py`
  - `urls.py`
  - `tests.py`
- `requirements.txt`

### Frontend

**Files:**

- `index.html`  
- `styles.css`  
- `script.js`  

---

## 🛠️ Setup Instructions

### 1️⃣ Backend Setup (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

**URL:**

```text
http://localhost:8000
```

### API Endpoints

#### Analyze

- **Method:** `POST`  
- **Endpoint:** `/api/tasks/analyze/`  
- **Description:** Returns all tasks sorted by priority score.

#### Suggest

- **Method:** `POST`  
- **Endpoint:** `/api/tasks/suggest/`  
- **Description:** Returns top 3 tasks based on priority score.

---

## 🎨 Frontend

**How to run:**

- Open `frontend/index.html` directly in the browser.  
- (Optional) Use **VS Code Live Server**.

**Features:**

- Add tasks manually  
- Provide bulk JSON input  
- Analyze tasks  
- Suggest top 3 tasks  

---

## 🧠 Algorithm

### Title

**Algorithm Explanation**

### Overview

Converts subjective properties of tasks into quantitative priority scores using urgency, importance, effort, and dependency relationships.

### Components

#### 🔹 Urgency

Measures how close a task is to its due date:

- Overdue → `urgency = 10`  
- No due date → `urgency = 0`  
- Closer deadlines → higher urgency  

#### 🔹 Importance

- User-provided (1–10).  
- Higher importance strongly influences the final score.

#### 🔹 Effort Score

Calculated as:

```text
effort_score = max(0, 10 - estimated_hours)
```

- Smaller tasks (low effort) get higher scores.

#### 🔹 Dependency Score

- Increases when many tasks depend on this task.  
- Encourages completing blocking tasks early.

### Final Formula

```text
final_score =
    urgency * 0.35 +
    importance * 0.35 +
    effort_score * 0.20 +
    dependency_score * 0.10
```

### Cycle Detection

- Uses **Depth-First Search (DFS)** to detect circular dependencies.  
- Returns an error if loops like `A → B → A` exist.

### Outcome

Produces balanced, explainable priority scores.  
Each task receives:

- A numeric priority score  
- A human-readable explanation  

---

## 🧩 Design Decisions

- Reused scoring logic for both `/analyze/` and `/suggest/`  
- Implemented DFS cycle detection  
- Prioritized urgency & importance for realistic behavior  
- Supported both manual and bulk inputs in frontend  
- Added explanation text per task  
- Enabled safe HTML escaping in frontend  
- Provided clear, helpful error messages  

---

## 🧪 Tests

### Included

- Circular dependency detection  
- Overdue urgency scoring  
- Score computation & sorting  
- Suggest API returning top-3 tasks  

### Run Command

```bash
python manage.py test
```

---

## 🌟 Bonus Features
 
- Better frontend error handling  
- Reusable backend task processor  
- Auto-generated scoring explanation   

---

## 🔮 Future Improvements

- Multiple scoring strategies (Fastest Wins, High Impact, Deadline-driven, Balanced)  
- Database storage for task history  
- Visual dependency graph  
- Eisenhower Matrix view  
- User-adjustable weighting factors  
- Dark mode UI  
