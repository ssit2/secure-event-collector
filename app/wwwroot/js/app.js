(function () {
    'use strict';

    // DOM references
    var form = document.getElementById('event-form');
    var btnSendEvent = document.getElementById('btn-send-event');
    var btnHealth = document.getElementById('btn-health');
    var btnSwagger = document.getElementById('btn-swagger');
    var banner = document.getElementById('response-banner');
    var bannerText = document.getElementById('response-text');
    var responseCard = document.getElementById('response-card');
    var responseJson = document.getElementById('response-json');
    var apiStatusDot = document.getElementById('api-status-dot');
    var apiStatusText = document.getElementById('api-status-text');
    var readyStatusDot = document.getElementById('ready-status-dot');
    var readyStatusText = document.getElementById('ready-status-text');

    // ── Helpers ──────────────────────────────────────

    function showBanner(message, isSuccess) {
        banner.className = 'response-banner ' + (isSuccess ? 'success' : 'error');
        bannerText.textContent = (isSuccess ? '✅ ' : '❌ ') + message;
    }

    function showResponseJson(data) {
        responseCard.classList.remove('hidden');
        responseJson.textContent = JSON.stringify(data, null, 2);
    }

    function hideResponseJson() {
        responseCard.classList.add('hidden');
        responseJson.textContent = '';
    }

    // ── Initial Status Check ─────────────────────────

    function checkReadiness() {
        fetch('/health/ready')
            .then(function (res) {
                if (res.ok) {
                    apiStatusDot.className = 'status-dot green';
                    apiStatusText.textContent = 'Online';
                    readyStatusDot.className = 'status-dot green';
                    readyStatusText.textContent = 'Ready';
                } else {
                    throw new Error('Not ready');
                }
            })
            .catch(function () {
                apiStatusDot.className = 'status-dot red';
                apiStatusText.textContent = 'Unavailable';
                readyStatusDot.className = 'status-dot red';
                readyStatusText.textContent = 'Unavailable';
            });
    }

    checkReadiness();

    // ── Send Test Event (button in action row) ───────

    btnSendEvent.addEventListener('click', function () {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ── Health Check Button ──────────────────────────

    btnHealth.addEventListener('click', function () {
        hideResponseJson();
        fetch('/health/ready')
            .then(function (res) {
                if (!res.ok) throw new Error('Unavailable');
                return res.json();
            })
            .then(function (data) {
                showBanner('API is Healthy', true);
                showResponseJson(data);
                apiStatusDot.className = 'status-dot green';
                apiStatusText.textContent = 'Online';
                readyStatusDot.className = 'status-dot green';
                readyStatusText.textContent = 'Ready';
            })
            .catch(function () {
                showBanner('API is Unavailable', false);
                apiStatusDot.className = 'status-dot red';
                apiStatusText.textContent = 'Unavailable';
                readyStatusDot.className = 'status-dot red';
                readyStatusText.textContent = 'Unavailable';
            });
    });

    // ── Swagger Button ───────────────────────────────

    btnSwagger.addEventListener('click', function () {
        window.open('/swagger', '_blank');
    });

    // ── Form Submit ──────────────────────────────────

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideResponseJson();

        var eventType = document.getElementById('eventType').value;
        var source = document.getElementById('source').value;
        var severity = document.getElementById('severity').value;
        var description = document.getElementById('description').value;

        var payload = {
            eventType: eventType,
            severity: severity,
            source: source,
            payload: {
                description: description
            }
        };

        fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (res) {
            if (res.ok || res.status === 201) {
                return res.json().then(function (data) {
                    showBanner('Event Sent Successfully', true);
                    showResponseJson(data);
                    form.reset();
                });
            }
            return res.json().then(function (data) {
                showBanner('Request Failed — ' + (data.title || 'Validation Error'), false);
                showResponseJson(data);
            });
        })
        .catch(function (err) {
            showBanner('Request Failed — ' + err.message, false);
        });
    });

})();
