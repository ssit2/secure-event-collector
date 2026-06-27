document.addEventListener('DOMContentLoaded', () => {

    // ── Global Scope Variables ───────────────────────
    const apiStatusDot = document.getElementById('api-status-dot');
    const apiStatusText = document.getElementById('api-status-text');
    const createEventForm = document.getElementById('create-event-form');
    const responseAlert = document.getElementById('response-alert');

    // ── Global Readiness Check ───────────────────────
    if (apiStatusDot && apiStatusText) {
        fetch('/health/ready')
            .then(res => {
                if (res.ok) {
                    apiStatusDot.className = 'status-indicator bg-success me-2';
                    apiStatusText.textContent = 'Online';
                } else {
                    throw new Error();
                }
            })
            .catch(() => {
                apiStatusDot.className = 'status-indicator bg-danger me-2';
                apiStatusText.textContent = 'Offline';
            });
    }

    // ── Create Event Form Handler ────────────────────
    if (createEventForm) {
        const btnSubmit = document.getElementById('btn-submit');
        const btnReset = document.getElementById('btn-reset');

        btnReset.addEventListener('click', () => {
            responseAlert.classList.add('d-none');
        });

        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const eventName = document.getElementById('eventName').value;
            const eventType = document.getElementById('eventType').value;
            const severity = document.getElementById('severity').value;
            const source = document.getElementById('source').value;
            const description = document.getElementById('description').value;

            // Preserve exactly the backend payload structure
            const payload = {
                eventType: eventType,
                severity: severity,
                source: source,
                payload: {
                    name: eventName,
                    description: description
                }
            };

            // UI State change
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...';
            responseAlert.classList.add('d-none');

            try {
                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                
                responseAlert.classList.remove('d-none');

                if (response.ok || response.status === 201) {
                    responseAlert.className = 'alert shadow-sm rounded-3 d-flex align-items-start alert-success-subtle border';
                    document.getElementById('response-icon').className = 'bi bi-check-circle-fill fs-4 me-3 mt-1 text-success';
                    document.getElementById('response-title').textContent = 'Event Sent Successfully';
                    document.getElementById('response-message').textContent = 'Your event has been ingested and published to the pipeline.';

                    // Populate response data
                    document.getElementById('resp-event-id').textContent = data.eventId || 'N/A';
                    document.getElementById('resp-correlation-id').textContent = response.headers.get('X-Correlation-ID') || 'N/A';
                    document.getElementById('resp-timestamp').textContent = data.timestamp || new Date().toISOString();

                    createEventForm.reset();
                    document.getElementById('severity').className = "form-select form-select-lg bg-light"; // reset severity color
                } else {
                    throw new Error(data.title || 'Validation Error');
                }
            } catch (err) {
                responseAlert.classList.remove('d-none');
                responseAlert.className = 'alert shadow-sm rounded-3 d-flex align-items-start alert-danger-subtle border';
                document.getElementById('response-icon').className = 'bi bi-x-circle-fill fs-4 me-3 mt-1 text-danger';
                document.getElementById('response-title').textContent = 'Request Failed';
                document.getElementById('response-message').textContent = err.message || 'Unable to connect to the API.';
                
                // Clear response data
                document.getElementById('resp-event-id').textContent = '-';
                document.getElementById('resp-correlation-id').textContent = '-';
                document.getElementById('resp-timestamp').textContent = '-';
            } finally {
                // Restore button state
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="bi bi-send me-2"></i> Send Event';
            }
        });
    }

});
