# Image decoder resource rehearsal

Local Task 2b preparation, verified 11 October 2026. Customer uploads remain disabled.

## Evidence

Run `python3 apps/foundation/scripts/check-image-resources.py` from the repository root. Six scenarios pass:

| Scenario | Evidence |
| --- | --- |
| Limits | Kernel cgroup files report 384 MiB memory, zero swap, half a CPU and 64 processes; runtime uses an unprivileged UID and read-only source. |
| Valid images | The actual application sanitizer and worker accept generated PNG, JPEG and WebP, including the 16-million-pixel boundary, and emit WebP. |
| Invalid images | Corrupt JPEG and excessive dimensions are rejected. |
| Hung worker | The application parent kills and reaps the synthetic hung child at its deadline. |
| CPU pressure | Sustained generated work increases the kernel throttling counter and remains within the measured quota tolerance. |
| Native memory pressure | Allocated and touched native buffers trigger a kernel OOM kill inside the capped container; Docker reports OOMKilled and exit 137. |

Every scenario gets a separate container, removed in a finally block. No provider request, customer image, port mapping, credential, hosted migration or deployment is involved. The test harness allows at most 20 seconds per scenario and force-removes the container on timeout.

## Reproducible local runtime

The locally cached Linux arm64/musl runtime is digest-pinned to `public.ecr.aws/supabase/storage-api@sha256:1f6c99d3952d78d57129802aa2ae8a80d75e327492cf24742fd0aeaf90967b96`. Its Node entrypoint is used directly, so the Storage server never starts. The harness installs only the app's locked production packages in a temporary directory, with install scripts disabled and the Linux arm64/musl target selected. npm may download locked packages during preparation; test containers have networking disabled. Sharp 0.35.5 is verified inside the container. This is a local test runtime, not a proposed customer image or new provider dependency.

The source and dependencies are mounted read-only, all capabilities are dropped, privilege escalation is disabled, and the only writable mount is a bounded 16 MiB temporary filesystem. The native decoder shares the container limit with its test caller; the V8 heap flag remains an additional limit and is not presented as a native-memory cap.

Docker documents that equal memory and memory-swap values disable swap and that CPU quotas limit CPU capacity: [resource constraints](https://docs.docker.com/engine/containers/resource_constraints/).

## Hosted acceptance remains open

These results establish local Linux containment, not Render behavior. The application server does not invoke Docker, and a Render service must not be assumed to have a Docker daemon, writable cgroup controls or a separate decoder budget. Before enabling customer uploads, verify the actual approved deployment's enforced memory, CPU, process and wall-clock limits and its recovery after decoder termination. If adequate isolation requires another paid service or a hosting change, obtain financial/business authorization first. Keep authenticated upload access and hosted Storage/signed-URL verification as separate gates.

The 384 MiB setting is a tested local limit, not an approved production capacity or a promise that all valid user photos complete within it. The generated inputs establish boundary examples; a representative adversarial image corpus and actual hosted runtime still need validation before launch.
