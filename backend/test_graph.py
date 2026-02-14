
import networkx as nx
import uuid
import itertools
from graphfunctions import create_graph_from_instruction, GraphDataManager

class MockManager:
    current_graph = None
    def load_data(self): return nx.DiGraph()
    def save_data(self): return True

instruction_data = {
    "verb": "boil",
    "tam": "imperative",
    "nounRelations": [
        {
            "noun": "water",
            "relation": "What",
            "relationType": "SimpleConcept",
            "actionIndex": 0
        }
    ],
    "tools": [
        {
            "tool": "bowl",
            "relation": "Where",
            "actionIndex": 0,
            "modifiers": ["small"]
        }
    ]
}

G = create_graph_from_instruction(instruction_data, MockManager())
print("Nodes in graph:", list(G.nodes(data=True)))
print("Edges in graph:", list(G.edges()))

modifier_nodes = [n for n, d in G.nodes(data=True) if d.get('node_type') == 'modifier']
print("Modifier nodes found:", modifier_nodes)
