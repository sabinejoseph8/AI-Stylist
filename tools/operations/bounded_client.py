"""Bound a child client's output in memory; never logs child data or errors."""
import subprocess
import threading

class ClientHeld(RuntimeError):pass

def capture(args,data,*,limit,timeout=60,popen=subprocess.Popen):
    if type(limit) is not int or not 0<limit<=34*1024*1024:raise ClientHeld('client-limit-held')
    process=popen(args,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    output=[];overflow=threading.Event()
    def read_output():
        count=0
        try:
            while True:
                part=process.stdout.read(65536)
                if not part:break
                count+=len(part)
                if count>limit:
                    overflow.set();process.kill();break
                output.append(part)
        except OSError:overflow.set()
        finally:process.stdout.close()
    def drain_error():
        # Retain no raw stderr, including server details or record names.
        try:
            while process.stderr.read(4096):pass
        except OSError:pass
        finally:process.stderr.close()
    workers=[threading.Thread(target=read_output,daemon=True),threading.Thread(target=drain_error,daemon=True)]
    for worker in workers:worker.start()
    timed_out=False
    try:
        process.stdin.write(data);process.stdin.close()
        process.wait(timeout=timeout)
    except (subprocess.TimeoutExpired,BrokenPipeError,OSError):
        timed_out=True
        process.kill()
        try:process.wait(timeout=3)
        except subprocess.TimeoutExpired:pass
    finally:
        if not process.stdin.closed:
            try:process.stdin.close()
            except OSError:pass
        for worker in workers:worker.join(timeout=3)
    if timed_out or overflow.is_set() or process.returncode!=0 or any(w.is_alive() for w in workers):
        raise ClientHeld('client-failed-or-limit-held')
    return b''.join(output)
