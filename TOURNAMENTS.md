# Tournaments

Tournaments use a game plugin contract for game version, mode, rules, scoring,
result validation, and compatibility. Entry capacity is enforced by a
database transaction/constraint, not by client state.

Results are eligible for settlement only after server verification through
authoritative events, signed payloads, evidence/replay, anti-cheat checks, and
opponent confirmation where required.
