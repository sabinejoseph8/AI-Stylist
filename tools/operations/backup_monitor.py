"""Inactive status-only Healthchecks adapter. No credentials, scheduler or CLI.

The runner must report success only after its complete recovery point is verified.
An accepted ping does not prove email delivery or backup recoverability.
"""
import re
import urllib.request


class MonitoringHeld(RuntimeError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise MonitoringHeld('monitor-redirect-refused')


def request(url):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    req = urllib.request.Request(url, data=b'', method='POST',
                                 headers={'Content-Type': 'application/octet-stream'})
    with opener.open(req, timeout=10) as response:
        return response.status, response.read(33)


def report(ping_url, status, *, complete_recovery_point_verified=False, call=request):
    """One bounded request, no retries, logs, query values or run identifiers."""
    if (not isinstance(ping_url, str) or not re.fullmatch(
            r'https://hc-ping\.com/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            ping_url)):
        raise MonitoringHeld('monitor-destination-held')
    if status not in ('start', 'success', 'failure'):
        raise MonitoringHeld('monitor-status-held')
    if status == 'success' and complete_recovery_point_verified is not True:
        raise MonitoringHeld('monitor-success-proof-held')
    suffix = {'start': '/start', 'success': '', 'failure': '/fail'}[status]
    try:
        code, body = call(ping_url + suffix)
        if code != 200 or body != b'OK':
            raise MonitoringHeld('monitor-acknowledgment-held')
    except Exception:
        # Provider errors may contain the private URL. Never expose them.
        raise MonitoringHeld('monitor-unavailable-or-refused') from None
    return {'signal_accepted': True, 'status': status, 'email_delivery_verified': False,
            'schedule_active': False}
