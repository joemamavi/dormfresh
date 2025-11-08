import psycopg2

conn = None
try:
    conn = psycopg2.connect(
        dbname="DORM_FRESH",
        user="saathwik_dasari",
        password="Saathwik@123",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    # Your database operations here
    # For example:
    # cur.execute("SELECT * FROM Students;")
    # records = cur.fetchall()
    
    # for row in records:
    #     print(row)

    print(cur.execute("SELECT * FROM Students"))

except psycopg2.Error as e:
    print(f"Error: {e}")

finally:
    if conn:
        cur.close()
        conn.close()