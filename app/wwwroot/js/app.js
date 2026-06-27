/* ═══════════════════════════════════════════════════════
   Secure Event Collector — Application JavaScript
   Pure vanilla JS. Connects the frontend to the ASP.NET Core API.
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ── Global Dashboard/API State Check ───────────────
    var apiDot  = document.getElementById('api-dot');
    var apiText = document.getElementById('api-text');

    if (apiDot && apiText) {
        fetch('/health/ready')
            .then(function (res) {
                if (!res.ok) throw new Error();
                apiDot.className = 'status-dot bg-success pulse';
                apiText.textContent = 'Online';
            })
            .catch(function () {
                apiDot.className = 'status-dot bg-danger';
                apiText.textContent = 'Offline';
            });
    }

    // ── Live JSON Preview & Form Dynamic Synchronization ──
    var form = document.getElementById('event-form');
    var jsonPreviewEl = document.getElementById('json-preview-area');

    function updateJsonPreview() {
        if (!jsonPreviewEl) return;
        var eventName   = document.getElementById('eventName').value || 'Failed Login Attempt';
        var eventType   = document.getElementById('eventType').value || 'Authentication';
        var severity    = document.getElementById('severity').value || 'Low';
        var source      = document.getElementById('source').value || '192.168.1.50';
        var description = document.getElementById('description').value || 'Suspicious login activity';

        var tempPayload = {
            eventType: eventType,
            severity: severity,
            source: source,
            payload: {
                name: eventName,
                description: description
            }
        };
        jsonPreviewEl.textContent = JSON.stringify(tempPayload, null, 2);
    }

    if (form) {
        // Listen to inputs for real-time JSON preview
        ['eventName', 'eventType', 'severity', 'source', 'description'].forEach(function(id) {
            var input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updateJsonPreview);
                input.addEventListener('change', updateJsonPreview);
            }
        });
        updateJsonPreview(); // Initial load preview
    }

    // ── Pre-populating Attack Simulators ─────────────────
    window.selectSimulator = function(type, severity, ip, name, desc) {
        var eventNameField = document.getElementById('eventName');
        var eventTypeField = document.getElementById('eventType');
        var severityField = document.getElementById('severity');
        var sourceField = document.getElementById('source');
        var descriptionField = document.getElementById('description');

        if (eventNameField) eventNameField.value = name;
        if (eventTypeField) eventTypeField.value = type;
        if (severityField) severityField.value = severity;
        if (sourceField) sourceField.value = ip;
        if (descriptionField) descriptionField.value = desc;

        updateJsonPreview();
    };

    // ── Form Submission to ASP.NET Core Backend ──────────
    if (form) {
        var btnSubmit  = document.getElementById('btn-submit');
        var btnReset   = document.getElementById('btn-reset');
        var banner     = document.getElementById('response-banner');
        var bannerIcon = document.getElementById('banner-icon');
        var bannerTitle   = document.getElementById('banner-title');
        var bannerMessage = document.getElementById('banner-message');
        var bannerDetails = document.getElementById('banner-details');

        btnReset.addEventListener('click', function () {
            banner.classList.add('d-none');
            setTimeout(updateJsonPreview, 50);
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            banner.classList.add('d-none');

            var eventName   = document.getElementById('eventName').value.trim();
            var eventType   = document.getElementById('eventType').value;
            var severity    = document.getElementById('severity').value;
            var source      = document.getElementById('source').value.trim();
            var description = document.getElementById('description').value.trim();

            var body = {
                eventType: eventType,
                severity:  severity,
                source:    source,
                payload: {
                    name:        eventName,
                    description: description
                }
            };

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending…';

            fetch('/api/events', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body)
            })
            .then(function (res) {
                var correlationId = res.headers.get('X-Correlation-ID') || '—';
                return res.json().then(function (data) {
                    return { ok: res.ok || res.status === 201, data: data, correlationId: correlationId };
                });
            })
            .then(function (result) {
                banner.classList.remove('d-none');

                if (result.ok) {
                    banner.className   = 'alert alert-event-success rounded-3 shadow-sm mb-4';
                    bannerIcon.className  = 'bi bi-check-circle-fill fs-4 mt-1 text-success';
                    bannerTitle.textContent   = 'Event Sent Successfully';
                    bannerMessage.textContent = 'The event has been ingested and published to the pipeline.';
                    bannerDetails.classList.remove('d-none');

                    document.getElementById('res-event-id').textContent      = result.data.eventId  || '—';
                    document.getElementById('res-correlation-id').textContent = result.correlationId;
                    document.getElementById('res-timestamp').textContent      = result.data.timestamp || new Date().toISOString();

                    // ── In-Memory Session Storage Event Ingestion (For Simulation Dashboard) ──
                    var sessionEvents = JSON.parse(sessionStorage.getItem('ingested_events') || '[]');
                    sessionEvents.unshift({
                        eventId: result.data.eventId || 'N/A',
                        eventType: eventType,
                        severity: severity,
                        source: source,
                        timestamp: result.data.timestamp || new Date().toISOString()
                    });
                    sessionStorage.setItem('ingested_events', JSON.stringify(sessionEvents));

                    form.reset();
                    updateJsonPreview();
                } else {
                    throw new Error(result.data.title || 'Validation Error');
                }
            })
            .catch(function (err) {
                banner.classList.remove('d-none');
                banner.className   = 'alert alert-event-error rounded-3 shadow-sm mb-4';
                bannerIcon.className  = 'bi bi-x-circle-fill fs-4 mt-1 text-danger';
                bannerTitle.textContent   = 'Request Failed';
                bannerMessage.textContent = err.message || 'Unable to connect to the API.';
                bannerDetails.classList.add('d-none');
            })
            .finally(function () {
                btnSubmit.disabled  = false;
                btnSubmit.innerHTML = '<i class="bi bi-send-fill me-2"></i>Send Event';
            });
        });
    }

    // ── Live Stream Viewer Page Renderer ──────────────────
    var eventsTableBody = document.getElementById('events-table-body');
    var emptyStateRow = document.getElementById('empty-state-row');

    if (eventsTableBody) {
        var loadSessionEvents = function() {
            var sessionEvents = JSON.parse(sessionStorage.getItem('ingested_events') || '[]');
            if (sessionEvents.length === 0) {
                if (emptyStateRow) emptyStateRow.classList.remove('d-none');
            } else {
                if (emptyStateRow) emptyStateRow.classList.add('d-none');
                eventsTableBody.innerHTML = '';
                sessionEvents.forEach(function(ev) {
                    var tr = document.createElement('tr');
                    
                    var badgeClass = 'bg-secondary';
                    if (ev.severity === 'Low') badgeClass = 'bg-success-subtle text-success border border-success';
                    if (ev.severity === 'Medium') badgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning';
                    if (ev.severity === 'High') badgeClass = 'bg-danger-subtle text-danger border border-danger';
                    if (ev.severity === 'Critical') badgeClass = 'bg-dark text-white';

                    var timeFormatted = new Date(ev.timestamp).toLocaleString();

                    tr.innerHTML = '<td>' + timeFormatted + '</td>' +
                                   '<td><span class="badge rounded-pill ' + badgeClass + '">' + ev.severity + '</span></td>' +
                                   '<td><span class="fw-semibold">' + ev.eventType + '</span></td>' +
                                   '<td><code class="text-dark">' + ev.source + '</code></td>' +
                                   '<td><code class="small text-secondary">' + ev.eventId + '</code></td>';
                    eventsTableBody.appendChild(tr);
                });
            }
        };

        loadSessionEvents();

        // Implement a clear stats option for easier testing
        var clearBtn = document.getElementById('btn-clear-events');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                sessionStorage.removeItem('ingested_events');
                loadSessionEvents();
            });
        }
    }
});
