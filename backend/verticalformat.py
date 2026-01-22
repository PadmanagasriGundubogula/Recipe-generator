# import json
# import pandas as pd
# from wxconv import WXC
# from langdetect import detect
# import re
# import uuid,datetime
# import os 
# from cp_cxn import process_file_cp
# from nc import process_file_nc

# def graphtousr(input_graph, relations_file_path, recipe_id, db):
#     """
#     Convert graph data to USR format and store in MongoDB
    
#     Parameters:
#     input_graph: NetworkX graph object
#     relations_file_path: Path to relations JSON file
#     recipe_id: Recipe identifier
#     db: MongoDB database connection
#     """
#     try:
#         # 1. Input validation
#         if not recipe_id:
#             raise ValueError("Recipe ID must be provided")
#         if not input_graph:
#             raise ValueError("Input graph must be provided")
#         if not relations_file_path:
#             raise ValueError("Relations file path must be provided")

#         # 2. File validation for relations
#         if not os.path.exists(relations_file_path):
#             raise FileNotFoundError(f"File not found: {relations_file_path}")
        
#         with open(relations_file_path, 'r', encoding='utf-8') as f:
#             content = f.read().strip()
#             if not content:
#                 raise ValueError(f"Empty file: {relations_file_path}")
#             try:
#                 relations_data = json.loads(content)
#                 if not relations_data.get('relations'):
#                     raise ValueError("Relations data must contain 'relations' array")
#             except json.JSONDecodeError:
#                 raise ValueError(f"Invalid JSON in file: {relations_file_path}")

#         # Convert NetworkX graph to required format
#         data = {
#             'nodes': [],
#             'edges': []
#         }
        
#         # Add nodes
#         for node, attrs in input_graph.nodes(data=True):
#             data['nodes'].append({
#                 'id': node,
#                 'attributes': attrs
#             })
            
#         # Add edges
#         for source, target, attrs in input_graph.edges(data=True):
#             data['edges'].append({
#                 'source': source,
#                 'target': target,
#                 'attributes': attrs
#             })

#         # Initialize variables
#         A_list = []  # Final list of processed elements
#         B_list = []  # Temporary list for storing connectors
#         verb_processed = False
#         connector_list = []  # Store both conj and disj
#         connector_ids = []   # Store connector IDs for final filtered list
#         node_info = {}      # For storing node details based on node label
#         verb_tam_index = None
#         tam = None

#         # Process each node in the data
#         print("\n===== Processing Nodes =====")
#         for node in data['nodes']:
#             node_type = node['attributes'].get('node_type')
#             node_label = node['attributes'].get('label')

#             # Save node information for later use
#             node_info[node_label] = {'type': node_type}

#             # Step 1: Process verb+TAM first
#             if not verb_processed and node_type == 'verb_tam':
#                 A_list.append(node_label)
#                 verb_processed = True
#                 verb_tam_index = len(A_list)
#                 print(f"Verb+TAM node found: {node_label} (Index: {verb_tam_index})")

#             # Step 2: Handle both conj and disj nodes dynamically
#             print(node_type)
#             if node_type in ['conj', 'disj' ,'span_dynamic','rate_dynamic'] or (node_label.startswith('[conj_') or node_label.startswith('[disj_') or node_label.startswith('[span_')):
               
#                 if connector_list:
#                     A_list.append(connector_list.pop())
#                 connector_list.append(node_label)
#                 connector_ids.append(node_label)
#                 print(f"Connector node found: {node_label}")

#             # Step 3: Handle nouns, ingredients, and modifiers
#             if node_type in ['noun', 'ingredient', 'modifier']:
#                 A_list.append(node_label)
#                 print(f"Noun/Ingredient/Modifier node found: {node_label}")

#             # Step 4: Handle measurements and quantities
#             if node_type in ['intensifier','measure', 'unit_value', 'quantity_value','number','quant']:
#                 A_list.append(node_label)
#                 print(f"Measurement/Quantity node found: {node_label}")

#         # Step 5: Add remaining connectors to A_list
#         if connector_list:
#             A_list.extend(connector_list)
#             print(f"\nRemaining connectors added to A_list: {connector_list}")

#         final_filtered_ids = []
#         current_connector = None
#         last_non_connector = None

#         # Step 6: Filter nodes into final list
#         print("\n===== Filtering Nodes into Final List =====")
#         for node_label in A_list:
#             node_label_clean = node_label.strip('[]')
#             node_type = node_info[node_label]['type']
            
#             if node_type in ['conj', 'disj', 'measure','span_dynamic','rate_dynamic']:
#                 print(node_type)
#                 final_filtered_ids.append(f"{node_label}")
#             else:
#                 final_filtered_ids.append(node_label)

#         # Split the first element and handle TAM
       

#         # Generate dependencies
#         dependencies = []
#         last_verb_index = None
#         last_noun_index = None
#         last_mod_index = None

#         # Create mappings
#         relation_to_dep = {rel['relation']: rel['dependency_relation'] for rel in relations_data['relations']}
#         print("\n===== Relation to Dependency Mapping =====")
#         print(relation_to_dep)

       
#         print("\n===== Processing Edges =====")
#         # Initialize a dictionary to store connector-to-relation mappings
#         connector_to_relation = {}

#         for edge in data['edges']:
#             # Case 1: Handle edges where the target starts with 'conj_' or 'disj_'
#             if edge['target'].startswith(('[conj_', '[disj_')):
#                 source_node_id = edge['source']
#                 source_node = next((node for node in data['nodes'] if node['id'] == source_node_id), None)
          
#         # Create mapping for nouns connected to relations
#         noun_relation_deps = {}
#         node_id_to_label = {node['id']: node['attributes']['label'] for node in data['nodes']}

#         # First pass: identify nouns connected to relations, excluding those with spans
#         # ... [Previous code remains the same until edge processing] ...

# # Enhanced edge processing for relations and spans
#         span_connections = {}  # {span_label: {'relation': relation_label, 'measures': [measure_labels]}}
#         noun_measures = {}     # {noun_label: [measure_labels]}

#         for edge in data['edges']:
#             source_node = next(n for n in data['nodes'] if n['id'] == edge['source'])
#             target_node = next(n for n in data['nodes'] if n['id'] == edge['target'])
            
#             # Track relations connected to connectors/spans
#             if source_node['attributes']['node_type'] == 'relation':
#                 if target_node['attributes']['node_type'] in ['conj', 'disj', 'span_dynamic']:
#                     connector_to_relation[target_node['attributes']['label']] = source_node['attributes']['label']
            
#             # Track span connections
#             if target_node['attributes']['node_type'] == 'span_dynamic' or 'rate_dynamic':
#                 span_label = target_node['attributes']['label']
                
#                 # Connection from relation to span
#                 if source_node['attributes']['node_type'] == 'relation':
#                     span_connections.setdefault(span_label, {'relation': None, 'measures': []})
#                     span_connections[span_label]['relation'] = source_node['attributes']['label']
                
#                 # Connection from noun to span
#                 elif source_node['attributes']['node_type'] == 'noun':
                  
#                     for measure_edge in data['edges']:
#                         if measure_edge['source'] == target_node['id']:
#                             measure_node = next(n for n in data['nodes'] if n['id'] == measure_edge['target'])
#                             print(measure_node['attributes']['node_type'])
#                             if measure_node['attributes']['node_type'] == 'measure':

#                                 noun_measures.setdefault(source_node['attributes']['label'], []).append(measure_node['attributes']['label'])
                                

#         # Create label to index mapping
#         label_to_index = {label.strip('[]'): idx+1 for idx, label in enumerate(final_filtered_ids)}

#         # Enhanced dependency generation
#         print("\n===== Generating Dependencies =====")
#         for i, node_label in enumerate(final_filtered_ids):
#             node_label_clean = node_label.strip('[]')
#             # node_label_clean = node_label_clean.strip('[]')
#             node_type = node_info[node_label]['type']
#             node_index = str(i + 1)
#             mod_index= str(i+1)
#             print(node_type)

#             if node_type == 'verb_tam':
#                 dependencies.append("0:main")
#                 last_verb_index = node_index
#                 print(f"Verb+TAM node: {node_label} (Index: {node_index}, Dependency: 0:main)")
#             elif node_type == 'noun':
#                 dependency = '-'
                
#                 # Check if noun is connected to a relation
#                 noun_id = next(node['id'] for node in data['nodes'] if node['attributes']['label'] == node_label_clean)
#                 source_edges = [edge for edge in data['edges'] if edge['target'] == noun_id]
                
#                 for edge in source_edges:
#                     source_node = next(n for n in data['nodes'] if n['id'] == edge['source'])
#                     if source_node['attributes']['node_type'] == 'relation':
#                         relation_label = source_node['attributes']['label']
#                         print(relation_label)
#                         dep_rel = relation_to_dep.get(relation_label, 'rel')
#                         print(dep_rel)
#                         dependency = f"{verb_tam_index}:{dep_rel}"
#                         break  # Take the first found relation

#                 dependencies.append(dependency)
#                 last_noun_index = node_index
#                 print(f"Noun node: {node_label} (Dependency: {dependency})")


#             elif node_type in ['conj', 'disj']:
#                 # Handle conjunctions with relation connections
#                 relation_label = connector_to_relation.get(node_label)
#                 if relation_label:
#                     dep_rel = relation_to_dep.get(relation_label, 'rel')
#                     dependencies.append(f"{verb_tam_index}:{dep_rel}")
#                 else:
#                     dependencies.append(f"{verb_tam_index}:{node_type}")
#                 print(f"Connector node: {node_label} (Dependency: {dependencies[-1]})")

#             elif node_type == 'span_dynamic' or node_type == 'rate_dynamic':
#     # Initialize dependency
#                 source_node_label = None
                
#                 # First, find the edge where target starts with 'span_dynamic'
#                 for edge in data['edges']:
#                     if edge['target'].startswith("span_dynamic") or edge['target'].startswith("rate_dynamic"):
#                         source_node = next(n for n in data['nodes'] if n['id'] == edge['source'])
#                         source_node_label = source_node['attributes']['label']
#                         # Find the span_dynamic node's outgoing connections
#                         span_node_id = edge['target']
                        
#                         # Now find where this span_dynamic node connects to
#                         for next_edge in data['edges']:
#                             if next_edge['source'] == span_node_id:
#                                 intermediate_target = next_edge['target']
#                                 print(f"First level target: {intermediate_target}")
                                
#                                 # Look for the next connection using intermediate_target as source
#                                 final_target = None
#                                 for second_edge in data['edges']:
#                                     if second_edge['source'] == intermediate_target:
#                                         final_target = second_edge['target']
#                                         print(f"Final target found: {final_target}")
#                                         break
                                
#                                 # If no second level connection found, use intermediate_target as final_target
#                                 if final_target is None:
#                                     final_target = intermediate_target
#                                     print(f"No second level connection found, using intermediate as final: {final_target}")
                                
#                                 # Process the final target
#                                 if final_target.startswith('measure_'):
#                                     dep_rel = 'rmeas'
#                                     print(f"Found measurement connection: {span_node_id} -> {final_target}")
#                                 else:
#                                     # If not connected to measurement, use default logic
#                                     if node_label_clean in span_connections:
#                                         relation_label = span_connections[node_label_clean].get('relation')
#                                         dep_rel = relation_to_dep.get(relation_label, 'rel') if relation_label else 'rel'
#                                         print(f"Using relation from span_connections: {dep_rel}")
#                                     else:
#                                         dep_rel = 'meas'
#                                         print(f"No measurement or specific relation found, defaulting to 'mod'")
#                                 break
#                         break
                
#                 if source_node_label:
#                     # Find the index of the source node label in label_to_index
#                     source_index = label_to_index.get(source_node_label, '-')
#                     print(source_index)
#                     if source_index != '-':
#                         dependencies.append(f"{source_index}:{dep_rel}")
#                     else:
#                         dependencies.append(f"{verb_tam_index}:{dep_rel}")
#                     print(f"Final dependency for {source_node_label}: {dependencies[-1]}")
           
#                 else:
#                     dependencies.append('-')
#                     print("No source node found for span_dynamic")
            
#             elif node_type == 'measure':
#                 # Find connected noun through span
#                 print(data['edges'])
#                 print(node_label_clean)
#                 measure_source = next(
#         (edge['source'] for edge in data['edges'] if edge['target'].startswith('rmeas')), 
#         None
#     )
    
                
#                 connected_noun = next((noun for noun, measures in noun_measures.items() 
#                                     if node_label_clean in measures), None)
            
#                 if connected_noun:
#                     noun_idx = label_to_index.get(connected_noun)
#                     dependencies.append(f"{noun_idx}:rmeas" if noun_idx else '-')
#                 print(measure_source)
#                 if measure_source:
#         # Find the corresponding node in data['nodes']
#                     source_node = next((node for node in data['nodes'] if node['id'] == measure_source), None)
#                     print(source_node)
                    
#                     # if source_node and source_node['attributes']['label'].startswith('noun'):
#                     noun_label = source_node['attributes']['label']
#                     noun_idx = label_to_index.get(noun_label)
                    
#                     if noun_idx:
#                         dependencies.append(f"{noun_idx}:rmeas")
                    
            
#                 else:
#                     dependencies.append('-')
#                 print(f"Measure node: {node_label} (Dependency: {dependencies[-1]})")
#             elif node_type == 'number':
#                 # Find connected noun through span
#                 print(data['edges'])
#                 print(node_label_clean)
#                 measure_source = next(
#         (edge['source'] for edge in data['edges'] if edge['target'].startswith('num')), 
#         None
#     )
    
                
#                 connected_noun = next((noun for noun, measures in noun_measures.items() 
#                                     if node_label_clean in measures), None)
            
#                 if connected_noun:
#                     noun_idx = label_to_index.get(connected_noun)
#                     dependencies.append(f"{noun_idx}:card" if noun_idx else '-')
#                 print(measure_source)
#                 if measure_source:
#         # Find the corresponding node in data['nodes']
#                     source_node = next((node for node in data['nodes'] if node['id'] == measure_source), None)
#                     print(source_node)
                    
#                     # if source_node and source_node['attributes']['label'].startswith('noun'):
#                     noun_label = source_node['attributes']['label']
#                     noun_idx = label_to_index.get(noun_label)
                    
#                     if noun_idx:
#                         dependencies.append(f"{noun_idx}:card")
                    
            
#                 else:
#                     dependencies.append('-')
#                 print(f"Measure node: {node_label} (Dependency: {dependencies[-1]})")

#             elif node_type == 'quant':
#                 # Find connected noun through span
#                 print(data['edges'])
#                 print(node_label_clean)
#                 measure_source = next(
#         (edge['source'] for edge in data['edges'] if edge['target'].startswith('quan')), 
#         None
#     )
    
                
#                 connected_noun = next((noun for noun, measures in noun_measures.items() 
#                                     if node_label_clean in measures), None)
            
#                 if connected_noun:
#                     noun_idx = label_to_index.get(connected_noun)
#                     dependencies.append(f"{noun_idx}:quant" if noun_idx else '-')
#                 print(measure_source)
#                 if measure_source:
#         # Find the corresponding node in data['nodes']
#                     source_node = next((node for node in data['nodes'] if node['id'] == measure_source), None)
#                     print(source_node)
                    
#                     # if source_node and source_node['attributes']['label'].startswith('noun'):
#                     noun_label = source_node['attributes']['label']
#                     noun_idx = label_to_index.get(noun_label)
                    
#                     if noun_idx:
#                         dependencies.append(f"{noun_idx}:quant")
                    
            
#                 else:
#                     dependencies.append('-')
#                 print(f"Measure node: {node_label} (Dependency: {dependencies[-1]})")



#             elif node_type == 'modifier':
            
#                 if last_noun_index:
#                     dependencies.append(f"{last_noun_index}:mod")
#                 else:
#                     dependencies.append('-')
#                 print(f"Modifier node: {node_label} (Dependency: {dependencies[-1]})")
#                 last_mod_index = mod_index
#             elif node_type == "intensifier":
#                 if last_mod_index:
#                     dependencies.append(f"{last_mod_index}:intf")
#                 else:
#                     dependencies.apped('-')
#                 print("intensidier node:{node_label} (Dependency: -)")

#             else:
#                 dependencies.append('-')
#                 print(f"Other node: {node_label} (Dependency: -)")

# # ... [Remaining code stays the same] ...
#         # Process component values
#         label_to_index = {label: idx + 1 for idx, label in enumerate(final_filtered_ids)}
#         component_values = ['-'] * len(final_filtered_ids)
        

#         # Process components for nouns and values
#         for idx, node_label in enumerate(final_filtered_ids):
#             node_label_clean = node_label.strip('[]')
#             node_type = node_info[node_label]['type']
            
#             if node_type == 'noun':
#                 noun_id = next(node['id'] for node in data['nodes'] if node['attributes']['label'] == node_label_clean)
#                 source_edges = [edge for edge in data['edges'] if edge['target'] == noun_id]
                
#                 if source_edges:
#                     source_id = source_edges[0]['source']
#                     source_label = node_id_to_label.get(source_id)
#                     print("sr",source_label)
                    
#                     if source_label:
#                         conj_edges = [edge for edge in data['edges'] if edge['target'] == source_id]
#                         # print(conj_edges)
                        
#                         if conj_edges:
#                             conj_id = conj_edges[0]['source']
#                             conj_label = node_id_to_label.get(conj_id)
#                             print(conj_label)
                            
#                             if  (conj_label.startswith('[conj_') or conj_label.startswith('[disj_')) or (conj_label.startswith('[span_')):
#                                 conj_index = label_to_index.get(f"{conj_label}")
#                                 # print(conj_index)
#                                 if conj_index:
#                                     component_values[idx] = f"{conj_index}:{source_label}"
                        

#             elif node_type == 'quantity_value':
#                 quantity_id = next(node['id'] for node in data['nodes'] if node['attributes']['label'] == node_label_clean)
#                 source_edges = [edge for edge in data['edges'] if edge['target'] == quantity_id]
#                 print("qi",quantity_id)
#                 print(source_edges)
                
#                 if source_edges:
#                     source_id = source_edges[0]['source']
#                     source_label = node_id_to_label.get(source_id)
#                     print(source_id)
#                     print(source_label)
                   
                    
#                     if source_label:
#                         measure_edges = [edge for edge in data['edges'] if edge['target'] == source_id]
#                         print(measure_edges)
                        
#                         if measure_edges:
#                             measure_id = measure_edges[0]['source']
#                             measure_label = node_id_to_label.get(measure_id)
                           
                            
#                             if measure_label:
#                                 measure_index = label_to_index.get(f"{measure_label}")
    
#                                 if measure_index:
#                                     component_values[idx] = f"{measure_index}:count"

#             elif node_type == 'unit_value':
#                 unit_id = next(node['id'] for node in data['nodes'] if node['attributes']['label'] == node_label)
#                 source_edges = [edge for edge in data['edges'] if edge['target'] == unit_id]
                
#                 if source_edges:
#                     # Find the nearest preceding measurement node
#                     current_idx = idx
#                     nearest_meas_index = None
                    
#                     # Search backwards through the sequence until we find a measurement
#                     while current_idx >= 0:
#                         prev_label = final_filtered_ids[current_idx]
#                         if prev_label.startswith('[meas_'):
#                             nearest_meas_index = label_to_index.get(prev_label)
#                             break
#                         current_idx -= 1
                    
#                     if nearest_meas_index is not None:
#                         component_values[idx] = f"{nearest_meas_index}:unit"
#             elif node_type == 'measure':
                    
#                     measure_id = next(node['id'] for node in data['nodes'] if node['attributes']['label'] == node_label)
                    
#                     # Find edges targeting this measure node
#                     incoming_edges = [edge for edge in data['edges'] if edge['target'] == measure_id]
                    
#                     if incoming_edges:
#                         source_id = incoming_edges[0]['source']
#                         source_label = node_id_to_label.get(source_id)
                        
#                         if source_label:
#                             # Find what this start/end node is connected to
#                             parent_edges = [edge for edge in data['edges'] if edge['target'] == source_id]
                            
#                             if parent_edges:
#                                 parent_id = parent_edges[0]['source']
#                                 parent_label = node_id_to_label.get(parent_id)
                                
#                                 if parent_label:
#                                     parent_index = label_to_index.get(f"{parent_label}")
#                                     print(parent_index)
#                                     print(parent_label)
#                                     print(source_label)
                                    
#                                     # Check if source is start or end node
#                                     if 'start' in source_label.lower():
#                                         component_values[idx] = f"{parent_index}:start"
#                                     elif 'end' in source_label.lower():
#                                         component_values[idx] = f"{parent_index}:end"
#                                     elif 'unit_every' in source_label.lower():
#                                         component_values[idx] = f"{parent_index}:unit_every"
#                                     elif 'unit_value' in source_label.lower():
#                                         component_values[idx] = f"{parent_index}:unit_value"

#         print(component_values)
#         sentence = " ".join(final_filtered_ids)
#         sentence = re.sub(r'\[.*?\]', '', sentence)
#         sentence = sentence.replace('_1', '')
#         sentence = re.sub(r'\d+', '', sentence)

#         # Convert to Hindi if needed
#         def convert_to_hindi(final_filtered_ids):
#             wx = WXC(order='wx2utf', lang='hin')
#             wx1 = WXC(order='utf2wx', lang='hin')

#             hindi_text_list = []
#             for word in final_filtered_ids:
#                 fixed_prefixes = ('[meas', '[conj', '[disj', '[span', '[rate')
#                 numeric_prefixes = tuple(str(i) for i in range(10))
#                 if word.startswith(fixed_prefixes + numeric_prefixes):
#     # your code here

#                     hindi_text_list.append(word)
#                 else:
#                     parts = word.split('-', 1)  # Split only at the first occurrence of '-'
#                     if len(parts) == 2:
#                         converted_left = wx1.convert(parts[0])  # Convert only the left part
#                         hindi_text_list.append(f"{converted_left}_1-{parts[1]}")
#                     else:
#                         hindi_text_list.append(wx1.convert(word)+"_1")

#             return hindi_text_list
#         first_element = final_filtered_ids[0]
#         split_parts = first_element.split('-')
#         if len(split_parts) == 2:
#             verb_base = split_parts[0]
#             tam = split_parts[1]
            
#             if tam == "imper_1":
#                 final_filtered_ids[0] = f"{verb_base}-imper_1"
#             elif tam == "es_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_hE_1"
#             elif tam == "pres":
#                 final_filtered_ids[0] = f"{verb_base}-hE_1-pres"
#             elif tam == "ing_is_1":
#                 final_filtered_ids[0] = f"{verb_base}-0_rahA_hE_1"
#             elif tam == "en_have_1":
#                 final_filtered_ids[0] = f"{verb_base}-yA_hE_1"
#             elif tam == "ing_have_been_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_rahA_hE_1"
#             elif tam == "ing_keep_on_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_rahawA_hE_1"
#             elif tam == "ed_1":
#                 final_filtered_ids[0] = f"{verb_base}-yA_1"
#             elif tam == "past":
#                 final_filtered_ids[0] = f"{verb_base}-hE_1-past"
#             elif tam == "ing_was_1":
#                 final_filtered_ids[0] = f"{verb_base}-0_rahA_WA_1"
#             elif tam == "en_had_1":
#                 final_filtered_ids[0] = f"{verb_base}-yA_WA_1"
#             elif tam == "ing_had_been_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_rahA_WA_1"
#             elif tam == "ing_kept_on_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_rahawA_WA_1"
#             elif tam == "0_used_to_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_WA_1"
#             elif tam == "0_will_1":
#                 final_filtered_ids[0] = f"{verb_base}-gA_1"
#             elif tam == "ing_will_be_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_rahegA_1"
#             elif tam == "ing_might_have_been_1":
#                 final_filtered_ids[0] = f"{verb_base}-wA_rahA_hogA_1"
#             elif tam == "ing_might_be_1":
#                 final_filtered_ids[0] = f"{verb_base}-0_rahA_hogA_1"
#             elif tam == "ing_must_be_1":
#                 final_filtered_ids[0] = f"{verb_base}-0_rahA_hogA_2"
#             elif tam == "en_might_have_1":
#                 final_filtered_ids[0] = f"{verb_base}-yA_hogA_1"
#             elif tam == "0_must_1":
#                 final_filtered_ids[0] = f"{verb_base}-nA_hE_1"
#             elif tam == "0_was_supposed_to":
#                 final_filtered_ids[0] = f"{verb_base}-nA_WA_1"
#             elif tam == "0_shall_1":
#                 final_filtered_ids[0] = f"{verb_base}-nA_hogA_1"
#             elif tam == "0_ought_to_1":
#                 final_filtered_ids[0] = f"{verb_base}-nA_hE_1+hI_1"
#             elif tam == "0_have_to_1":
#                 final_filtered_ids[0] = f"{verb_base}-nA_padZawA_hE_1"
#             elif tam == "0_had_to_1":
#                 final_filtered_ids[0] = f"{verb_base}-nA_padZA_1"
#             elif tam == "0_had_to_2":
#                 final_filtered_ids[0] = f"{verb_base}-nA_padZawA_WA_1"
#             elif tam == "0_will_have_to_3":
#                 final_filtered_ids[0] = f"{verb_base}-nA_padZegA_1"
#             elif tam == "0_must_have_had_to_1":
#                 final_filtered_ids[0] = f"{verb_base}-nA_padZA_hogA_1"
#             elif tam == "0_should_1":
#                 final_filtered_ids[0] = f"{verb_base}-nA_cAhiye_1"
#             elif tam == "0_can_1":
#                 final_filtered_ids[0] = f"{verb_base}-0_sakawA_hE_1"  # or sakawA_1
#             elif tam == "0_could_1":
#                 final_filtered_ids[0] = f"{verb_base}-0_sakawA_WA_1"
#             elif tam == "0_could_2":
#                 final_filtered_ids[0] = f"{verb_base}-0_sakA_1"
#             elif tam == "o_1":
#                 final_filtered_ids[0] = f"{verb_base}-o_1"
#             elif tam == "o_2":
#                 final_filtered_ids[0] = f"{verb_base}-o_2"
#             elif tam == "e_1":
#                 final_filtered_ids[0] = f"{verb_base}-e_1"
#             else:
#                 final_filtered_ids[0] = verb_base

                
#             original_node_label = f"{verb_base}-{tam}"
#             if original_node_label in node_info:
#                 if tam == "imperative":
#                     node_info[f"{verb_base}-imper_1"] = node_info[original_node_label]
#                 node_info[verb_base] = node_info[original_node_label]
#                 node_info[tam] = {"type": "verb_tam_suffix" if node_info[original_node_label]["type"] == "verb_tam" else "other"}

#         print(f"TAM part: {tam}")
#         print("\n===== Final Filtered IDs =====")
#         print(final_filtered_ids)
        

#         final_filtered_ids = convert_to_hindi(final_filtered_ids)
#         print("cp",final_filtered_ids)
#         print(dependencies)
#         print(component_values)

       
#             # Create DataFrame
#         df = pd.DataFrame({
#             'concept_data': final_filtered_ids,
#             'index_data': [str(i) for i in range(1, len(final_filtered_ids) + 1)],
#             'semantic_data': ['-'] * len(final_filtered_ids),
#             'gnp_data': ['-'] * len(final_filtered_ids),
#             'dependency_data': dependencies,
#             'discourse_data': ['-'] * len(final_filtered_ids),
#             'skpview_data': ['-'] * len(final_filtered_ids),
#             'scope_data': ['-'] * len(final_filtered_ids),
#             'construction_data': component_values,
#         })

#         # Add TAM row if present
#         if tam:
#             tam_row = pd.DataFrame({
#                 'concept_data': [f"%affirmative"],
#                 'index_data': [''],
#                 'semantic_data': [''],
#                 'gnp_data': [''],
#                 'dependency_data': [''],
#                 'discourse_data': [''],
#                 'skpview_data': [''],
#                 'scope_data': [''],
#                 'construction_data': [''],
#             })
#             df = pd.concat([df, tam_row], ignore_index=True)

#         # Generate output format
#         def generate_sent_id():
#             return f"<sent_id={uuid.uuid4().hex[:4]}a>\n"

#         output_format = generate_sent_id()
#         output_format += f"#{sentence}\n"
        
#         for index, row in df.iterrows():
#             output_format += f"{row['concept_data']}\t{row['index_data']}\t"\
#                            f"{row['semantic_data']}\t{row['gnp_data']}\t"\
#                            f"{row['dependency_data']}\t{row['discourse_data']}\t"\
#                            f"{row['skpview_data']}\t{row['scope_data']}\t"\
#                            f"{row['construction_data']}\n"
        
#         output_format += "</sent_id>"

#         print(output_format)
#         output_format = process_file_cp(output_format)
#         output_format = process_file_nc(output_format)
#         print(output_format)
    
       




#         # Save outputs
#         usr_data = {
#             'recipe_id': recipe_id,
#             'usr_format': output_format,
#             'dataframe': df.to_dict('records'),
#             'created_at': datetime.datetime.utcnow()
#         }
        
#         # Update or insert USR data using the db parameter directly
#         db.usr_collection.update_one(
#             {'recipe_id': recipe_id},
#             {'$set': usr_data},
#             upsert=True
#         )

#         return output_format

#     except Exception as e:
#         print(f"An error occurred in graphtousr: {str(e)}")
#         raise



import json
from fastapi import dependencies
import pandas as pd
from wxconv import WXC
from langdetect import detect
import re
import uuid,datetime
import os 
from cp_cxn import process_file_cp
from nc import process_file_nc

def graphtousr(input_graph, relations_file_path, recipe_id, db):
    """
    Convert graph data to USR format and store in MongoDB
    
    Parameters:
    input_graph: NetworkX graph object
    relations_file_path: Path to relations JSON file
    recipe_id: Recipe identifier
    db: MongoDB database connection
    """
    try:
        # 1. Input validation
        if not recipe_id:
            raise ValueError("Recipe ID must be provided")
        if not input_graph:
            raise ValueError("Input graph must be provided")
        if not relations_file_path:
            raise ValueError("Relations file path must be provided")

        # 2. File validation for relations
        if not os.path.exists(relations_file_path):
            raise FileNotFoundError(f"File not found: {relations_file_path}")
        
        with open(relations_file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                raise ValueError(f"Empty file: {relations_file_path}")
            try:
                relations_data = json.loads(content)
                if not relations_data.get('relations'):
                    raise ValueError("Relations data must contain 'relations' array")
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON in file: {relations_file_path}")

        # Convert NetworkX graph to required format
        data = {'nodes': [], 'edges': []}
        
        # Add nodes
        for node, attrs in input_graph.nodes(data=True):
            data['nodes'].append({
                'id': node,
                'attributes': attrs
            })
        print("input_graph nodes:", data['nodes'])
            
        # Add edges
        for source, target, attrs in input_graph.edges(data=True):
            data['edges'].append({
                'source': source,
                'target': target,
                'attributes': attrs
            })
        print("input_graph edges:", data['edges'])
            

        # ------------------ PREPARATION ------------------
        A_list = []          # ordered labels we care about (internal labels)
        verb_processed = False
        connector_list = []  # conj/disj/span/rate labels
        connector_ids = []
        node_info = {}       # internal_label -> {'type': node_type, ...}
        verb_tam_index = None
        tam = None

        # temporal meta: each is {'count_internal','unit_internal','marker_label',
        #                         'count_display','unit_display'}
        temporals_meta = []  

        print("\n===== Processing Nodes =====")
        for node in data['nodes']:
            node_type = node['attributes'].get('node_type')
            node_label = node['attributes'].get('label')

            # internal label for normal nodes is just the label
            internal_label = node_label
            node_info[internal_label] = {'type': node_type, 'display': node_label}

            # 1) verb_tam (Primary and Secondary)
            if node_type == 'verb_tam':
                A_list.append(internal_label)
                if not verb_processed:
                    verb_processed = True
                    verb_tam_index = len(A_list)
                print(f"Verb+TAM node found: {node_label}")

            # 2) connectors
            elif node_type in ['conj', 'disj', 'span_dynamic', 'rate_dynamic'] or \
                 (node_label.startswith('[conj_') or node_label.startswith('[disj_') or 
                  node_label.startswith('[span_')):
                if connector_list:
                    A_list.append(connector_list.pop())
                connector_list.append(internal_label)
                connector_ids.append(internal_label)
                print(f"Connector node found: {node_label}")

            # 3) nouns, ingredients, modifiers
            elif node_type in ['noun', 'ingredient', 'modifier']:
                A_list.append(internal_label)
                print(f"Noun/Ingredient/Modifier node found: {node_label}")

            # 4) measurements & quantities (meas node, quantity_value, unit_value, number, quant)
            elif node_type in ['intensifier', 'measure', 'unit_value',
                               'quantity_value', 'number', 'quant']:
                A_list.append(internal_label)
                print(f"Measurement/Quantity node found: {node_label}")

            # 5) mod (structural)
            elif node_type == 'mod':
                print(f"Mod node found: {node_label}")

            # temporal nodes: handled later (we don't add them yet)

        # Add remaining connectors
        if connector_list:
            A_list.extend(connector_list)
            print(f"\nRemaining connectors added to A_list: {connector_list}")

        # ------------------ BASE ORDERED LABELS (INTERNAL) ------------------
        final_internal_ids = []
        print("\n===== Filtering Nodes into Final List =====")
        # ------------------ FINAL INTERNAL IDS ------------------
        final_internal_ids = A_list.copy()  # copy A_list first

        # ------------------ TOOL HANDLING ------------------
        # ------------------ TOOL EXTRACTION FROM GRAPH EDGES ------------------
        # ------------------ TOOL HANDLING (CORRECTED) ------------------
                # ------------------ TOOL HANDLING (EXTRACT FROM EDGES) ------------------
        # We find edges like: relation_tool_X  ->  tool_<name>_id
        tool_edges = []
        for source, target, attrs in input_graph.edges(data=True):
            s = str(source)
            t = str(target)
            # relation node names usually contain "relation_tool" and tools start with "tool_"
            if "relation_tool" in s and t.startswith("tool_"):
                tool_edges.append((s, t))

        tool_counter = 1
        for rel_node_id, tool_node_id in tool_edges:
            # get tool display name (strip "tool_" prefix and trailing uid)
            tool_name = str(tool_node_id).replace("tool_", "").rsplit("_", 1)[0]

            internal_label_tool = f"{tool_name}__{tool_counter}"
            tool_counter += 1

            # add to final ordered ids
            final_internal_ids.append(internal_label_tool)

            # find the relation node object in data['nodes'] to get actual relation label text
            rel_node_obj = next((n for n in data['nodes'] if n['id'] == rel_node_id), None)
            relation_label_text = None
            if rel_node_obj:
                relation_label_text = rel_node_obj['attributes'].get('label')

            # register tool in node_info with the actual relation label (if found)
            node_info[internal_label_tool] = {
                "type": "tool",
                "display": tool_name,
                "relation_label": relation_label_text  # e.g. "Where - कहां"
            }


        # ------------------ TEMPORAL HANDLING ------------------
        # From temporal nodes in the graph (node_type == 'temporal'),
        # we add:  count, unit, [temporal_k]
        #
        # Example:
        #   "for 5 minutes" ->  count_display="5", unit_display="minutes"
        #   internal ids: "__tcount_1__", "__tunit_1__", "[temporal_1]"
        #   dependencies:
        #       [temporal_1] -> verb:dur
        #   construction:
        #       "5"       -> [temporal_1]:count
        #       "minutes" -> [temporal_1]:unit
        


        temporal_nodes = [
            n for n in data['nodes']
            if n['attributes'].get('node_type') == 'temporal'
        ]

        temporal_counter = 1
        for t_node in temporal_nodes:
            t_id = t_node['id']
            t_attrs = t_node['attributes']
            t_label = (t_attrs.get('label') or '').strip()
            semantic = t_attrs.get('semanticCategory', '')
            morpho = t_attrs.get('morphoSemantic', '')

            # 🔍 Find the relation label (e.g., dur, k7t)
            rel_label = "dur"  # fallback
            for edge in data['edges']:
                if edge['target'] == t_id:
                    source_id = edge['source']
                    source_node = next((n for n in data['nodes'] if n['id'] == source_id), None)
                    if source_node and source_node['attributes'].get('node_type') == 'relation':
                        rel_label = source_node['attributes'].get('label', 'dur')
                        break

            parts = t_label.split()
            count_display = None
            unit_display = None

            # Find first numeric token
            for p in parts:
                if p.isdigit():
                    count_display = p
                    break

            if count_display:
                # Basic parsing: assume "for X units" or "X units"
                # If "for X units", parts are ["for", "X", "units"]
                # We try to find the unit (usually the last word)
                unit_display = parts[-1] if len(parts) > 1 else ''
                
                count_internal = f"__tcount_{temporal_counter}__"
                unit_internal  = f"__tunit_{temporal_counter}__"
                marker_label   = f"[temporal_{temporal_counter}]"

                final_internal_ids.append(count_internal)
                final_internal_ids.append(unit_internal)
                final_internal_ids.append(marker_label)

                node_info[count_internal] = {'type': 'temporal_count', 'display': count_display}
                node_info[unit_internal]  = {'type': 'temporal_unit', 'display': unit_display}
                node_info[marker_label]   = {
                    'type': 'temporal_marker', 
                    'display': marker_label,
                    'rel_label': rel_label,
                    'semantic': semantic,
                    'morpho': morpho
                }

                temporals_meta.append({
                    'count_internal': count_internal,
                    'unit_internal': unit_internal,
                    'marker_label': marker_label,
                    'count_display': count_display,
                    'unit_display': unit_display
                })
            else:
                # Non-numeric temporal (e.g., "until golden", "today")
                marker_label = f"[temporal_{temporal_counter}]"
                final_internal_ids.append(marker_label)
                node_info[marker_label] = {
                    'type': 'temporal_marker',
                    'display': t_label,
                    'rel_label': rel_label,
                    'semantic': semantic,
                    'morpho': morpho
                }

            temporal_counter += 1

        # recompute verb index from final_internal_ids (safe)
        if verb_processed:
            verb_internal = next(
                lbl for lbl, info in node_info.items()
                if info['type'] == 'verb_tam'
            )
            verb_tam_index = final_internal_ids.index(verb_internal) + 1

        # ------------------ DEPENDENCIES (RELATION COLUMN) ------------------
        dependencies = []

        relation_to_dep = {
            rel['relation']: rel['dependency_relation']
            for rel in relations_data['relations']
        }
        print("\n===== Relation to Dependency Mapping =====")
        print(relation_to_dep)

        connector_to_relation = {}
        node_id_to_label = {node['id']: node['attributes']['label'] for node in data['nodes']}
        span_connections = {}
        noun_measures = {}

        # pre-process edges for spans/connectors
        for edge in data['edges']:
            source_node = next(n for n in data['nodes'] if n['id'] == edge['source'])
            target_node = next(n for n in data['nodes'] if n['id'] == edge['target'])
            
            if source_node['attributes'].get('node_type') == 'relation':
                if target_node['attributes'].get('node_type') in ['conj', 'disj', 'span_dynamic']:
                    connector_to_relation[target_node['attributes']['label']] = source_node['attributes']['label']
            
            if target_node['attributes'].get('node_type') in ['span_dynamic', 'rate_dynamic']:
                span_label = target_node['attributes']['label']
                if source_node['attributes'].get('node_type') == 'relation':
                    span_connections.setdefault(span_label, {'relation': None, 'measures': []})
                    span_connections[span_label]['relation'] = source_node['attributes']['label']
                elif source_node['attributes'].get('node_type') == 'noun':
                    for measure_edge in data['edges']:
                        if measure_edge['source'] == target_node['id']:
                            measure_node = next(n for n in data['nodes'] if n['id'] == measure_edge['target'])
                            if measure_node['attributes'].get('node_type') == 'measure':
                                noun_measures.setdefault(source_node['attributes']['label'], []).append(measure_node['attributes']['label'])

        # mapping for dependency index resolution (strip [] for connectors)
        label_to_index_dep = {label.strip('[]'): idx+1
                              for idx, label in enumerate(final_internal_ids)}

        def get_parent_info(node_label_internal):
            """Find which verb or connector points to this node and with what relation"""
            node_id = next((n['id'] for n in data['nodes'] if n['attributes'].get('label') == node_label_internal), None)
            if not node_id:
                return verb_tam_index, "rel"
                
            incoming = [e for e in data['edges'] if e['target'] == node_id]
            for e in incoming:
                src_id = e['source']
                src_node = next((n for n in data['nodes'] if n['id'] == src_id), None)
                if not src_node: continue
                
                s_type = src_node['attributes'].get('node_type')
                s_label = src_node['attributes'].get('label')
                
                if s_type == 'verb_tam':
                    return label_to_index_dep.get(s_label, verb_tam_index), "rel"
                
                if s_type == 'option':
                    # Noun -> Option (op1) -> Conj
                    c_edge = next((e2 for e2 in data['edges'] if e2['target'] == src_id), None)
                    if c_edge:
                        c_node = next((n for n in data['nodes'] if n['id'] == c_edge['source']), None)
                        if c_node and c_node['attributes'].get('node_type') in ['conj', 'disj']:
                            c_label = c_node['attributes'].get('label')
                            return label_to_index_dep.get(c_label.strip('[]'), verb_tam_index), s_label

                if s_type == 'relation':
                    v_edge = next((e2 for e2 in data['edges'] if e2['target'] == src_id), None)
                    if v_edge:
                        v_node = next((n for n in data['nodes'] if n['id'] == v_edge['source']), None)
                        if v_node and v_node['attributes'].get('node_type') == 'verb_tam':
                            v_label = v_node['attributes'].get('label')
                            return label_to_index_dep.get(v_label, verb_tam_index), relation_to_dep.get(s_label, "rel")
            return verb_tam_index, "rel"

        print("\n===== Generating Dependencies =====")
        for i, internal_label in enumerate(final_internal_ids):
            info = node_info[internal_label]
            node_type = info['type']
            node_index = str(i + 1)

            # -----------------------------------------
            # 1) temporal count / unit nodes => NO dependency
            if node_type in ['temporal_count', 'temporal_unit']:
                dependencies.append('-')
                print(f"Temporal Count/Unit node: {internal_label} (Dependency forced to '-')")
                continue

            # -----------------------------------------
            # 2) Temporal marker
            if node_type == 'temporal_marker':
                p_idx, p_rel = get_parent_info(internal_label)
                rel_code = info.get('rel_label', p_rel)
                dependencies.append(f"{p_idx}:{rel_code}")
                print(f"Temporal marker: {internal_label} (Dependency: {dependencies[-1]})")
                continue

            # -----------------------------------------
            # 3) Verb
            if node_type == 'verb_tam':
                if i + 1 == verb_tam_index:
                    dependencies.append("0:main")
                else:
                    p_idx, p_rel = get_parent_info(internal_label)
                    dependencies.append(f"{p_idx}:{p_rel}")
                print(f"Verb+TAM node: {internal_label} (Dependency: {dependencies[-1]})")
                continue

            # -----------------------------------------
            # 4) Noun
            # -----------------------------------------
            # Tool Dependency
            if node_type == 'tool':
                rel_label = info.get('relation_label') or ""
                dep_code = None
                try:
                    for k, v in relation_to_dep.items():
                        k_low = k.lower()
                        rel_low = rel_label.lower()
                        if k_low in rel_low or rel_low in k_low or \
                           (len(rel_low.split()) > 0 and k_low.startswith(rel_low.split()[0])):
                            dep_code = v
                            break
                except NameError:
                    dep_code = None
                if not dep_code:
                    dep_code = relation_to_dep.get("Where - कहां") if isinstance(relation_to_dep, dict) else None
                if not dep_code:
                    dep_code = "k7p"
                
                p_idx, _ = get_parent_info(internal_label)
                dependencies.append(f"{p_idx}:{dep_code}")
                continue
            
            if node_type in ['noun', 'ingredient']:
                p_idx, dep_rel = get_parent_info(internal_label)
                dependencies.append(f"{p_idx}:{dep_rel}")
                info['skpview'] = 'def'
                continue

            # -----------------------------------------
            # 5) Connectors (conj/disj)
            # -----------------------------------------
            if node_type in ['conj', 'disj']:
                p_idx, dep_rel = get_parent_info(internal_label)
                dependencies.append(f"{p_idx}:{dep_rel}")
                print(f"Connector node: {internal_label} (Dependency: {dependencies[-1]})")
                continue

            # -----------------------------------------
            # 6) span_dynamic / rate_dynamic (keep your existing behaviour)
            # -----------------------------------------
            if node_type in ['span_dynamic', 'rate_dynamic']:
                # simplified: attach to verb with meas, unless span_connections says otherwise
                span_label_clean = info['display'].strip('[]')
                relation_label = None
                if span_label_clean in span_connections:
                    relation_label = span_connections[span_label_clean].get('relation')
                if relation_label:
                    dep_rel = relation_to_dep.get(relation_label, 'rel')
                else:
                    dep_rel = 'meas'
                dependencies.append(f"{verb_tam_index}:{dep_rel}")
                continue

            # -----------------------------------------
            # 7) measure nodes: attach to noun via rmeas if possible
            # -----------------------------------------
            # -----------------------------------------
            # 7) measure nodes: attach to noun via rmeas if possible
            # -----------------------------------------
            if node_type == 'measure':
                # find a noun parent via rmeas
                # look for an rmeas node pointing to this measure in the graph,
                # then a noun pointing to that rmeas
                measure_label = info['display']
                # find measure node id
                meas_id = next(
                    node['id'] for node in data['nodes']
                    if node['attributes']['label'] == measure_label
                    and node['attributes']['node_type'] == 'measure'
                )
                incoming_edges = [e for e in data['edges'] if e['target'] == meas_id]
                noun_label = None
                for e in incoming_edges:
                    source_id = e['source']
                    source_node = next(n for n in data['nodes'] if n['id'] == source_id)
                    if source_node['attributes'].get('node_type') == 'rmeas':
                        # find noun -> rmeas
                        rmeas_id = source_id
                        for e2 in data['edges']:
                            if e2['target'] == rmeas_id:
                                source2 = next(n for n in data['nodes'] if n['id'] == e2['source'])
                                if source2['attributes'].get('node_type') == 'noun':
                                    noun_label = source2['attributes']['label']
                                    break
                if noun_label:
                    noun_idx = label_to_index_dep.get(noun_label.strip('[]'))
                    if noun_idx:
                        dependencies.append(f"{noun_idx}:rmeas")
                    else:
                        dependencies.append('-')
                else:
                    dependencies.append('-')
                print(f"Measure node: {internal_label} (Dependency: {dependencies[-1]})")
                continue

            # -----------------------------------------
            # 7b) measurement value nodes: attach to measure node via count/unit
            # -----------------------------------------
            if node_type in ['quantity_value', 'unit_value', 'number', 'quant']:
                val_display = info['display']
                val_node_id = next(
                    (node['id'] for node in data['nodes'] 
                     if node['attributes']['label'] == val_display and node['attributes']['node_type'] == node_type),
                    None
                )
                if val_node_id:
                    # find ancestor handle (quantity/unit/card/quant_label) then its parent (measure or noun)
                    incoming = [e for e in data['edges'] if e['target'] == val_node_id]
                    if incoming:
                        mid_node_id = incoming[0]['source']
                        # Now find measure/noun -> mid_node
                        parent_edges = [e for e in data['edges'] if e['target'] == mid_node_id]
                        if parent_edges:
                            parent_id = parent_edges[0]['source']
                            parent_node = next(n for n in data['nodes'] if n['id'] == parent_id)
                            parent_label = parent_node['attributes']['label']
                            parent_idx = label_to_index_dep.get(parent_label.strip('[]'))
                            
                            if node_type in ['quantity_value', 'quant']:
                                dep_rel = 'count'
                            elif node_type in ['unit_value', 'number']:
                                dep_rel = 'unit'
                            else:
                                dep_rel = 'rel'

                            if parent_idx:
                                dependencies.append(f"{parent_idx}:{dep_rel}")
                                continue
                dependencies.append('-')
                continue

            # -----------------------------------------
            # 8) modifier / intensifier / mod (structure)
            # -----------------------------------------
            if node_type == 'modifier':
                # Check for "dry" and its connection to a noun
                mod_display = info.get('display', '').lower()
                if 'dry' in mod_display:
                    # Find if it's connected to a noun
                    mod_id = next(
                        (node['id'] for node in data['nodes'] 
                         if node['attributes']['label'] == info['display'] and node['attributes']['node_type'] == 'modifier'),
                        None
                    )
                    if mod_id:
                        source_edges = [edge for edge in data['edges'] if edge['target'] == mod_id]
                        if source_edges:
                            source_id = source_edges[0]['source']
                            source_node = next(n for n in data['nodes'] if n['id'] == source_id)
                            if source_node['attributes'].get('node_type') in ['noun', 'ingredient']:
                                noun_label = source_node['attributes']['label']
                                noun_idx = label_to_index_dep.get(noun_label.strip('[]'))
                                if noun_idx:
                                    dependencies.append(f"{noun_idx}:krvn")
                                    print(f"Modifier node (dry): {internal_label} (Dependency: {dependencies[-1]})")
                                    continue

                dependencies.append(f"{verb_tam_index}:mod")
                continue

            if node_type == 'intensifier':
                dependencies.append('-')
                continue

            if node_type == 'mod':
                # if parent is verb_tam => verb:mod
                mod_display = info['display']
                mod_id = next(
                    node['id'] for node in data['nodes']
                    if node['attributes']['label'] == mod_display
                    and node['attributes']['node_type'] == 'mod'
                )
                source_edges = [edge for edge in data['edges'] if edge['target'] == mod_id]
                if source_edges:
                    source_id = source_edges[0]['source']
                    source_node = next(n for n in data['nodes'] if n['id'] == source_id)
                    if source_node['attributes'].get('node_type') == 'verb_tam':
                        dependencies.append(f"{verb_tam_index}:mod")
                    else:
                        dependencies.append('-')
                else:
                    dependencies.append('-')
                continue

            # -----------------------------------------
            # 9) anything else
            # -----------------------------------------
            dependencies.append('-')

        # ---------------- COMPONENT VALUES (CONSTRUCTION COLUMN) ----------------
        label_to_index = {label: idx + 1 for idx, label in enumerate(final_internal_ids)}
        component_values = ['-'] * len(final_internal_ids)

        for idx, internal_label in enumerate(final_internal_ids):
            info = node_info[internal_label]
            node_type = info['type']

            # 🔄 Connector Construction: [conj_X] -> opt1,opt2
            if node_type in ['conj', 'disj']:
                c_id = next((n['id'] for n in data['nodes'] if n['attributes'].get('label') == internal_label), None)
                if c_id:
                    options = []
                    outgoing = [e for e in data['edges'] if e['source'] == c_id]
                    for e in outgoing:
                        target_node = next((n for n in data['nodes'] if n['id'] == e['target']), None)
                        if target_node and target_node['attributes'].get('node_type') == 'option':
                            options.append(target_node['attributes']['label'])
                    if options:
                        component_values[idx] = ",".join(sorted(options))

            # noun construction (unchanged style, mostly for conj/span etc.)
            if node_type == 'noun':
                noun_display = info['display']
                noun_id = next(
                    node['id'] for node in data['nodes']
                    if node['attributes']['label'] == noun_display
                    and node['attributes']['node_type'] == 'noun'
                )
                source_edges = [edge for edge in data['edges'] if edge['target'] == noun_id]
                if source_edges:
                    source_id = source_edges[0]['source']
                    source_label = node_id_to_label.get(source_id)
                    if source_label:
                        conj_edges = [edge for edge in data['edges'] if edge['target'] == source_id]
                        if conj_edges:
                            conj_id = conj_edges[0]['source']
                            conj_label = node_id_to_label.get(conj_id)
                            if conj_label and (conj_label.startswith('[conj_') or
                                               conj_label.startswith('[disj_') or
                                               conj_label.startswith('[span_')):
                                conj_index = label_to_index.get(conj_label)
                                if conj_index:
                                    component_values[idx] = f"{conj_index}:{source_label}"

            # ingredient quantity_value / quant -> [meas_x]:count
            elif node_type in ['quantity_value', 'quant']:
                # find its measure ancestor
                val_display = info['display']
                val_node_id = next(
                    (node['id'] for node in data['nodes'] 
                     if node['attributes']['label'] == val_display and node['attributes']['node_type'] == node_type),
                    None
                )
                if val_node_id:
                    source_edges = [edge for edge in data['edges'] if edge['target'] == val_node_id]
                    if source_edges:
                        mid_node_id = source_edges[0]['source']  # 'count_simple_*' or 'quantity_*'
                        meas_edges = [e for e in data['edges'] if e['target'] == mid_node_id]
                        if meas_edges:
                            meas_id = meas_edges[0]['source']
                            meas_label = node_id_to_label.get(meas_id)
                            if meas_label:
                                meas_index = label_to_index.get(meas_label)
                                if meas_index:
                                    component_values[idx] = f"{meas_index}:count"

            # ingredient unit_value / number -> [meas_x]:unit (or card)
            elif node_type in ['unit_value', 'number']:
                val_display = info['display']
                val_node_id = next(
                    (node['id'] for node in data['nodes'] 
                     if node['attributes']['label'] == val_display and node['attributes']['node_type'] == node_type),
                    None
                )
                if val_node_id:
                    source_edges = [edge for edge in data['edges'] if edge['target'] == val_node_id]
                    if source_edges:
                        mid_node_id = source_edges[0]['source']
                        meas_edges = [e for e in data['edges'] if e['target'] == mid_node_id]
                        if meas_edges:
                            meas_id = meas_edges[0]['source']
                            meas_label = node_id_to_label.get(meas_id)
                            if meas_label:
                                meas_index = label_to_index.get(meas_label)
                                if meas_index:
                                    component_values[idx] = f"{meas_index}:unit"

            # mod node -> modifier index
            elif node_type == 'mod':
                mod_display = info['display']
                mod_id = next(
                    node['id'] for node in data['nodes']
                    if node['attributes']['label'] == mod_display
                    and node['attributes']['node_type'] == 'mod'
                )
                target_edges = [edge for edge in data['edges'] if edge['source'] == mod_id]
                if target_edges:
                    target_id = target_edges[0]['target']
                    target_node = next(n for n in data['nodes'] if n['id'] == target_id)
                    if target_node['attributes'].get('node_type') == 'modifier':
                        modifier_label = target_node['attributes']['label']
                        modifier_idx = label_to_index.get(modifier_label)
                        if modifier_idx:
                            component_values[idx] = f"{modifier_idx}:mod"

            # TEMPORAL count → [temporal_k]:count
            elif node_type == 'temporal_count':
                # find its temporal cluster
                for t in temporals_meta:
                    if t['count_internal'] == internal_label:
                        marker_label = t['marker_label']
                        marker_idx = label_to_index.get(marker_label)
                        if marker_idx:
                            component_values[idx] = f"{marker_idx}:count"
                        break

            # TEMPORAL unit → [temporal_k]:unit
            elif node_type == 'temporal_unit':
                for t in temporals_meta:
                    if t['unit_internal'] == internal_label:
                        marker_label = t['marker_label']
                        marker_idx = label_to_index.get(marker_label)
                        if marker_idx:
                            component_values[idx] = f"{marker_idx}:unit"
                        break

        print(component_values)

        # ---------------- BUILD SURFACE IDS (what user sees) ----------------
        # internal ids for temporal count/unit are replaced by display strings
        # Build surface_ids for USR table (include temporals and tools)
        surface_ids = []
        for internal_label in final_internal_ids:
            info = node_info[internal_label]
            node_type = info['type']
            surface_ids.append(info['display'])

        # --- Include tools explicitly if not already present ---
        tools_list = input_graph.graph.get('tools', [])
        for t in tools_list:
            tool_name = t.get('tool')
            if tool_name and tool_name not in surface_ids:
                surface_ids.append(tool_name)


        # build sentence comment (just surface string)
        sentence = " ".join(surface_ids)
        sentence = re.sub(r'\[.*?\]', '', sentence)
        sentence = sentence.replace('_1', '')
        sentence = re.sub(r'\d+', '', sentence)

        # ---------------- HINDI CONVERSION ----------------
        def convert_to_hindi(surface_ids):
            from wxconv import WXC
            wx1 = WXC(order='utf2wx', lang='hin')
            hindi_text_list = []
            
            # Words that require "until" prefix in output
            until_worthy_words = {
                "golden", "brown", "cooked", "boiling", "soft", 
                "aromatic", "fragrant", "smooth", "soften"
            }

            for word in surface_ids:
                fixed_prefixes = ('[meas', '[conj', '[disj', '[span', '[rate', '[temporal')
                numeric_prefixes = tuple(str(i) for i in range(10))
                
                if word.startswith(fixed_prefixes + numeric_prefixes):
                    hindi_text_list.append(word)
                else:
                    # Check for words needing "until" prefix
                    check_word = word.lower().strip()
                    if check_word in until_worthy_words:
                        # Add untill- prefix if not present (using 'until' as per user request)
                        word = f"until-{word}"
                    
                    parts = word.split('-', 1)
                    if len(parts) == 2:
                        # Skip conversion for ASCII left parts (e.g., until-golden)
                        if all(ord(c) < 128 for c in parts[0]):
                            # Preserve structure for English compounds
                            if not parts[1].endswith('_1') and not parts[1].endswith('_2'):
                                 hindi_text_list.append(f"{parts[0]}-{parts[1]}_1")
                            else:
                                 hindi_text_list.append(f"{parts[0]}-{parts[1]}")
                        else:
                            converted_left = wx1.convert(parts[0])
                            hindi_text_list.append(f"{converted_left}_1-{parts[1]}")
                    else:
                        # Skip conversion for ASCII words
                        if all(ord(c) < 128 for c in word):
                            hindi_text_list.append(word + "_1")
                        else:
                            hindi_text_list.append(wx1.convert(word) + "_1")
            return hindi_text_list

        # adjust TAM for first element
        first_element = surface_ids[0]
        split_parts = first_element.split('-')
        if len(split_parts) == 2:
            verb_base = split_parts[0]
            tam = split_parts[1]

        print(f"TAM part: {tam}")
        print("\n===== Final Internal IDs =====")
        print(final_internal_ids)
        
        concept_ids = convert_to_hindi(surface_ids)
        print("cp", concept_ids)
        print(dependencies)
        print(component_values)

        # ---------------- DATAFRAME + OUTPUT STRING ----------------
        semantic_data = []
        gnp_data = []
        for lid in final_internal_ids:
            info = node_info.get(lid, {})
            semantic_data.append(info.get('semantic', '-'))
            gnp_data.append(info.get('morpho', '-'))

        df = pd.DataFrame({
            'concept_data': concept_ids,
            'index_data': [str(i) for i in range(1, len(concept_ids) + 1)],
            'semantic_data': semantic_data,
            'gnp_data': gnp_data,
            'dependency_data': dependencies,
            'discourse_data': ['-'] * len(concept_ids),
            'skpview_data': [node_info.get(lid, {}).get('skpview', '-') for lid in final_internal_ids],
            'scope_data': ['-'] * len(concept_ids),
            'construction_data': component_values,
        })

        # Add TAM row if present
        if tam:
            tam_row = pd.DataFrame({
                'concept_data': [f"%affirmative"],
                'index_data': [''],
                'semantic_data': [''],
                'gnp_data': [''],
                'dependency_data': [''],
                'discourse_data': [''],
                'skpview_data': [''],
                'scope_data': [''],
                'construction_data': [''],
            })
            df = pd.concat([df, tam_row], ignore_index=True)

        def generate_sent_id():
            return f"<sent_id={uuid.uuid4().hex[:4]}a>\n"

        output_format = generate_sent_id()
        output_format += f"#{sentence}\n"
        
        for index, row in df.iterrows():
            output_format += (
                f"{row['concept_data']}\t{row['index_data']}\t"
                f"{row['semantic_data']}\t{row['gnp_data']}\t"
                f"{row['dependency_data']}\t{row['discourse_data']}\t"
                f"{row['skpview_data']}\t{row['scope_data']}\t"
                f"{row['construction_data']}\n"
            )
        
        output_format += "</sent_id>"

        print(output_format)
        output_format = process_file_cp(output_format)
        output_format = process_file_nc(output_format)
        print(output_format)

        usr_data = {
            'recipe_id': recipe_id,
            'usr_format': output_format,
            'dataframe': df.to_dict('records'),
            'created_at': datetime.datetime.utcnow()
        }
        
        db.usr_collection.update_one(
            {'recipe_id': recipe_id},
            {'$set': usr_data},
            upsert=True
        )

        return output_format

    except Exception as e:
        print(f"An error occurred in graphtousr: {str(e)}")
        raise
