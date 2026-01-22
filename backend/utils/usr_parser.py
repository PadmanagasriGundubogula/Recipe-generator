# utils/usr_parser.py

import re

def parse_usr_text_to_graphs(usr_text: str):
    """
    Very simple USR → graph converter.

    Assumptions:
      - usr_text is one sentence (or we treat the whole thing as one)
      - Each non-empty, non-comment line is a token
      - Columns: concept id ... (we only really care about concept + id)

    NOTE: lines are often tab-separated in USR; we prefer tab-splitting to
    preserve multi-word concepts like "as needed" which may otherwise be
    split on whitespace and lose tokens.
    """
    lines = usr_text.replace("\r\n", "\n").split("\n")

    token_lines = []
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#") or line.startswith("%"):
            continue
        if line.startswith("<") and not line.startswith("</"):
            continue
        if line.startswith("</"):
            continue

        token_lines.append(line)

    nodes = []
    idx_fallback = 1

    for line in token_lines:
        # Prefer tab-separated columns (USR format). Fall back to whitespace
        # split if no tabs are present.
        parts = re.split(r"\t+", line)
        if not parts or not parts[0].strip():
            parts = line.split()
            if not parts:
                continue

        concept = parts[0].strip()

        index = None
        # If the second column is an explicit numeric id, use it
        if len(parts) > 1 and parts[1].strip():
            try:
                index = int(parts[1])
            except Exception:
                index = None

        # If no explicit index, try to extract trailing number from concept
        # e.g. 'salt__3' or 'as_needed__2'
        if index is None:
            m = re.search(r"__?(\d+)$", concept)
            if m:
                try:
                    index = int(m.group(1))
                except Exception:
                    index = None

        if index is None:
            index = idx_fallback
            idx_fallback += 1

        dependency_data = parts[4].strip() if len(parts) > 4 else "-"
        speaker_view = parts[6].strip() if len(parts) > 6 else "-"

        node = {
            "concept": concept,
            "index": index,
            "dependency": dependency_data,
            "speaker_view": speaker_view
        }

        nodes.append(node)

    graph = {
        "text": "",
        "usr_id": "1",
        "SENT_TYPE": "affirmative",
        "nodes": nodes,
        "edges_dep": [],
        "edges_cxn": [],
        "edges_discourse": []
    }

    return [graph]
