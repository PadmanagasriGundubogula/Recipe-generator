import uuid
def handle_rate_measurement(G, parent_node, rate_data, prefix, counters):
    """
    Helper function to handle rate measurements with exact node hierarchy
    and proper value handling for count and unit nodes.
    """
    if not parent_node:
        return
    unit_every_value = rate_data.get('unit_every', '')  # मिनट_1
    unit_value_value = rate_data.get('unit_value', '')  # घंटा_1
    value_count = rate_data.get('value_count', '')      # 2
    every_count = rate_data.get('every_count', '')      # Default to value_count if every_count not present
    
    # Create unit_every branch
    unit_every_node = f"unit_every_{uuid.uuid4().hex[:6]}"
    G.add_node(unit_every_node, node_type='unit_every', label="unit_every")
    G.add_edge(parent_node, unit_every_node)

    # Create meas node under unit_every
    meas_every_node = f"measure_every_{counters['measurement']}_{uuid.uuid4().hex[:6]}"
    G.add_node(meas_every_node, node_type='measure', label=f"[meas_{counters['measurement']}]")
    G.add_edge(unit_every_node, meas_every_node)
    counters['measurement'] += 1

    # Create count and unit under meas with proper value handling
    count_every_node = f"count_every_{uuid.uuid4().hex[:6]}"
    unit_every_value_node = f"unit_every_value_{uuid.uuid4().hex[:6]}"
    G.add_node(count_every_node, node_type='quantity', label="count")
    G.add_node(unit_every_value_node, node_type='unit', label="unit")
    G.add_edge(meas_every_node, count_every_node)
    G.add_edge(meas_every_node, unit_every_value_node)

    # Add value nodes with their actual values
    every_count_value = str(rate_data.get('every_count'))  # Default to '1' if not provided
    every_count_node = f"every_count_{uuid.uuid4().hex[:6]}"
    G.add_node(every_count_node, node_type='quantity_value', label=every_count_value)
    G.add_edge(count_every_node, every_count_node)

    every_unit_value = str(rate_data.get('unit_every'))  # Default to 'unit' if not provided
    unit_every_node_final = f"unit_every_final_{uuid.uuid4().hex[:6]}"
    G.add_node(unit_every_node_final, node_type='unit_value', label=every_unit_value)
    G.add_edge(unit_every_value_node, unit_every_node_final)

    # Create unit_value branch
    unit_value_node = f"unit_value_{uuid.uuid4().hex[:6]}"
    G.add_node(unit_value_node, node_type='unit_label', label="unit_value")
    G.add_edge(parent_node, unit_value_node)

    # Create meas node under unit_value
    meas_value_node = f"measure_value_{counters['measurement']}_{uuid.uuid4().hex[:6]}"
    G.add_node(meas_value_node, node_type='measure', label=f"[meas_{counters['measurement']}]")
    G.add_edge(unit_value_node, meas_value_node)
    counters['measurement'] += 1

    # Create count and unit under meas with proper value handling
    count_value_node = f"count_value_{uuid.uuid4().hex[:6]}"
    unit_value_value_node = f"unit_value_value_{uuid.uuid4().hex[:6]}"
    G.add_node(count_value_node, node_type='quantity', label="count")
    G.add_node(unit_value_value_node, node_type='unit', label="unit")
    G.add_edge(meas_value_node, count_value_node)
    G.add_edge(meas_value_node, unit_value_value_node)

    # Add value nodes with their actual values
    rate_count_value = str(rate_data.get('value_count'))  # Default to '1' if not provided
    count_value_final_node = f"count_value_final_{uuid.uuid4().hex[:6]}"
    G.add_node(count_value_final_node, node_type='quantity_value', label=rate_count_value)
    G.add_edge(count_value_node, count_value_final_node)

    rate_unit_value = str(rate_data.get('unit_value'))  # Default to 'unit' if not provided
    unit_value_final_node = f"unit_value_final_{uuid.uuid4().hex[:6]}"
    G.add_node(unit_value_final_node, node_type='unit_value', label=rate_unit_value)
    G.add_edge(unit_value_value_node, unit_value_final_node)

    # Attach the values to the unit and count nodes
    # G.add_edge(unit_every_value_node, every_count_node)  # Attach count value to unit
    # G.add_edge(unit_value_value_node, count_value_final_node)  # Attach count value to unit
