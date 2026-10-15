"""Local synthetic child processes only; no Docker, network or credential."""
import subprocess
import sys
import unittest
from bounded_client import capture,ClientHeld

class BoundedClientTests(unittest.TestCase):
    def test_bounded_input_output(self):
        self.assertEqual(capture([sys.executable,'-c','import sys;sys.stdout.buffer.write(sys.stdin.buffer.read())'],b'fixture',limit=100),b'fixture')
    def test_oversize_and_raw_errors_refused(self):
        for script in ["import sys;sys.stdout.write('x'*1000)","import sys;sys.stderr.write('private fixture');sys.exit(1)"]:
            with self.assertRaisesRegex(ClientHeld,'^client-failed-or-limit-held$'):capture([sys.executable,'-c',script],b'',limit=100)
    def test_timeout_stops_child(self):
        with self.assertRaises(ClientHeld):capture([sys.executable,'-c','import time;time.sleep(2)'],b'',limit=100,timeout=.05)
