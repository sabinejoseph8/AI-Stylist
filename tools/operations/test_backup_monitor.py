import unittest
from unittest.mock import patch
import backup_monitor as m

URL = 'https://hc-ping.com/00000000-0000-0000-0000-000000000000'


class MonitorTests(unittest.TestCase):
    def test_fixed_statuses_and_no_delivery_claim(self):
        for status, suffix in [('start', '/start'), ('failure', '/fail'), ('success', '')]:
            calls = []
            def call(url):
                calls.append(url)
                return 200, b'OK'
            result = m.report(URL, status, complete_recovery_point_verified=True, call=call)
            self.assertEqual(calls, [URL + suffix])
            self.assertFalse(result['email_delivery_verified'])
            self.assertFalse(result['schedule_active'])

    def test_unverified_success_never_calls(self):
        for proof in [False, None, 1, 'true']:
            with self.assertRaises(m.MonitoringHeld):
                m.report(URL, 'success', complete_recovery_point_verified=proof,
                         call=lambda _: self.fail('request made'))

    def test_bad_destinations_and_statuses_never_call(self):
        for url in [URL+'?x=secret', URL+'/start', URL+'/', URL.replace('https:', 'http:'),
                    URL.replace('hc-ping.com', 'hc-ping.com.evil.test'), None]:
            with self.assertRaises(m.MonitoringHeld):
                m.report(url, 'start', call=lambda _: self.fail('request made'))
        with self.assertRaises(m.MonitoringHeld):
            m.report(URL, 'log', call=lambda _: self.fail('request made'))

    def test_unknown_or_rate_limited_ack_is_not_success(self):
        for code, body in [(200, b'OK (not found)'), (200, b'OK (rate limited)'),
                           (302, b'OK'), (500, b'OK'), (200, b'private content')]:
            with self.assertRaises(m.MonitoringHeld):
                m.report(URL, 'start', call=lambda _: (code, body))

    def test_private_errors_redacted_without_retry(self):
        calls = []
        def call(url):
            calls.append(url)
            raise OSError('secret '+url)
        with self.assertRaises(m.MonitoringHeld) as result:
            m.report(URL, 'failure', call=call)
        self.assertEqual(len(calls), 1)
        self.assertNotIn(URL, str(result.exception))
        self.assertIsNone(result.exception.__cause__)

    def test_transport_empty_body_bounded_read_and_no_redirect(self):
        class Response:
            status = 200
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, count):
                self.count = count
                return b'OK'
        response = Response()
        class Opener:
            def open(self, req, timeout):
                self.req, self.timeout = req, timeout
                return response
        opener = Opener()
        with patch.object(m.urllib.request, 'build_opener', return_value=opener) as build:
            self.assertEqual(m.request(URL), (200, b'OK'))
        self.assertEqual(opener.req.data, b'')
        self.assertEqual(opener.req.get_method(), 'POST')
        self.assertEqual(opener.timeout, 10)
        self.assertEqual(response.count, 33)
        self.assertEqual(build.call_args.args[0].proxies, {})
        with self.assertRaises(m.MonitoringHeld):
            m.NoRedirect().redirect_request(None, None, 302, '', {}, URL)
