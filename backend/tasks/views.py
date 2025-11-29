from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .scoring import calculate_score, detect_cycle

def process_tasks_payload(tasks):
    """
    Validate, detect cycles, score and sort tasks.
    Returns tuple (error_response, results_list)
      - error_response: None or a DRF Response ready to return
      - results_list: list of tasks with 'score' and 'explanation'
    """
    if not isinstance(tasks, list):
        return Response({"error": "Expected a list of tasks (JSON array)."}, status=status.HTTP_400_BAD_REQUEST), None

    # Basic validation
    for t in tasks:
        if "title" not in t or not t.get("title"):
            return Response({"error": "Each task must have a non-empty title."}, status=status.HTTP_400_BAD_REQUEST), None

    # detect circular dependency
    if detect_cycle(tasks):
        return Response({"error": "Circular dependency detected."}, status=status.HTTP_400_BAD_REQUEST), None

    results = []
    for t in tasks:
        score, explanation = calculate_score(t, tasks)
        # Do not mutate original? We'll return enriched copies
        enriched = dict(t)
        enriched["score"] = score
        enriched["explanation"] = explanation
        results.append(enriched)

    # sort descending by score
    results.sort(key=lambda x: x["score"], reverse=True)
    return None, results


class AnalyzeTasks(APIView):
    """
    POST /api/tasks/analyze/
    Accepts a JSON array of tasks and returns them sorted by priority score
    """
    def post(self, request):
        tasks = request.data
        error_resp, results = process_tasks_payload(tasks)
        if error_resp:
            return error_resp
        return Response(results)


class SuggestTasks(APIView):
    """
    POST /api/tasks/suggest/
    Accepts a JSON array of tasks (same format as /analyze/) and returns top 3 suggestions
    (with explanation why each was chosen).
    """
    def post(self, request):
        tasks = request.data
        error_resp, results = process_tasks_payload(tasks)
        if error_resp:
            return error_resp

        # top 3 (or fewer if less tasks)
        top3 = results[:3]
        # Add a short explanation string for each (already have 'explanation').
        # If you want more human readable reason, you can expand here.
        return Response({"suggestions": top3})
