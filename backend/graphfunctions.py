import networkx as nx
import graphviz

import json
import os
import io
import base64
from typing import Dict, Optional, Tuple
import uuid
import itertools
from rate import handle_rate_measurement
os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"

import networkx as nx
import json
import os
from typing import Dict, Optional, Tuple
import datetime
from pymongo import MongoClient
import networkx as nx
import json
from typing import Dict, Optional, Tuple

class GraphDataManager:
    """Manages graph data storage and manipulation using MongoDB."""
    
    def __init__(self, recipe_id: str):
        """
        Initialize the graph data manager.
        
        Args:
            recipe_id: ID of the recipe being processed
        """
        self.client = MongoClient("mongodb://127.0.0.1:27017")
        self.db = self.client["recipe_db"]
        self.graphs_collection = self.db["graphs"]
        self.recipe_id = recipe_id
        self.current_graph = self.load_data()
    
    def load_data(self) -> nx.DiGraph:
        """
        Load existing graph data from MongoDB.
        
        Returns:
            NetworkX DiGraph object
        """
        try:
            graph_data = self.graphs_collection.find_one({
                "recipe_id": self.recipe_id,
                "type": "cumulative"
            })
            
            if graph_data and 'graph_data' in graph_data:
                data = graph_data['graph_data']
                G = nx.DiGraph()
                
                # Add nodes with their attributes including shape
                for node in data.get('nodes', []):
                    shape = node.get('shape', 'ellipse')
                    G.add_node(node['id'], shape=shape, **node.get('attributes', {}))
                
                # Add edges with their attributes
                for edge in data.get('edges', []):
                    G.add_edge(edge['source'], edge['target'], **edge.get('attributes', {}))
                
                return G
            return nx.DiGraph()
            
        except Exception as e:
            print(f"Error loading graph data: {e}")
            return nx.DiGraph()
    
    def save_data(self) -> bool:
        """
        Save current graph data to MongoDB.
        
        Returns:
            bool: True if save successful, False otherwise
        """
        try:
            # Create a custom dictionary representation of the graph
            data = {
                'nodes': [],
                'edges': []
            }
            
            # Add nodes and their attributes
            for node, attrs in self.current_graph.nodes(data=True):
                node_data = {
                    'id': node,
                    'shape': attrs.get('shape', 'ellipse'),
                    'attributes': {key: value for key, value in attrs.items() if key != 'shape'}
                }
                data['nodes'].append(node_data)
            
            # Add edges and their attributes
            for source, target, attrs in self.current_graph.edges(data=True):
                edge_data = {
                    'source': source,
                    'target': target,
                    'attributes': attrs
                }
                data['edges'].append(edge_data)
            
            # Update or insert the graph data
            self.graphs_collection.update_one(
                {"recipe_id": self.recipe_id, "type": "cumulative"},
                {
                    "$set": {
                        "type": "cumulative",
                        "graph_data": data,
                        "last_updated": datetime.datetime.utcnow()
                    }
                },
                upsert=True
            )
            return True
            
        except Exception as e:
            print(f"Error saving graph data: {e}")
            return False
    
    def clear_data(self) -> None:
        """Clear all existing graph data for this recipe."""
        self.current_graph = nx.DiGraph()
        self.graphs_collection.delete_one({"recipe_id": self.recipe_id, "type": "cumulative"})


# Rest of the code remains the same...


def create_measurement_subgraph(G: nx.DiGraph, parent_node: str, 
                              measurement: str = "", quantity: str = "") -> None:
    global_measurement_counter = 1
    """
    Create measurement-related nodes and edges for a given parent node.
    
    Args:
        G: NetworkX DiGraph object
        parent_node: Node to attach measurements to
        measurement: Measurement unit value
        quantity: Quantity value
    """
    if not (measurement or quantity):
        return
        
    mod_measure_node = f"mod_measure_{parent_node}"
    measure_node = f"[meas_1_{parent_node}]"
    if measurement and quantity:
        G.add_node(mod_measure_node, node_type='mod_measure', label="mod_")
        G.add_node(measure_node, node_type='measure', label=f"[measure_{global_measurement_counter}]")
        G.add_edge(parent_node, mod_measure_node)
        G.add_edge(mod_measure_node, measure_node)
    
        if measurement:
            unit_node = f"unit_{measurement}"
            G.add_node(unit_node, node_type='unit', label=measurement)
            G.add_edge(measure_node, unit_node)
            
            value_node = str(measurement)
            G.add_node(value_node, node_type='unit_value', label=measurement)
            G.add_edge(unit_node, value_node)
            
        if quantity:
            quantity_node = f"count_{quantity}"
            G.add_node(quantity_node, node_type='quantity', label=quantity)
            G.add_edge(measure_node, quantity_node)
            
            value_node = str(quantity)
            G.add_node(value_node, node_type='quantity_value', label=quantity)
            G.add_edge(quantity_node, value_node)
    


def handle_span_relationship(G, relation_node, noun_rel, root_node):
    """
    Handle span relationship in the graph structure for cooking instructions.
    Includes support for noun intensifiers.
    
    Args:
        G: NetworkX DiGraph object
        relation_node: String identifier for the relation node
        noun_rel: Dictionary containing noun relationship data
        root_node: String identifier for the root verb+tam node
    """
    global_measurement_counter = 1
    global_span_counter = 1
    
    # Create span node
    span_node = f"span_dynamic_1_{uuid.uuid4().hex[:6]}"
    G.add_node(span_node, node_type='span_dynamic', label=f"[span_{global_span_counter}]")
    G.add_edge(relation_node, span_node)
    
    def add_modifier_with_intensifier(G, noun_node, noun, noun_rel):
        """Helper function to add modifier and intensifier nodes for a noun"""
        if noun not in noun_rel['nounModifiers']:
            return
            
        modifiers = noun_rel['nounModifiers'][noun]
        intensifiers = noun_rel.get('nounIntensifiers', {}).get(noun, [])
        
        # Zip modifiers with intensifiers, padding shorter list with None
        for idx, modifier in enumerate(modifiers):
            mod_node = f"mod_{noun}_{uuid.uuid4().hex[:6]}"
            G.add_node(mod_node, node_type='mod', label="mod")
            G.add_edge(noun_node, mod_node)

            modifier_node = f"modifier_{modifier}_{uuid.uuid4().hex[:6]}"
            G.add_node(modifier_node, node_type='modifier', label=modifier)

            # Connect mod -> modifier
            G.add_edge(mod_node, modifier_node)

            # Add intensifier if available
            if idx < len(intensifiers) and intensifiers[idx]:
                intensifier = intensifiers[idx]
                intf_node = f"intf_{uuid.uuid4().hex[:6]}"  # Intermediate intf node
                intensifier_node = f"intensifier_{intensifier}_{uuid.uuid4().hex[:6]}"

                G.add_node(intf_node, node_type='intf', label="intf")
                G.add_node(intensifier_node, node_type='intensifier', label=intensifier)

                # Connect modifier -> intf -> intensifier
                G.add_edge(modifier_node, intf_node)
                G.add_edge(intf_node, intensifier_node)
    
    def add_measurements(G, noun_node, noun, noun_rel, counter):
        """Helper function to add measurement and quantity nodes for a noun"""
        if noun not in noun_rel['measurements'] and noun not in noun_rel['quantities']:
            return counter  # Return unchanged counter if no measurements to add
            
        mod_measure_node = f"mod_measure_{noun}_{uuid.uuid4().hex[:6]}"
        G.add_node(mod_measure_node, node_type='mod_measure', label="mod")
        G.add_edge(noun_node, mod_measure_node)
        
        measure_node = f"[measure_1_{noun}_{uuid.uuid4().hex[:6]}]"
        G.add_node(measure_node, node_type='measure', label=f"[meas_{counter}]")
        G.add_edge(mod_measure_node, measure_node)
        
        if noun in noun_rel['measurements']:
            unit_node = f"unit_{noun}_{uuid.uuid4().hex[:6]}"
            G.add_node(unit_node, node_type='unit', label="unit")
            G.add_edge(measure_node, unit_node)
            
            unit_value = noun_rel['measurements'][noun]
            unit_value_node = f"unit_value_{unit_value}_{uuid.uuid4().hex[:6]}"
            G.add_node(unit_value_node, node_type='unit_value', label=unit_value)
            G.add_edge(unit_node, unit_value_node)
        
        if noun in noun_rel['quantities']:
            quantity_node = f"count_{noun}_{uuid.uuid4().hex[:6]}"
            G.add_node(quantity_node, node_type='quantity', label="quantity")
            G.add_edge(measure_node, quantity_node)
            
            quantity_value = str(noun_rel['quantities'][noun])
            quantity_value_node = f"quantity_value_{quantity_value}_{uuid.uuid4().hex[:6]}"
            G.add_node(quantity_value_node, node_type='quantity_value', label=quantity_value)
            G.add_edge(quantity_node, quantity_value_node)
        
        return counter + 1  # Return incremented counter
    
    # Handle start node and its components
    start_node = f"start_{uuid.uuid4().hex[:6]}"
    G.add_node(start_node, node_type='start', label="start")
    G.add_edge(span_node, start_node)
    
    start_noun = noun_rel['startNoun']
    start_noun_node = f"noun_start_{start_noun}_{uuid.uuid4().hex[:6]}"
    G.add_node(start_noun_node, node_type='noun', label=start_noun)
    G.add_edge(start_node, start_noun_node)
    
    # Add modifiers and intensifiers for start noun
    add_modifier_with_intensifier(G, start_noun_node, start_noun, noun_rel)
    
    # Add measurements for start noun
    global_measurement_counter = add_measurements(G, start_noun_node, start_noun, noun_rel, global_measurement_counter)
    
    # Handle end node and its components
    end_node = f"end_{uuid.uuid4().hex[:6]}"
    G.add_node(end_node, node_type='end', label="end")
    G.add_edge(span_node, end_node)
    
    end_noun = noun_rel['endNoun']
    end_noun_node = f"noun_end_{end_noun}_{uuid.uuid4().hex[:6]}"
    G.add_node(end_noun_node, node_type='noun', label=end_noun)
    G.add_edge(end_node, end_noun_node)
    
    # Add modifiers and intensifiers for end noun
    add_modifier_with_intensifier(G, end_noun_node, end_noun, noun_rel)
    
    # Add measurements for end noun
    global_measurement_counter = add_measurements(G, end_noun_node, end_noun, noun_rel, global_measurement_counter)
    
    
def create_graph_from_instruction(
    instruction_data: Dict,
    graph_manager: Optional[GraphDataManager] = None
) -> nx.DiGraph:
    """
    Create or update a tree-like graph from instruction data with proper string handling.
    Skips creation of nodes when values are empty and prevents displaying None values.
    Includes enhanced handling for time-related instructions.
    """

    # Initialize counters as function attributes instead of globals
    counters = {
        'span': 1,
        'conjunction': 1,
        'measurement': 1,
        'rate': 1
    }

    if graph_manager is None:
        graph_manager = GraphDataManager()

    G = graph_manager.current_graph.copy() if graph_manager.current_graph else nx.DiGraph()

    added_nouns = {} # Track added nouns to avoid duplicates

    # Find existing verb+TAM node
    existing_verb_tam = next(
        (node for node, attrs in G.nodes(data=True)
         if attrs.get('node_type') == 'verb_tam'),
        None
    )

    # Process verb and TAM
    verb = instruction_data.get('verb')
    tam = instruction_data.get('tam')
    secondary_actions = instruction_data.get('secondaryActions', [])

    verb_nodes = []
    root_node = None

    def get_target_verb(item):
        idx = item.get('actionIndex', 0)
        if idx < len(verb_nodes):
            return verb_nodes[idx]
        return root_node

    # Set root node
    if verb:
        actual_tam = tam if tam else "simple_present"
        verb_tam_node = f"verb_tam_{verb}_{actual_tam}_{uuid.uuid4().hex[:6]}"
        G.add_node(verb_tam_node, node_type='verb_tam', label=f"{verb}_{actual_tam}")
        root_node = verb_tam_node
        verb_nodes.append(verb_tam_node)

    # Secondary action nodes
    for action in secondary_actions:
        s_verb = action.get('verb')
        s_tam = action.get('tam')
        s_rel = action.get('relation', 'vmod')
        if s_verb:
            s_actual_tam = s_tam if s_tam else "simple_present"
            s_node = f"verb_tam_{s_verb}_{s_actual_tam}_{uuid.uuid4().hex[:6]}"
            G.add_node(s_node, node_type='verb_tam', label=f"{s_verb}_{s_actual_tam}")
            verb_nodes.append(s_node)
            if root_node:
                v_rel = f"vrel_{s_rel}_{uuid.uuid4().hex[:6]}"
                G.add_node(v_rel, node_type='relation', label=s_rel)
                G.add_edge(root_node, v_rel)
                G.add_edge(v_rel, s_node)

    # Verb descriptors
    seen_v_mods = set()
    for idx, desc in enumerate(instruction_data.get('descriptors', [])):
        target = get_target_verb(desc)
        if target:
            if isinstance(desc, dict):
                desc_label = desc.get("value", "")
                desc_rel = desc.get("relation") or "mod"
            else:
                desc_label = str(desc)
                desc_rel = "mod"

            safe_desc = str(desc_label).strip().replace(" ", "-")
            
            # Deduplication
            if (target, desc_rel, safe_desc) in seen_v_mods:
                continue
            seen_v_mods.add((target, desc_rel, safe_desc))

            modifier_node = f"modifier_verb_{safe_desc}_{uuid.uuid4().hex[:6]}"
            G.add_node(modifier_node, node_type="modifier", label=safe_desc)

            if desc_rel == "mod":
                mod_node = f"mod_verb_{idx}_{uuid.uuid4().hex[:6]}"
                G.add_node(mod_node, node_type="mod", label="mod")
                G.add_edge(target, mod_node)
                G.add_edge(mod_node, modifier_node)
            else:
                rel_node_id = f"relation_verb_desc_{idx}_{uuid.uuid4().hex[:6]}"
                G.add_node(rel_node_id, node_type="relation", label=desc_rel)
                G.add_edge(target, rel_node_id)
                G.add_edge(rel_node_id, modifier_node)


    # If we still don't have a root, nothing more to do
    if not root_node:
        root_node = existing_verb_tam # Fallback to existing if no new verb was added
        if not root_node: # If still no root, return
            return G

    # Attach timeNode (if present) directly to root verb_tam
    if root_node and 'timeNode' in instruction_data:
        time_info = instruction_data['timeNode']
        time_label = (time_info.get('value') or '').strip()

        if time_label:
            time_node_id = f"time_input_{uuid.uuid4().hex[:6]}"
            G.add_node(time_node_id, node_type='time', label=time_label)
            G.add_edge(root_node, time_node_id)

    # If we still don't have a root, nothing more to do
    if not root_node:
        return G

    # ---------- Helper functions ----------

    def add_measurement_nodes(G, parent_node, measurement, quantity, prefix, counters):
        """Helper function to add measurement and quantity nodes"""
        if not measurement and not quantity:
            return

        # Create measure node if parent_node contains "start" or "end"
        if "start" in parent_node or "end" in parent_node:
            meas_node = f"measure_{prefix}_{counters['measurement']}_{uuid.uuid4().hex[:6]}"
            G.add_node(meas_node, node_type='measure', label=f"[meas_{counters['measurement']}]")
            G.add_edge(parent_node, meas_node)
            counters['measurement'] += 1
        else:
            # Create rmeas node and connect it to measure node
            meas_node = f"measure_{prefix}_{counters['measurement']}_{uuid.uuid4().hex[:6]}"
            rmeas_node = f"rmeas__{uuid.uuid4().hex[:6]}"
            G.add_node(rmeas_node, node_type='rmeas', label="rmeas")
            G.add_node(meas_node, node_type='measure', label=f"[meas_{counters['measurement']}]")
            G.add_edge(parent_node, rmeas_node)
            G.add_edge(rmeas_node, meas_node)
            counters['measurement'] += 1

        # Create quantity and quantity_value nodes if quantity is provided
        if quantity:
            quantity_node = f"count_{prefix}_{uuid.uuid4().hex[:6]}"
            G.add_node(quantity_node, node_type='quantity', label="quantity")
            G.add_edge(meas_node, quantity_node)

            quantity_value = f"quantity_value_{prefix}_{uuid.uuid4().hex[:6]}"
            G.add_node(quantity_value, node_type='quantity_value', label=str(quantity))
            G.add_edge(quantity_node, quantity_value)

        # Create unit and unit_value nodes if measurement is provided
        if measurement:
            unit_node = f"unit_{prefix}_{uuid.uuid4().hex[:6]}"
            G.add_node(unit_node, node_type='unit', label="unit")
            G.add_edge(meas_node, unit_node)

            unit_value = f"unit_value_{prefix}_{uuid.uuid4().hex[:6]}"
            G.add_node(unit_value, node_type='unit_value', label=str(measurement))
            G.add_edge(unit_node, unit_value)

    def add_modifier_nodes(G, noun_node, modifier, intensifier=None):
        if not modifier:
            return None
        
        safe_modifier = str(modifier).strip().replace(" ", "-")
        
        # Deduplication: Check if this parent node already has a modifier with same label
        for neighbor in G.neighbors(noun_node):
            if G.nodes[neighbor].get('node_type') == 'mod':
                for grandchild in G.neighbors(neighbor):
                    if G.nodes[grandchild].get('label') == safe_modifier:
                        return neighbor # Return existing mod node

        mod_node = f"mod_{uuid.uuid4().hex[:6]}"
        G.add_node(mod_node, node_type="mod", label="mod")
        G.add_edge(noun_node, mod_node)

        modifier_node = f"modifier_{safe_modifier}_{uuid.uuid4().hex[:6]}"
        G.add_node(modifier_node, node_type="modifier", label=safe_modifier)
        G.add_edge(mod_node, modifier_node)

        if intensifier:
            intf_node = f"intf_{uuid.uuid4().hex[:6]}"
            intensifier_node = f"intensifier_{intensifier}_{uuid.uuid4().hex[:6]}"
            G.add_node(intf_node, node_type="intf", label="intf")
            G.add_node(intensifier_node, node_type="intensifier", label=intensifier)
            G.add_edge(modifier_node, intf_node)
            G.add_edge(intf_node, intensifier_node)

        return mod_node

    # ---------- Noun relations (objects etc.) FIRST ----------
    # Process noun relations
    for noun_rel in instruction_data.get('nounRelations', []):
        relation_raw = noun_rel.get('relation', '')

        # Ensure relation is always a clean string
        if isinstance(relation_raw, dict):
            relation = str(relation_raw.get('relation', '')).strip()
        else:
            relation = str(relation_raw).strip()

        # Fallback if it's still empty
        if not relation:
            relation = "unknown"

        if not relation:
            continue

        target_verb = get_target_verb(noun_rel)
        if not target_verb:
            continue

        relation_node = f"relation_{relation}_{uuid.uuid4().hex[:6]}"
        G.add_node(relation_node, node_type='relation', label=relation)
        G.add_edge(target_verb, relation_node)

        relation_type = noun_rel.get('relationType')

        if relation_type == 'SimpleConcept':
            noun = str(noun_rel.get('noun', ''))
            if not noun:
                continue

            # Deduplication: Check if this noun with this relation already exists for this verb
            noun_key = (target_verb, relation, noun)
            if noun_key in added_nouns:
                noun_node = added_nouns[noun_key]
            else:
                noun_node = f"noun_{relation}_{noun}_{uuid.uuid4().hex[:6]}"
                G.add_node(noun_node, node_type='noun', label=noun)
                G.add_edge(relation_node, noun_node)
                added_nouns[noun_key] = noun_node

            number = str(noun_rel.get('number', ''))
            if number:
                # Check if number already exists
                existing_nums = [G.nodes[gc].get('label') for n in G.neighbors(noun_node) if G.nodes[n].get('node_type') == 'card' for gc in G.neighbors(n)]
                if number not in existing_nums:
                    number_node = f"number_{number}_{uuid.uuid4().hex[:6]}"
                    num_node = f"num__{uuid.uuid4().hex[:6]}"
                    G.add_node(num_node, node_type='card', label="card")
                    G.add_node(number_node, node_type='number', label=number)
                    G.add_edge(noun_node, num_node)
                    G.add_edge(num_node, number_node)

            quantity = str(noun_rel.get('quantity', ''))
            measurement = noun_rel.get('measurement', None)
            measurements = noun_rel.get('measurements', {})

            # Handle regular measurements
            if quantity or measurement or measurements:
                add_measurement_nodes(
                    G,
                    noun_node,
                    measurement,
                    quantity,
                    'simple',
                    counters
                )

            # Handle modifiers and intensifiers
            # Unique processing to avoid duplicates from list
            raw_modifiers = noun_rel.get('nounModifiers', {}).get(noun, [])
            raw_intensifiers = noun_rel.get('nounIntensifiers', {}).get(noun, [])
            
            # Use unique pairs
            seen_mod_pairs = set()
            processed_mods = []
            processed_ints = []
            
            mod_int_pairs = list(itertools.zip_longest(raw_modifiers, raw_intensifiers))
            for m, i in mod_int_pairs:
                if m and (m, i) not in seen_mod_pairs:
                    processed_mods.append(m)
                    processed_ints.append(i)
                    seen_mod_pairs.add((m, i))

            for modifier, intensifier in zip(processed_mods, processed_ints):
                add_modifier_nodes(G, noun_node, modifier, intensifier)

            # Support legacy 'modifier' field if present
            legacy_mod = noun_rel.get('modifier')
            if legacy_mod and legacy_mod not in processed_mods:
                add_modifier_nodes(G, noun_node, legacy_mod, noun_rel.get('intensifier'))

            # Handle span relationship if present
            if noun_rel.get('complexType') == 'span':
                span_node = f"span_dynamic_{counters['span']}_{uuid.uuid4().hex[:6]}"
                rmeas_node = f"rmeas__{uuid.uuid4().hex[:6]}"

                G.add_node(span_node, node_type='span_dynamic', label=f"[span_{counters['span']}]")
                G.add_node(rmeas_node, node_type='rmeas', label="rmeas")

                G.add_edge(noun_node, rmeas_node)
                G.add_edge(rmeas_node, span_node)
                counters['span'] += 1

                # Create start and end nodes
                start_node = f"start_{uuid.uuid4().hex[:6]}"
                end_node = f"end_{uuid.uuid4().hex[:6]}"

                G.add_node(start_node, node_type='start', label="start")
                G.add_node(end_node, node_type='end', label="end")

                G.add_edge(span_node, start_node)
                G.add_edge(span_node, end_node)

                # Add measurements to start and end nodes
                add_measurement_nodes(
                    G,
                    start_node,
                    noun_rel.get('startMeasurement'),
                    noun_rel.get('startQuantity'),
                    'start',
                    counters
                )

                add_measurement_nodes(
                    G,
                    end_node,
                    noun_rel.get('endMeasurement'),
                    noun_rel.get('endQuantity'),
                    'end',
                    counters
                )

        elif relation_type in ['Conjoined', 'Disjoined']:
            connector_type = 'conj' if relation_type == 'Conjoined' else 'disj'
            connector_node = f"{connector_type}_{counters['conjunction']}_{uuid.uuid4().hex[:6]}"
            G.add_node(
                connector_node,
                node_type=connector_type,
                label=f"[{connector_type}_{counters['conjunction']}]"
            )
            G.add_edge(relation_node, connector_node)
            counters['conjunction'] += 1

            for noun_idx, noun in enumerate(noun_rel.get('selectedNouns', []), 1):
                if not noun:
                    continue

                opt_node = f"op_{noun_idx}_{uuid.uuid4().hex[:6]}"
                G.add_node(opt_node, node_type='option', label=f"op{noun_idx}")
                G.add_edge(connector_node, opt_node)

                # Deduplication
                noun_key = (target_verb, relation, noun)
                if noun_key in added_nouns:
                    noun_node = added_nouns[noun_key]
                else:
                    noun_node = f"noun_{relation}_{noun}_{noun_idx}_{uuid.uuid4().hex[:6]}"
                    G.add_node(noun_node, node_type='noun', label=noun)
                    added_nouns[noun_key] = noun_node
                
                G.add_edge(opt_node, noun_node)

                # Handle modifiers and intensifiers
                raw_modifiers = noun_rel.get('nounModifiers', {}).get(noun, [])
                raw_intensifiers = noun_rel.get('nounIntensifiers', {}).get(noun, [])
                
                seen_mod_pairs = set()
                processed_mods = []
                processed_ints = []
                
                mod_int_pairs = list(itertools.zip_longest(raw_modifiers, raw_intensifiers))
                for m, i in mod_int_pairs:
                    # modifier can be a dict or string
                    m_val = m.get('modifier') if isinstance(m, dict) else m
                    i_val = m.get('intensifier') if isinstance(m, dict) else i
                    
                    if m_val and (m_val, i_val) not in seen_mod_pairs:
                        processed_mods.append(m_val)
                        processed_ints.append(i_val)
                        seen_mod_pairs.add((m_val, i_val))

                for m_val, i_val in zip(processed_mods, processed_ints):
                    add_modifier_nodes(G, noun_node, m_val, i_val)

                # Handle measurements
                if noun_rel.get('measureTypes', {}).get(noun) == 'complex':
                    span_node = f"span_dynamic_{counters['span']}_{uuid.uuid4().hex[:6]}"
                    rmeas_node = f"rmeas__{uuid.uuid4().hex[:6]}"

                    G.add_node(rmeas_node, node_type='rmeas', label="rmeas")
                    G.add_edge(noun_node, rmeas_node)
                    G.add_node(
                        span_node,
                        node_type='span_dynamic',
                        label=f"[span_{counters['span']}]"
                    )
                    G.add_edge(rmeas_node, span_node)
                    counters['span'] += 1

                    measurement_data = {
                        'startMeasurement': noun_rel.get('startMeasurements', {}).get(noun),
                        'startQuantity': noun_rel.get('startQuantities', {}).get(noun),
                        'endMeasurement': noun_rel.get('endMeasurements', {}).get(noun),
                        'endQuantity': noun_rel.get('endQuantities', {}).get(noun)
                    }

                    # Create start and end nodes
                    start_node = f"start_{uuid.uuid4().hex[:6]}"
                    end_node = f"end_{uuid.uuid4().hex[:6]}"

                    G.add_node(start_node, node_type='start', label="start")
                    G.add_node(end_node, node_type='end', label="end")

                    G.add_edge(span_node, start_node)
                    G.add_edge(span_node, end_node)

                    # Add measurements to start and end nodes
                    add_measurement_nodes(
                        G,
                        start_node,
                        measurement_data.get('startMeasurement'),
                        measurement_data.get('startQuantity'),
                        'start',
                        counters
                    )

                    add_measurement_nodes(
                        G,
                        end_node,
                        measurement_data.get('endMeasurement'),
                        measurement_data.get('endQuantity'),
                        'end',
                        counters
                    )

                elif noun_rel.get('measureTypes', {}).get(noun) == 'simple':
                    measurements = noun_rel.get('measurements', {})
                    quantities = noun_rel.get('quantities', {})

                    # Handle missing 'number' gracefully
                    final_number = (noun_rel.get('number') or {}).get(noun, None)
                    if final_number:
                        number_node = f"number_{final_number}_{uuid.uuid4().hex[:6]}"
                        G.add_node(number_node, node_type='number', label=final_number)
                        G.add_edge(noun_node, number_node)

                    # Safely handle 'quantity'
                    quantity_data = noun_rel.get('quantity') or {}
                    quantity = str(quantity_data.get(noun, ""))
                    quantity_node = f"quantity_{quantity}_{uuid.uuid4().hex[:6]}"
                    measurement = noun_rel.get('measurement', None)

                    if quantity and noun not in measurements:
                        G.add_node(quantity_node, node_type='quant', label=quantity)
                        G.add_edge(noun_node, quantity_node)

                    if noun in measurements:
                        add_measurement_nodes(
                            G,
                            noun_node,
                            measurements.get(noun, ""),
                            quantities.get(noun, ""),
                            'conj',
                            counters
                        )

    # ---------- Tools: verb -> relation -> tool ----------
    for t_idx, tool_data in enumerate(instruction_data.get("tools", [])):
        if isinstance(tool_data, dict):
            tool_name = (tool_data.get("tool") or "").strip()
            relation_label = (tool_data.get("relation") or "tool").strip()
        else:
            tool_name = str(tool_data).strip()
            relation_label = "tool"

        if not tool_name:
            continue

        target_verb = get_target_verb(tool_data)
        if not target_verb:
            continue

        rel_node_id = f"relation_tool_{t_idx}_{uuid.uuid4().hex[:6]}"
        G.add_node(rel_node_id, node_type="relation", label=relation_label)
        G.add_edge(target_verb, rel_node_id)

        tool_node_id = f"tool_{tool_name}_{uuid.uuid4().hex[:6]}"
        G.add_node(tool_node_id, node_type="tool", label=tool_name)
        G.add_edge(rel_node_id, tool_node_id)

        # Handle tool modifiers
        modifiers = tool_data.get('modifiers', [])
        for modifier in modifiers:
            add_modifier_nodes(G, tool_node_id, modifier)

    # ---------- Temporals LAST: verb -> dur -> "for 5 minutes" ----------

    temporals = instruction_data.get("temporals", [])
    for idx, temp in enumerate(temporals):
        if isinstance(temp, dict):
            value = temp.get("value")
            unit = (temp.get("unit") or "").strip()
            display = (temp.get("display") or "").strip()
            relation = (temp.get("relation") or "dur").strip()
            semantic = temp.get("semanticCategory", "")
            morpho = temp.get("morphoSemantic", "")
        else:
            value = None
            unit = ""
            display = str(temp)
            relation = "dur"
            semantic = ""
            morpho = ""

        # build label for temporal node
        if unit.lower() in ["minutes", "hours", "seconds"]:
            if not display and value is not None:
                display = f"{value} {unit}"
            temp_label = f"for {display}"
        else:
            if display:
                temp_label = display
            elif value is not None:
                temp_label = f"{value} {unit}".strip()
            else:
                continue  # nothing meaningful to show

        # relation node
        rel_node_id = f"relation_temp_{relation}_{idx}_{uuid.uuid4().hex[:6]}"
        G.add_node(rel_node_id, node_type="relation", label=relation)

        # temporal node
        temporal_node_id = f"temporal_{idx}_{uuid.uuid4().hex[:6]}"
        G.add_node(temporal_node_id, node_type="temporal", label=temp_label, 
                   semanticCategory=semantic, morphoSemantic=morpho)

        target_verb = get_target_verb(temp)
        if target_verb:
            # connect: verb_tam -> relation -> temporal
            G.add_edge(target_verb, rel_node_id)
            G.add_edge(rel_node_id, temporal_node_id)

    graph_manager.current_graph = G
    graph_manager.save_data()
    return G


def generate_graph_image(G: nx.DiGraph) -> str:
    """
    Generate visualization of the graph using Graphviz with a focus on displaying labels.

    Args:
        G: NetworkX DiGraph object

    Returns:
        Base64 encoded string of the graph image
    """
    dot = graphviz.Digraph(format='png', engine='dot')

    NODE_COLORS = {
        'verb_tam': '#80C7FF',
        'noun': '#FF7F7F',
        'relation': '#A3F7BF',
        'ingredient': '#F9E470',
        'modifier': '#BFA6FF',
        'quantity_value': '#FFB6D1',
        'unit_value': '#B2D8F7',
        'instruction': '#A3F7BF',
        'conj': '#FFD599',
        'measuring_unit': '#C2DCFF',
        'measurements': '#A3F7BF',
        'mod': '#A3F7BF',
        'card': '#A3F7BF',
        'mod_measure': '#A3F7BF',
        'measure': '#FFD599',
        'quantity': '#F8C2FF',
        'unit': '#F7E09A',
        "tool": "#FFDAB9",

        'intensifier': '#FFA588',
        'span_dynamic': '#66FF80',  # Light green
        'intf': '#A3F7BF',
        'rmeas': '#A3F7BF',
        'rate_dynamic': '#E5FFE9',
        'unit_every': '#FFD699',
        'quant_label': '#A3F7BF',
        'start': '#C2F0C2',
        'end': '#FAD2E1',
        'number': '#F0E68C',
    }

    ELLIPSE_NODES = {
        'unit', 'relation', 'quantity', 'mod_measure', 'mod',
        'option', 'start', 'end', 'intf', 'rmeas',
        'unit_every', 'unit_label', 'num', 'quant_label',
        'card'
    }

    # Add nodes
    for node, attr in G.nodes(data=True):
        node_type = attr.get('node_type', '')
        label = attr.get('label', node)

        # Ensure label is always a printable string
        if not isinstance(label, str):
            label = str(label)
        label = ''.join(c if c.isprintable() else '?' for c in label)

        shape = 'ellipse' if node_type in ELLIPSE_NODES else 'rectangle'
        if node_type == 'span_dynamic':
            shape = 'box'

        color = NODE_COLORS.get(node_type, '#34A853')

        dot.node(
            node,
            label,
            style='filled',
            fillcolor=color,
            shape=shape,
            fontsize='12',fontname='Noto Sans Devanagari'
        )


    # Add edges
    for u, v, edge_attr in G.edges(data=True):
        edge_label = edge_attr.get('label', '')
        u_type = G.nodes[u].get('node_type', '')
        v_type = G.nodes[v].get('node_type', '')

        if (
            (u_type == 'option' and v_type == 'noun') or
            (u_type == 'start' and v_type == 'measure') or
            (u_type == 'end' and v_type == 'measure') or
            (u_type == 'unit' and v_type == 'unit_value') or
            (u_type == 'quantity' and v_type == 'quantity_value') or
            (u_type == 'unit_every' and v_type == 'measure') or
            (u_type == 'unit_label' and v_type == 'measure') or
            (u_type == 'num' and v_type == 'number')
        ):
            dot.edge(u, v, arrowhead='box', label=edge_label, fontsize='12')
        elif u_type in {
            'relation', 'mod', 'mod_measure', 'intf', 'rmeas', 'quant_label'
        } or v_type in {
            'noun', 'span_dynamic', 'modifier', 'meas_1', 'intensifier', 'rate_dynamic', 'quant', 'card'
        }:
            dot.edge(u, v, arrowhead='normal', label=edge_label, fontsize='12')
        else:
            dot.edge(u, v, dir='none', label=edge_label, fontsize='12')

    # Render to image
    buf = io.BytesIO()
    buf.write(dot.pipe())
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode()


def generate_hindi_sentence(G: nx.DiGraph) -> str:
    """
    Generate Hindi sentence from the graph structure.
    """
    sentence_parts = []
    
    # Find verb+TAM node
    verb_tam_node = next(
        (node for node, attrs in G.nodes(data=True) if attrs.get('node_type') == 'verb_tam'),
        None
    )
    
    if not verb_tam_node:
        return ""
        
    # Process actions/ingredients/etc
    # This is a simplified generator for the Hindi preview
    
    # Process nouns and ingredients
    for node, attrs in G.nodes(data=True):
        if attrs.get('node_type') in ['noun', 'ingredient']:
            label = attrs.get('label', '')
            if label:
                sentence_parts.append(label)
    
    # Process tools
    for node, attrs in G.nodes(data=True):
        if attrs.get('node_type') == 'tool':
            label = attrs.get('label', '')
            if label:
                sentence_parts.append(label)

    # Add verb+TAM label
    verb_tam_text = G.nodes[verb_tam_node].get('label', '')
    if verb_tam_text:
        sentence_parts.append(verb_tam_text)
    
    return ' '.join(sentence_parts)

def clear_graph_data(graph_manager):
    """Clear all existing graph data"""
    graph_manager.current_graph = nx.DiGraph()
    graph_manager.save_data()