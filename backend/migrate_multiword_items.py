"""
Database Migration Script: Fix Multi-Word Items

This script updates existing database items that have spaces in their names
to use hyphens instead, ensuring they're treated as single units.

Run this script once to migrate existing data.
"""

from db import default_items, custom_ingredients, custom_actions, custom_descriptors, custom_others

def migrate_items():
    """Replace spaces with hyphens in all item names"""
    
    collections_to_migrate = [
        default_items,
        custom_ingredients,
        custom_actions,
        custom_descriptors,
        custom_others
    ]
    
    total_updated = 0
    
    for collection in collections_to_migrate:
        # Find all items with spaces in their names
        items_with_spaces = collection.find({"name": {"$regex": " "}})
        
        for item in items_with_spaces:
            old_name = item['name']
            new_name = old_name.replace(' ', '-')
            
            # Update the item
            result = collection.update_one(
                {"_id": item['_id']},
                {"$set": {"name": new_name}}
            )
            
            if result.modified_count > 0:
                print(f"✓ Updated: '{old_name}' → '{new_name}'")
                total_updated += 1
    
    print(f"\n✅ Migration complete! Updated {total_updated} items.")
    return total_updated

if __name__ == "__main__":
    print("Starting database migration to fix multi-word items...\n")
    migrate_items()
