"""Shared helpers for Intelligent Airdrop direct-mode tests.

The GenLayer SDK is only put on ``sys.path`` once a contract has been
deployed, so anything importing ``genlayer.*`` must do so lazily, inside a
test body, after ``direct_deploy`` has run at least once.
"""

import sys
from pathlib import Path

import pytest

CONTRACT = str(Path(__file__).resolve().parents[2] / "contracts" / "intelligent_airdrop.py")
CONTRACT_MODULE = "_contract_intelligent_airdrop"

_UNSET = object()


@pytest.fixture
def contract_path() -> str:
    return CONTRACT


@pytest.fixture
def deploy_as(direct_vm, direct_deploy):
    """Deploy from a chosen organizer wallet, optionally configuring the rules.

    The constructor takes no arguments, so the deploying sender is what makes
    a wallet the organizer. Pass ``requirements`` to also run the one-shot
    ``set_requirements`` as that same organizer.
    """

    def _deploy(organizer, requirements=_UNSET):
        direct_vm.sender = organizer
        contract = direct_deploy(CONTRACT)
        if requirements is not _UNSET:
            contract.set_requirements(requirements)
        return contract

    return _deploy


def user_error():
    """The SDK's gl.vm.UserError class (import lazily, post-deploy)."""
    import genlayer.gl.vm as gl_vm

    return gl_vm.UserError


def contract_module():
    """The loaded contract module, for testing module-level helpers."""
    return sys.modules[CONTRACT_MODULE]


def schema():
    """The generated ABI of the currently loaded contract (import lazily)."""
    import genlayer.gl.genvm_contracts as gc
    import genlayer.py.get_schema as gs

    return gs.get_schema(gc.__known_contract__)


def message_of(exc: BaseException) -> str:
    """Text of a raised UserError (or any other exception)."""
    return getattr(exc, "message", None) or str(exc)
