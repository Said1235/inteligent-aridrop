"""Optional deploy check against a local GLSim (not part of the direct suite).

Purpose: prove that the zero-argument constructor deploys through the real
JSON-RPC + consensus path, not just in direct mode.

    pip install "genlayer-test[sim]"
    glsim --port 4000 --validators 5
    gltest tests/integration/ -v -s

GLSim caveat, reproduced here: it runs the Python runner natively rather than
inside GenVM and keeps module state across deploys, so only the FIRST deploy in
a given GLSim process succeeds. A second one fails with "class is not marked
for usage within storage" naming the contract class itself. That is a GLSim
artifact, not a contract defect - restart GLSim between deploys.
"""

import pytest
import requests

from gltest import get_contract_factory

RPC = "http://127.0.0.1:4000/api"


def _glsim_up() -> bool:
    try:
        requests.post(RPC, json={"jsonrpc": "2.0", "id": 1, "method": "ping", "params": []}, timeout=3)
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _glsim_up(), reason="GLSim is not running on port 4000")
def test_deploy_with_zero_constructor_args():
    contract = get_contract_factory("IntelligentAirdrop").deploy(args=[])
    assert contract.address
