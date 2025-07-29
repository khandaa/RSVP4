#!/usr/bin/env python3
"""
Entity Relationship Diagram Generator for RSVP4 Database
This script generates an ERD diagram for the RSVP4 database structure
"""

import os
import re
import subprocess

try:
    import graphviz
except ImportError:
    print("Graphviz module not found. Installing...")
    subprocess.call(['pip', 'install', 'graphviz'])
    import graphviz

def parse_sql_file(file_path):
    """Parse the SQL file to extract table definitions and relationships"""
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Extract CREATE TABLE statements
    create_table_pattern = r'CREATE TABLE (\w+) \(\s*([\s\S]*?)\);'
    tables = re.findall(create_table_pattern, content)
    
    # Extract foreign key relationships
    foreign_key_pattern = r'FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)'
    
    tables_dict = {}
    relationships = []
    
    for table_name, table_content in tables:
        primary_key = None
        columns = []
        
        # Find primary key
        pk_match = re.search(r'(\w+) INTEGER PRIMARY KEY', table_content)
        if pk_match:
            primary_key = pk_match.group(1)
        
        # Find all columns
        column_lines = table_content.strip().split(',\n')
        for line in column_lines:
            line = line.strip()
            col_match = re.match(r'(\w+)', line)
            if col_match and not line.startswith('FOREIGN KEY'):
                columns.append(col_match.group(1))
        
        tables_dict[table_name] = {
            'primary_key': primary_key,
            'columns': columns
        }
        
        # Find all foreign keys
        fk_matches = re.findall(foreign_key_pattern, table_content)
        for fk_col, ref_table, ref_col in fk_matches:
            relationships.append({
                'from_table': table_name,
                'from_column': fk_col,
                'to_table': ref_table,
                'to_column': ref_col
            })
    
    return tables_dict, relationships

def generate_erd(tables, relationships, output_file):
    """Generate ERD using Graphviz"""
    dot = graphviz.Digraph(comment='RSVP4 Entity Relationship Diagram', format='png')
    dot.attr('node', shape='record', style='filled', fillcolor='lightblue')
    
    # Group master tables and detail tables
    master_tables = [table for table in tables if table.startswith('rsvp_master_')]
    detail_tables = [table for table in tables if not table.startswith('rsvp_master_')]
    
    # Create subgraph for master tables
    with dot.subgraph(name='cluster_master') as c:
        c.attr(label='Master Tables', style='filled', color='lightgrey')
        for table in master_tables:
            label = f"{{{table}|{tables[table]['primary_key']} (PK)\\l"
            for col in tables[table]['columns']:
                if col != tables[table]['primary_key']:
                    label += f"{col}\\l"
            label += "}"
            c.node(table, label=label)
    
    # Create subgraph for detail tables
    with dot.subgraph(name='cluster_detail') as c:
        c.attr(label='Detail Tables', style='filled', color='lightgrey')
        for table in detail_tables:
            label = f"{{{table}|{tables[table]['primary_key']} (PK)\\l"
            for col in tables[table]['columns']:
                if col != tables[table]['primary_key']:
                    label += f"{col}\\l"
            label += "}"
            c.node(table, label=label)
    
    # Add relationships
    for rel in relationships:
        from_table = rel['from_table']
        to_table = rel['to_table']
        dot.edge(to_table, from_table, label=f"{rel['to_column']} -> {rel['from_column']}")
    
    # Save and render the diagram
    dot.render(output_file, view=True)
    print(f"ERD generated and saved as {output_file}.png")

def generate_simplified_erd(tables, relationships, output_file):
    """Generate a simplified ERD with just table names and relationships"""
    dot = graphviz.Digraph(comment='RSVP4 Simplified Entity Relationship Diagram', format='png')
    
    # Group tables by type
    master_tables = [table for table in tables if table.startswith('rsvp_master_')]
    detail_tables = [table for table in tables if not table.startswith('rsvp_master_')]
    
    # Create subgraph for master tables
    with dot.subgraph(name='cluster_master') as c:
        c.attr(label='Master Tables', style='filled', color='lightgrey')
        for table in master_tables:
            c.node(table, label=table, shape='box', style='filled', fillcolor='lightblue')
    
    # Create subgraph for detail tables
    with dot.subgraph(name='cluster_detail') as c:
        c.attr(label='Detail Tables', style='filled', color='lightgrey')
        for table in detail_tables:
            c.node(table, label=table, shape='box', style='filled', fillcolor='lightgreen')
    
    # Add relationships
    for rel in relationships:
        from_table = rel['from_table']
        to_table = rel['to_table']
        dot.edge(to_table, from_table)
    
    # Save and render the diagram
    dot.render(output_file, view=True)
    print(f"Simplified ERD generated and saved as {output_file}.png")

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(current_dir, 'table_definitions.sql')
    output_file = os.path.join(current_dir, 'rsvp4_erd')
    simplified_output_file = os.path.join(current_dir, 'rsvp4_simplified_erd')
    
    tables, relationships = parse_sql_file(sql_file)
    
    # Generate detailed ERD
    generate_erd(tables, relationships, output_file)
    
    # Generate simplified ERD
    generate_simplified_erd(tables, relationships, simplified_output_file)

if __name__ == "__main__":
    main()
