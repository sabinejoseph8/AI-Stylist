"""Local-only Linux decoder limits rehearsal. No hosting or customer media.

Uses a cached, digest-pinned Node runtime and the application's locked production
packages. npm may fetch those packages during preparation; every test container
has no network, no credentials, a read-only root and bounded resources.
"""
from pathlib import Path
import json, shutil, subprocess, tempfile, time, uuid

APP = Path(__file__).resolve().parents[1]
IMAGE = 'public.ecr.aws/supabase/storage-api@sha256:1f6c99d3952d78d57129802aa2ae8a80d75e327492cf24742fd0aeaf90967b96'
MEMORY = 384 * 1024 * 1024


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True,
                          timeout=kw.pop('timeout', 30), **kw)


def check(condition, message):
    if not condition:
        raise RuntimeError(message)


with tempfile.TemporaryDirectory(prefix='stylist-image-resources-') as folder:
    work = Path(folder)
    work.chmod(0o755)
    for name in ['package.json', 'package-lock.json']:
        shutil.copyfile(APP / name, work / name)
    install = run(['npm', 'ci', '--ignore-scripts', '--omit=dev', '--audit=false',
                   '--fund=false', '--os=linux', '--cpu=arm64', '--libc=musl'],
                  cwd=work, timeout=180)
    check(install.returncode == 0, 'Locked Linux decoder dependency preparation failed')
    for name in ['sanitize-image.ts', 'image-decoder-worker.mjs']:
        shutil.copyfile(APP / 'src/server' / name, work / name)
    shutil.copyfile(APP / 'tests/fixtures/image-worker-hang.mjs', work / 'hang.mjs')
    shutil.copyfile(APP / 'scripts/image-resource-fixture.mjs', work / 'check.mjs')
    for mode in ['limits', 'normal', 'invalid', 'hang', 'cpu', 'oom']:
        name = 'stylist-decoder-' + uuid.uuid4().hex[:12]
        args = ['docker', 'run', '--pull=never', '--network', 'none', '--name', name,
                '--read-only', '--user', '65534:65534', '--cap-drop', 'ALL',
                '--security-opt', 'no-new-privileges', '--memory', str(MEMORY),
                '--memory-swap', str(MEMORY), '--cpus', '0.5', '--pids-limit', '64',
                '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
                '--mount', f'type=bind,source={work},target=/work,readonly',
                '--workdir', '/work', '--entrypoint', 'node', IMAGE,
                '--max-old-space-size=128', '/work/check.mjs', mode]
        started = time.monotonic()
        try:
            result = run(args, timeout=20)
            inspected = run(['docker', 'inspect', name])
            check(inspected.returncode == 0, 'Container status unavailable')
            state = json.loads(inspected.stdout)[0]
            limits = state['HostConfig']
            check(limits['Memory'] == MEMORY and limits['MemorySwap'] == MEMORY
                  and limits['NanoCpus'] == 500_000_000 and limits['PidsLimit'] == 64,
                  'Container resource configuration drift')
            if mode == 'oom':
                check(result.returncode == 137 and state['State']['OOMKilled'],
                      'Native buffer allocation did not trigger the enforced memory limit')
            else:
                check(result.returncode == 0, f'{mode} resource check failed: {result.stderr[:300]}')
                check(not state['State']['OOMKilled'], f'{mode} exceeded memory limit')
                print(result.stdout.strip())
            check(time.monotonic() - started < 20, 'Container exceeded rehearsal deadline')
            print(f'{mode}: passed')
        finally:
            removed = run(['docker', 'rm', '-f', name])
            check(removed.returncode == 0, 'Temporary decoder container cleanup failed')
print('Six isolated decoder resource scenarios passed. Local-only evidence; no hosted activation.')
