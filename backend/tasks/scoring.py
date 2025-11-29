from datetime import date
from typing import List,Dict,Tuple

def detect_cycle(tasks: List[Dict])->bool:
    """
    detects cycles in dependency graph where tasks reference other task titles
    returns True if cycle found
    """
    
    graph={t["title"]:t.get("dependencies",[]) for t in tasks}
    visited=set()
    stack=set()

    def dfs(node):
        if node in stack:
            return True
        if node in visited:
            return False
        visited.add(node)
        stack.add(node)
        for dep in graph.get(node,[]):
            if dep not in graph:
                continue
            if dfs(dep):
                return True
        stack.remove(node)
        return False

    for node in graph:
        if dfs(node):
            return True
    return False

def calculate_score(task:Dict, tasks:List[Dict])->Tuple[float,str]:
    """
    Compute final priority score:
      - urgency (0..10) based on days until due (overdue => 10)
      - importance (1..10) as provided
      - effort score (0..10) inverse of estimated_hours (quick wins higher)
      - dependency score: tasks that block more tasks are higher
    Weighted sum:
      urgency * 0.35 + importance * 0.35 + effort_score * 0.20 + dependency_score * 0.10
    """
    today=date.today()
    #Normalize the due_date: if string -> parse; if missing -> None
    due=task.get("due_date")
    if isinstance(due,str) and due:
        try:
            y,m,d=map(int,due.split("-"))
            from datetime import date as _date
            due = _date(y,m,d)
        except Exception:
            due=None

    #Urgency
    if due:
        days_left=(due-today).days
        urgency=10 if days_left<0 else max(0,10-days_left)
    else:
        urgency=0

    #Importance
    importance=task.get("importance",5)
    if not isinstance(importance,(int,float)):
        importance=5
    importance=max(1,min(10,int(importance)))

    #Effort (quick wins higher)
    hours=task.get("estimated_hours") or 1
    try:
        hours=float(hours)
    except Exception:
        hours=1.0
    effort_score=max(0.0,10.0-hours)

    #Dependency (how many tasks depend on this one)
    blocking = sum(1 for t in tasks if task["title"] in t.get("dependencies",[]))
    dependency_score=blocking*3 # scale factor so blocking 1 task gives +3

    final=(urgency*0.35)+(importance*0.35)+(effort_score*0.20)+(dependency_score*0.10)
    explanation=f"urgency={urgency}, Importance={importance}, Effort={effort_score}, Blocks={blocking}"

    return round(final,2),explanation

                   
