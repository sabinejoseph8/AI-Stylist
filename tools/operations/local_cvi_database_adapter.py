"""Disconnected database transaction contract. Ports are trusted required code.

No credential, SQL connection, signature verifier or fallback is constructed here.
A production authorizer must consume the independent authority claim and admit
only this authenticated connection's transaction through the restricted verifier.
"""
from copy import deepcopy
import re
import json
from threading import Lock

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False)



class DatabaseHeld(Exception):
    pass


class DatabaseTransactionAdapter:
    def __init__(self, principal, role, database, authority, clock):
        if (not isinstance(principal,str) or not re.fullmatch(r'[a-z][a-z0-9_]{0,62}',principal)
            or role not in ('activate','renew','fence','apply','release')
            or not callable(getattr(database,'begin',None))
            or not all(callable(getattr(authority,k,None)) for k in ('admit','confirm'))
            or not callable(clock)):
            raise DatabaseHeld('database contract unavailable')
        self.principal,self.role=principal,role
        self.begin,self.admit,self.confirm=database.begin,authority.admit,authority.confirm
        self.gate=Lock()
        self.clock=clock;self.held=False;self.busy=False;self.used=set();self.last=-1

    def time(self):
        n=self.clock()
        if type(n) is not int or n<self.last or n<0:raise DatabaseHeld('database contract unavailable')
        self.last=n;return n

    def execute(self, intent):
        if not self.gate.acquire(blocking=False):raise DatabaseHeld('database contract unavailable')
        if self.held:
            self.gate.release();raise DatabaseHeld('database contract unavailable')
        self.busy=True;tx=None;committed=False;closed=False;rollback=None;close=None
        try:
            p=deepcopy(intent)
            if len(canonical(p).encode())>65536:raise DatabaseHeld()
            if (not isinstance(p,dict) or set(p)!={'operationId','kind','previous','target','recordHash','expiresAt'}
                or not isinstance(p['operationId'],str) or not re.fullmatch(r'[a-f0-9]{32}',p['operationId'])
                or p['kind']!=self.role or p['operationId'] in self.used or len(self.used)>=128
                or type(p['expiresAt']) is not int or not self.time()<p['expiresAt']<=self.last+8000):
                raise DatabaseHeld()
            self.used.add(p['operationId'])
            tx=self.begin()
            if not all(callable(getattr(tx,k,None)) for k in ('identity','execute_admitted','commit','rollback','close')):raise DatabaseHeld()
            # Capture methods before crossing the external admission boundary.
            identity,apply,commit,rollback,close=tx.identity,tx.execute_admitted,tx.commit,tx.rollback,tx.close
            binding=identity()
            if (not isinstance(binding,dict) or set(binding)!={'principal','transactionId'}
                or binding['principal']!=self.principal or not isinstance(binding['transactionId'],str)
                or not re.fullmatch(r'[1-9][0-9]{0,19}',binding['transactionId'])):raise DatabaseHeld()
            expected=dict(intent=p,connection=binding)
            admission=self.admit(deepcopy(expected))
            if (not isinstance(admission,dict) or set(admission)!={'binding','claimHash'}
                or canonical(admission['binding'])!=canonical(expected) or not isinstance(admission['claimHash'],str)
                or not re.fullmatch(r'[a-f0-9]{64}',admission['claimHash'])):raise DatabaseHeld()
            if self.time()>=p['expiresAt'] or identity()!=binding:raise DatabaseHeld()
            result=apply(p['operationId'],admission['claimHash'])
            expected_result=dict(status='applied',operationId=p['operationId'],transactionId=binding['transactionId'],target=p['target'])
            if type(result)!=dict or canonical(result)!=canonical(expected_result):raise DatabaseHeld()
            if self.confirm(deepcopy(expected),admission['claimHash']) is not True:raise DatabaseHeld()
            if self.time()>=p['expiresAt'] or identity()!=binding:raise DatabaseHeld()
            # SQL write result is provisional until this exact connection commits.
            commit();committed=True
            if self.time()>=p['expiresAt']:raise DatabaseHeld()
            close();closed=True
            if self.time()>=p['expiresAt']:raise DatabaseHeld()
            return deepcopy(result)
        except Exception:
            self.held=True
            if tx is not None and not committed:
                try:(rollback or tx.rollback)()
                except Exception:pass
            raise DatabaseHeld('database contract unavailable') from None
        finally:
            if tx is not None and not closed:
                try:(close or tx.close)()
                except Exception:self.held=True
            self.busy=False
            self.gate.release()


class ReconciledDatabaseAdapter:
    """Require post-commit verified reconciliation. No resume/reapply method."""
    def __init__(self,base,finalizer,target_digest,clock):
        if (not callable(getattr(base,'execute',None)) or not callable(getattr(finalizer,'finalize',None))
            or not isinstance(target_digest,str) or not re.fullmatch(r'[a-f0-9]{64}',target_digest) or not callable(clock)):
            raise DatabaseHeld('full reconciliation unavailable')
        self.execute_base=base.execute;self.finalize=finalizer.finalize;self.target_digest=target_digest;self.clock=clock
        self.gate=Lock();self.attempted=False
    def execute(self,intent):
        if not self.gate.acquire(blocking=False):raise DatabaseHeld('full reconciliation unavailable')
        try:
            if self.attempted:raise DatabaseHeld()
            self.attempted=True;p=deepcopy(intent);before=self.clock()
            if type(before) is not int or before<0 or type(p.get('expiresAt')) is not int or before>=p['expiresAt']:raise DatabaseHeld()
            result=self.execute_base(deepcopy(p))
            final=self.finalize(deepcopy(p),deepcopy(result))
            expected=dict(status='reconciled',operationId=p['operationId'],targetDigest=self.target_digest)
            at=self.clock()
            if canonical(final)!=canonical(expected) or type(at) is not int or at<before or at>=p['expiresAt']:raise DatabaseHeld()
            return dict(transaction=deepcopy(result),reconciliation=deepcopy(final))
        except Exception:raise DatabaseHeld('full reconciliation unavailable') from None
        finally:self.gate.release()
