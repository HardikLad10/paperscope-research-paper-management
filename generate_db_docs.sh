#!/bin/bash

# Database connection details
DB_HOST="34.41.182.58"
DB_PORT="3306"
DB_USER="team126"
DB_PASS="Team@126"
DB_NAME="research_paper_review_db"
OUTPUT_DIR="adv_database_feature"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function 1: Generate Constraints Documentation
generate_constraints() {
    echo "Generating constraints documentation..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        tc.table_name AS 'Table',
        tc.constraint_name AS 'Constraint Name',
        tc.constraint_type AS 'Type',
        kcu.column_name AS 'Column',
        kcu.referenced_table_name AS 'References Table',
        kcu.referenced_column_name AS 'References Column'
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = '$DB_NAME'
      AND tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'CHECK')
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
    " 2>&1 | grep -v "Warning" > "$OUTPUT_DIR/constraints.txt"
    echo " Created $OUTPUT_DIR/constraints.txt"
}

# Function 2: Generate Stored Procedures Documentation
generate_procedures() {
    echo "Generating stored procedures documentation..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        ROUTINE_NAME AS 'Procedure Name',
        ROUTINE_TYPE AS 'Type',
        DTD_IDENTIFIER AS 'Returns',
        CREATED AS 'Created',
        LAST_ALTERED AS 'Last Modified'
    FROM information_schema.ROUTINES
    WHERE ROUTINE_SCHEMA = '$DB_NAME'
      AND ROUTINE_TYPE = 'PROCEDURE'
    ORDER BY ROUTINE_NAME;
    " 2>&1 | grep -v "Warning" > "$OUTPUT_DIR/procedures.txt"
    echo " Created $OUTPUT_DIR/procedures.txt"
}

# Function 3: Generate Triggers Documentation
generate_triggers() {
    echo "Generating triggers documentation..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        TRIGGER_NAME AS 'Trigger Name',
        EVENT_MANIPULATION AS 'Event',
        EVENT_OBJECT_TABLE AS 'Table',
        ACTION_TIMING AS 'Timing',
        CREATED AS 'Created'
    FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA = '$DB_NAME'
    ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION;
    " 2>&1 | grep -v "Warning" > "$OUTPUT_DIR/triggers.txt"
    echo " Created $OUTPUT_DIR/triggers.txt"
}

# Function 4: Generate Transactions Documentation
generate_transactions() {
    echo "Generating transactions documentation..."
    cat > "$OUTPUT_DIR/transactions.txt" << 'EOF'
=== TRANSACTIONS IN DATABASE ===

Transactions are implemented within stored procedures:

1. sp_delete_paper_safe
   - Transaction Type: EXPLICIT
   - Isolation Level: READ COMMITTED
   - Operations:
     * DELETE FROM Reviews WHERE paper_id = p_paper_id
     * DELETE FROM RelatedPapers WHERE paper_id = p_paper_id OR related_paper_id = p_paper_id
     * DELETE FROM Authorship WHERE paper_id = p_paper_id
     * DELETE FROM Papers WHERE paper_id = p_paper_id
   - Commit/Rollback: COMMIT on success, automatic rollback on error
   - Purpose: Ensures atomic deletion of paper and all related records

2. sp_create_ai_draft_paper
   - Transaction Type: IMPLICIT (single INSERT)
   - Operations:
     * INSERT INTO Papers (paper_id, paper_title, abstract, pdf_url, status, ai_generated, source_paper_id, upload_timestamp)
     * INSERT INTO Authorship (user_id, paper_id)
     * INSERT INTO RelatedPapers (paper_id, related_paper_id, relation_type)
   - Purpose: Creates AI-generated draft paper with authorship and relationship

3. Application-Level Transactions (server.js)
   - POST /api/papers/with-authors
     * INSERT INTO Papers
     * INSERT INTO Authorship (for each author)
   - Purpose: Ensures paper and authorship records are created atomically

Transaction Isolation Levels:
- Default: REPEATABLE READ (MySQL InnoDB default)
- sp_delete_paper_safe: READ COMMITTED (explicitly set)

ACID Properties Enforced:
- Atomicity: All operations complete or none (via transactions)
- Consistency: Foreign key constraints ensure referential integrity
- Isolation: Transaction isolation levels prevent dirty reads
- Durability: InnoDB storage engine ensures committed data persists
EOF
    echo " Created $OUTPUT_DIR/transactions.txt"
}

# Main execution
echo "========================================="
echo "Database Documentation Generator"
echo "========================================="
echo ""

# Execute all functions
generate_constraints
generate_procedures
generate_triggers
generate_transactions

echo ""
echo "========================================="
echo "Documentation generation complete!"
echo "========================================="
echo "Files created in $OUTPUT_DIR/:"
ls -lh "$OUTPUT_DIR"/*.txt
