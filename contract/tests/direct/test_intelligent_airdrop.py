"""Direct-mode tests for contracts/intelligent_airdrop.py.

Scope note: `evaluate_claim`'s LLM branch cannot be driven end-to-end here.
`gl.eq_principle.prompt_non_comparative` emits an `ExecPromptTemplate` gl_call,
and the genlayer-test 0.29.2 direct dispatcher only handles `ExecPrompt`,
`GetWebsite`/`WebRequest` and `WebRender` (gltest/direct/wasi_mock.py, the
`gl_call` dispatch chain). `direct_vm.mock_llm` therefore never reaches this
contract. The verdict path is covered by unit-testing `_normalize_verdict`
directly; the guard clauses of `evaluate_claim` are covered on their own.
"""

import pytest

from conftest import contract_module, message_of, schema, user_error

DEFAULTS = [
    "The evidence must describe a specific, verifiable action actually taken by the claimant",
    "The evidence must not be a vague or generic statement that could apply to anyone",
]

CUSTOM = [
    "The claimant must have starred the repository github.com/example/project",
    "The evidence must include the claimant's GitHub username",
]


# --------------------------------------------------------------------------
# Deployment
# --------------------------------------------------------------------------

def test_deploy_with_no_args_succeeds(direct_vm, direct_deploy, direct_owner, contract_path):
    """The constructor takes zero arguments, so the Studio form has no fields."""
    direct_vm.sender = direct_owner
    contract = direct_deploy(contract_path)

    from genlayer import Address

    assert contract.get_requirements() == []
    assert contract.organizer == Address(direct_owner)
    assert schema()["ctor"]["params"] == []


def test_deploy_with_default_requirements(deploy_as, direct_owner):
    """Defaults are reached through set_requirements, not the constructor."""
    contract = deploy_as(direct_owner, None)
    assert contract.get_requirements() == DEFAULTS


def test_deploy_with_custom_requirements(deploy_as, direct_owner):
    contract = deploy_as(direct_owner, CUSTOM)
    assert contract.get_requirements() == CUSTOM


def test_deploy_too_many_requirements_fails(deploy_as, direct_owner):
    too_many = [f"requirement number {i}" for i in range(21)]
    with pytest.raises(Exception) as exc:
        deploy_as(direct_owner, too_many)
    assert "exceeds 20 item limit" in message_of(exc.value)


def test_deploy_empty_requirement_string_fails(deploy_as, direct_owner):
    with pytest.raises(Exception) as exc:
        deploy_as(direct_owner, ["a valid rule", "   "])
    assert "non-empty string" in message_of(exc.value)


# --------------------------------------------------------------------------
# set_requirements: authorisation and one-shot semantics
# --------------------------------------------------------------------------

def test_set_requirements_by_organizer_succeeds(direct_vm, direct_deploy, direct_owner, contract_path):
    direct_vm.sender = direct_owner
    contract = direct_deploy(contract_path)
    assert contract.get_requirements() == []

    contract.set_requirements(CUSTOM)
    assert contract.get_requirements() == CUSTOM


def test_set_requirements_by_non_organizer_fails(direct_vm, direct_deploy, direct_owner, direct_bob, contract_path):
    direct_vm.sender = direct_owner
    contract = direct_deploy(contract_path)

    direct_vm.sender = direct_bob
    with pytest.raises(Exception) as exc:
        contract.set_requirements(["bob's own rule"])
    assert "only the organizer" in message_of(exc.value)

    # The attempt must leave the contract unconfigured, not half-configured.
    assert contract.get_requirements() == []

    # And the real organizer can still configure it afterwards.
    direct_vm.sender = direct_owner
    contract.set_requirements(CUSTOM)
    assert contract.get_requirements() == CUSTOM


def test_set_requirements_twice_fails(direct_vm, deploy_as, direct_owner, direct_bob):
    contract = deploy_as(direct_owner, CUSTOM)

    # Same list, by the organizer.
    with pytest.raises(Exception) as exc:
        contract.set_requirements(CUSTOM)
    assert "already set" in message_of(exc.value)

    # A different list, by the organizer.
    with pytest.raises(Exception) as exc:
        contract.set_requirements(["a completely different rule"])
    assert "already set" in message_of(exc.value)

    # And by anybody else.
    direct_vm.sender = direct_bob
    with pytest.raises(Exception):
        contract.set_requirements(["bob's rule"])

    assert contract.get_requirements() == CUSTOM


def test_set_requirements_with_defaults_when_empty_list_passed(deploy_as, direct_owner):
    contract = deploy_as(direct_owner, [])
    assert contract.get_requirements() == DEFAULTS

    # Falling back to the defaults still consumes the one-shot.
    with pytest.raises(Exception) as exc:
        contract.set_requirements(CUSTOM)
    assert "already set" in message_of(exc.value)


def test_set_requirements_string_instead_of_list_fails(deploy_as, direct_owner):
    """Regression: calldata is dynamically typed, so `list[str]` is not enforced.

    Without the isinstance guard, passing "hello" sets five one-character
    requirements because a str is a non-empty iterable of non-empty strs.
    """
    with pytest.raises(Exception) as exc:
        deploy_as(direct_owner, "hello")
    assert "must be a list of strings" in message_of(exc.value)


def test_set_requirements_over_char_limit_fails(deploy_as, direct_owner):
    with pytest.raises(Exception) as exc:
        deploy_as(direct_owner, ["x" * 501])
    assert "500 character limit" in message_of(exc.value)


def test_set_requirements_max_boundary_is_accepted(deploy_as, direct_owner):
    exactly_max = [f"requirement number {i}" for i in range(20)]
    contract = deploy_as(direct_owner, exactly_max)
    assert len(contract.get_requirements()) == 20


# --------------------------------------------------------------------------
# submit_claim
# --------------------------------------------------------------------------

def test_submit_claim_success(direct_vm, deploy_as, direct_owner, direct_alice):
    contract = deploy_as(direct_owner, CUSTOM)
    direct_vm.sender = direct_alice

    contract.submit_claim(1, "I starred the repo, my username is eloin")

    claim = contract.get_claim(1)
    assert claim["evidence_text"] == "I starred the repo, my username is eloin"
    assert claim["status"] == "pending"


def test_submit_claim_empty_evidence_fails(direct_vm, deploy_as, direct_owner, direct_alice):
    contract = deploy_as(direct_owner, CUSTOM)
    direct_vm.sender = direct_alice

    with pytest.raises(Exception) as exc:
        contract.submit_claim(1, "")
    assert "empty evidence" in message_of(exc.value)


def test_submit_claim_duplicate_id_fails(direct_vm, deploy_as, direct_owner, direct_alice, direct_bob):
    contract = deploy_as(direct_owner, CUSTOM)

    direct_vm.sender = direct_alice
    contract.submit_claim(42, "alice's evidence")

    # A different sender must not be able to overwrite an existing claim either.
    direct_vm.sender = direct_bob
    with pytest.raises(Exception) as exc:
        contract.submit_claim(42, "bob's evidence")
    assert "already exists" in message_of(exc.value)

    assert contract.get_claim(42)["evidence_text"] == "alice's evidence"


# --------------------------------------------------------------------------
# _normalize_verdict
# --------------------------------------------------------------------------

def test_normalize_verdict_qualifies(deploy_as, direct_owner):
    deploy_as(direct_owner, CUSTOM)
    normalize = contract_module()._normalize_verdict

    assert normalize("qualifies") == "qualifies"
    assert normalize("QUALIFIES") == "qualifies"
    assert normalize("  Qualifies\n") == "qualifies"


def test_normalize_verdict_does_not_qualify(deploy_as, direct_owner):
    deploy_as(direct_owner, CUSTOM)
    normalize = contract_module()._normalize_verdict

    assert normalize("does_not_qualify") == "does_not_qualify"
    assert normalize("  DoEs_NoT_QuAlIfY  ") == "does_not_qualify"
    assert normalize("\tDOES_NOT_QUALIFY\n") == "does_not_qualify"


def test_normalize_verdict_invalid_raises(deploy_as, direct_owner):
    deploy_as(direct_owner, CUSTOM)
    normalize = contract_module()._normalize_verdict
    UserError = user_error()

    for bad in [
        "maybe",
        "",
        "   ",
        '{"verdict": "qualifies"}',
        "qualifies.",                      # trailing punctuation is rejected
        "The evidence qualifies",          # prose is rejected
        "does not qualify",                # spaces instead of underscores
    ]:
        with pytest.raises(UserError):
            normalize(bad)


def test_normalize_verdict_rejects_non_string(deploy_as, direct_owner):
    """Covers the real direct-mode failure mode: an unhandled gl_call returns None."""
    deploy_as(direct_owner, CUSTOM)
    normalize = contract_module()._normalize_verdict
    UserError = user_error()

    for bad in [None, 1, ["qualifies"], {"verdict": "qualifies"}]:
        with pytest.raises(UserError):
            normalize(bad)


# --------------------------------------------------------------------------
# evaluate_claim guard clauses
# --------------------------------------------------------------------------

def test_evaluate_claim_before_requirements_set_fails(direct_vm, direct_deploy, direct_owner, direct_alice, contract_path):
    """CRITICAL: closes the "empty rule set is vacuously satisfied" window.

    Between deploy and set_requirements the rule list is empty, so an
    evaluation run against it would ask the validators to confirm zero rules
    and every claimant would qualify. The guard must fire before consensus,
    and it must fire for a real pending claim, not only for a missing one.
    """
    direct_vm.sender = direct_owner
    contract = direct_deploy(contract_path)
    assert contract.get_requirements() == []

    direct_vm.sender = direct_alice
    contract.submit_claim(1, "anything at all")

    with pytest.raises(Exception) as exc:
        contract.evaluate_claim(1)
    assert "requirements not configured yet" in message_of(exc.value)
    assert contract.get_claim(1)["status"] == "pending"

    # Once configured, the same claim reaches the consensus stage instead
    # (which then fails on the unmockable LLM, not on the guard).
    direct_vm.sender = direct_owner
    contract.set_requirements(CUSTOM)
    direct_vm.sender = direct_alice
    with pytest.raises(Exception) as exc:
        contract.evaluate_claim(1)
    assert "requirements not configured yet" not in message_of(exc.value)


def test_evaluate_claim_nonexistent_id_fails(direct_vm, deploy_as, direct_owner, direct_alice):
    contract = deploy_as(direct_owner, CUSTOM)
    direct_vm.sender = direct_alice

    with pytest.raises(Exception) as exc:
        contract.evaluate_claim(999)
    assert "claim not found" in message_of(exc.value)


def test_evaluate_claim_twice_fails(direct_vm, deploy_as, direct_owner, direct_alice):
    contract = deploy_as(direct_owner, CUSTOM)
    direct_vm.sender = direct_alice
    contract.submit_claim(1, "I starred the repo, my username is eloin")

    # The LLM round cannot run in direct mode (see module docstring), so the
    # decided state is written straight to storage to reach the second call.
    contract.claims[1].status = "qualifies"
    assert contract.get_claim(1)["status"] == "qualifies"

    with pytest.raises(Exception) as exc:
        contract.evaluate_claim(1)
    assert "already evaluated" in message_of(exc.value)


def test_evaluate_claim_llm_is_not_mockable_in_direct_mode(direct_vm, deploy_as, direct_owner, direct_alice):
    """Pins verification point 5: mock_llm does not reach prompt_non_comparative.

    The unhandled `ExecPromptTemplate` gl_call yields None, `_normalize_verdict`
    rejects it, and the transaction rolls back with the claim left pending.
    If a future genlayer-test wires up the template dispatch, this test breaks
    and the verdict path becomes testable here.
    """
    contract = deploy_as(direct_owner, CUSTOM)
    direct_vm.sender = direct_alice
    contract.submit_claim(1, "I starred the repo, my username is eloin")

    direct_vm.mock_llm(r".*", "qualifies")

    with pytest.raises(Exception) as exc:
        contract.evaluate_claim(1)
    assert "invalid LLM output" in message_of(exc.value)
    assert contract.get_claim(1)["status"] == "pending"


# --------------------------------------------------------------------------
# Views
# --------------------------------------------------------------------------

def test_get_claim_nonexistent_id_fails(deploy_as, direct_owner):
    contract = deploy_as(direct_owner, CUSTOM)

    with pytest.raises(Exception) as exc:
        contract.get_claim(12345)
    assert "claim not found" in message_of(exc.value)


def test_get_claim_returns_correct_claimant(direct_vm, deploy_as, direct_owner, direct_alice, direct_bob):
    """CRITICAL: claimant comes only from gl.message.sender_address."""
    contract = deploy_as(direct_owner, CUSTOM)

    from genlayer import Address

    direct_vm.sender = direct_alice
    contract.submit_claim(1, "alice's evidence")

    direct_vm.sender = direct_bob
    contract.submit_claim(2, "bob's evidence")

    alice_addr = Address(direct_alice)
    bob_addr = Address(direct_bob)

    assert contract.get_claim(1)["claimant"] == alice_addr
    assert contract.get_claim(2)["claimant"] == bob_addr
    assert alice_addr != bob_addr

    # The same sender switch must not retroactively change an earlier claim.
    direct_vm.sender = direct_alice
    assert contract.get_claim(2)["claimant"] == bob_addr

    # And no method takes an address/wallet parameter at all: the ABI is the
    # machine-checkable form of "the wallet is never a manual input field".
    sch = schema()
    every_param = [
        p for m in sch["methods"].values() for p in m["params"]
    ] + sch["ctor"]["params"]

    assert {name for name, _ in every_param} == {"claim_id", "evidence_text", "requirements"}
    for name, type_ in every_param:
        assert "address" not in str(type_).lower(), name
        assert not any(k in name.lower() for k in ("address", "wallet", "claimant", "organizer")), name


def test_organizer_is_never_a_parameter(direct_vm, direct_deploy, direct_owner, direct_bob, contract_path):
    """The organizer is whoever deployed, never a value anyone can pass in.

    Direct mode allows one deploy per test (the SDK keeps a single registered
    contract class), so this deploys from bob while
    ``test_deploy_with_no_args_succeeds`` deploys from owner: together they
    show the organizer tracks the deploying sender rather than a constant.
    """
    direct_vm.sender = direct_bob
    contract = direct_deploy(contract_path)

    from genlayer import Address

    assert contract.organizer == Address(direct_bob)
    assert contract.organizer != Address(direct_owner)
    assert schema()["ctor"]["params"] == []

    # organizer is storage, not an argument, and no setter exposes it.
    assert "organizer" not in schema()["methods"]
    for method in schema()["methods"].values():
        assert not any(name == "organizer" for name, _ in method["params"])


def test_get_requirements_returns_exact_list(deploy_as, direct_owner):
    custom = [
        "  The claimant must have attended the community call  ",
        "The evidence must include the call date",
    ]
    contract = deploy_as(direct_owner, custom)

    # Stored exactly as given, only stripped, in the same order.
    assert contract.get_requirements() == [
        "The claimant must have attended the community call",
        "The evidence must include the call date",
    ]


# --------------------------------------------------------------------------
# Invariants
# --------------------------------------------------------------------------

def test_requirements_are_immutable_once_set(direct_vm, deploy_as, direct_owner, direct_alice):
    """After the one-shot, no public method can change the rules."""
    contract = deploy_as(direct_owner, ["only rule"])

    writes = [n for n, m in schema()["methods"].items() if not m["readonly"]]
    assert sorted(writes) == ["evaluate_claim", "set_requirements", "submit_claim"]

    direct_vm.sender = direct_alice
    contract.submit_claim(1, "some evidence")
    with pytest.raises(Exception):
        contract.set_requirements(["a new rule"])

    assert contract.get_requirements() == ["only rule"]


def test_contract_handles_no_money(direct_vm, direct_deploy, direct_owner, contract_path):
    """No payable method, no transfer: this is a pure eligibility oracle."""
    direct_vm.sender = direct_owner
    direct_deploy(contract_path)

    for name, method in schema()["methods"].items():
        assert method.get("payable", False) is False, name

    source = open(contract_path).read()
    for forbidden in ("payable", "emit_transfer", "gl.message.value"):
        assert forbidden not in source
