let tasks = [];

/* Add a single task from form inputs */
function addTask() {
    const titleRaw = document.getElementById("title").value.trim();
    const dueRaw = document.getElementById("due").value;
    const hoursRaw = document.getElementById("hours").value;
    const importanceRaw = document.getElementById("importance").value;
    const depsRaw = document.getElementById("deps").value;

    const t = {
        title: titleRaw,
        due_date: dueRaw || null,
        // use defaults ONLY when field is empty, not when it is 0
        estimated_hours: hoursRaw === "" ? 1 : parseFloat(hoursRaw),
        importance: importanceRaw === "" ? 5 : parseInt(importanceRaw, 10),
        dependencies: depsRaw
            .split(",")
            .map(s => s.trim())
            .filter(s => s)
    };

    if (!t.title) {
        showMessage("⚠️ Title is required to add a task.", "error");
        return;
    }

    tasks.push(t);
    showMessage(`✅ Task "${escapeHtml(t.title)}" added.`, "success");
}

/* Utility to show short messages in the output area */
function showMessage(message, type = "error") {
    const out = document.getElementById("output");
    out.innerHTML = `
        <div class="message ${type}">
            ${message}
        </div>
    `;
}

/* Set UI loading state */
function setLoading(isLoading, text = "Processing...") {
    const out = document.getElementById("output");
    if (isLoading) {
        out.innerHTML = `<div class="message info">${text}</div>`;
    }
    // when false, we don't touch DOM; display()/showMessage() will overwrite.
}

/* Shared helper to POST payload to an endpoint and return parsed JSON or throw */
async function postPayload(endpoint, payload) {
    let res;
    try {
        res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        throw {
            type: "network",
            message: "Could not reach the server. Is Django running on http://localhost:8000?",
            detail: err
        };
    }

    console.log("response:", res);
    const bodyText = await res.text();
    console.log("response body text:", bodyText);
    let json = null;

    // Try to parse JSON if possible
    if (bodyText) {
        try {
            json = JSON.parse(bodyText);
        } catch {
            // not JSON, keep json = null
        }
    }

    if (!res.ok) {
        // backend error format is usually {"error": "..."}
        throw {
            type: "http",
            status: res.status,
            body: json !== null ? json : bodyText
        };
    }

    // For successful responses, DRF will return JSON
    return json !== null ? json : bodyText;
}

/* Build payload either from tasks array or bulk json input */
function buildPayloadFromUI() {
    const bulk = document.getElementById("bulk").value;
    if (bulk && bulk.trim()) {
        try {
            const parsed = JSON.parse(bulk);
            if (!Array.isArray(parsed)) {
                showMessage("❌ Bulk JSON must be an array of tasks.", "error");
                return null;
            }
            return parsed;
        } catch (e) {
            showMessage("❌ Invalid JSON in bulk input. Please fix it and try again.", "error");
            console.error("JSON parse error:", e);
            return null;
        }
    }
    // fallback to in-memory tasks
    if (!tasks || tasks.length === 0) {
        showMessage("⚠️ No tasks to send. Add tasks or paste bulk JSON first.", "error");
        return null;
    }
    return tasks;
}

/* Analyze: sends payload to /analyze/ and shows full list (backend returns an array) */
async function analyze() {
    const payload = buildPayloadFromUI();
    if (!payload) return;

    setLoading(true, "Analyzing tasks...");
    try {
        const data = await postPayload("http://localhost:8000/api/tasks/analyze/", payload);

        if (!Array.isArray(data)) {
            // Backend *should* always return an array; if not, show raw.
            document.getElementById("output").innerHTML =
                `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
            return;
        }

        display(data);
    } catch (err) {
        console.error("Analyze error:", err);
        if (err.type === "network") {
            showMessage(`🚫 ${err.message}`, "error");
        } else if (err.type === "http") {
            const body = err.body || {};
            const text = typeof body === "object" ? JSON.stringify(body, null, 2) : String(body);
            showMessage(
                `<pre>❌ Server error (${err.status}): ${escapeHtml(text)}</pre>`,
                "error"
            );
        } else {
            showMessage("❌ Unexpected error during analysis. See console for details.", "error");
        }
    } finally {
        setLoading(false);
    }
}

/* Suggest: posts to /suggest/ and shows top 3 results (backend returns {suggestions: [...]}) */
async function suggest() {
    const payload = buildPayloadFromUI();
    if (!payload) return;

    setLoading(true, "Getting top suggestions...");
    try {
        const data = await postPayload("http://localhost:8000/api/tasks/suggest/", payload);

        if (!data || !Array.isArray(data.suggestions)) {
            document.getElementById("output").innerHTML =
                `<div class="message error">Unexpected response from server for suggestions.</div>
                 <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
            return;
        }

        const suggestions = data.suggestions;
        const out = document.getElementById("output");

        if (suggestions.length === 0) {
            out.innerHTML = `<div class="message info">No suggestions returned by server.</div>`;
            return;
        }

        const top = suggestions.slice(0, 3);
        out.innerHTML = `<h3>Top ${top.length} Suggested Tasks</h3>`;
        top.forEach(t => {
            out.innerHTML += `
                <div class="card">
                    <h3>${escapeHtml(t.title || "")} — Score: ${t.score ?? "N/A"}</h3>
                    <p>${escapeHtml(t.explanation || "")}</p>
                    <small>
                        Due: ${escapeHtml(t.due_date ?? "N/A")},
                        Hours: ${t.estimated_hours ?? "N/A"},
                        Importance: ${t.importance ?? "N/A"}
                    </small>
                </div>
            `;
        });

    } catch (err) {
        console.error("Suggest error:", err);
        if (err.type === "network") {
            showMessage(`🚫 ${err.message}`, "error");
        } else if (err.type === "http") {
            const body = err.body || {};
            const text = typeof body === "object" ? JSON.stringify(body, null, 2) : String(body);
            showMessage(
                `<pre>❌ Server error (${err.status}): ${escapeHtml(text)}</pre>`,
                "error"
            );
        } else {
            showMessage("❌ Unexpected error while getting suggestions. See console for details.", "error");
        }
    } finally {
        setLoading(false);
    }
}

/* Display function for analyze (expected array) */
function display(data) {
    const out = document.getElementById("output");
    out.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        out.innerHTML = `<div class="message info">No tasks returned from server.</div>`;
        return;
    }

    data.forEach(t => {
        out.innerHTML += `
            <div class="card">
                <h3>${escapeHtml(t.title || "")} — Score: ${t.score ?? "N/A"}</h3>
                <p>${escapeHtml(t.explanation || "")}</p>
                <small>
                    Due: ${escapeHtml(t.due_date ?? "N/A")},
                    Hours: ${t.estimated_hours ?? "N/A"},
                    Importance: ${t.importance ?? "N/A"}
                </small>
            </div>
        `;
    });
}

/* small helper to prevent accidental HTML injection in titles/explanations */
function escapeHtml(unsafe) {
    return String(unsafe)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
