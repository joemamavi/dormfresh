import sqlite3
from datetime import datetime

def check_if_user_exists(username, password, filename):

    conn = None
    try:
        conn = sqlite3.connect(filename)
        cursor = conn.cursor()

        table_name = filename.split('.')[0] #extracts and accesses only the file name and not the extension
        query = f'SELECT username FROM {table_name} WHERE username=? AND password=?' #in actual practice password will be hashed but not here
        cursor.execute(query, (username, password))
        #send the signal that username exists and the password is  correct to the front end @
        result = cursor.fetchone()
        return result is not None
    except sqlite3.Error as e:
        #do something @
        return False
    finally:
        if conn:
            conn.close()

def add_request(username, cleaning_type):

    room_number = None
    try:
        with sqlite3.connect('student_info.db') as info_connect:
            info_cursor = info_connect.cursor()
            info_cursor.execute("SELECT room_number FROM student_info WHERE name = ?", (username,))
            result = info_cursor.fetchone()
        
            if not result:
                (f"No student found with username: {username}")
                return
            
            room_number = result[0]
            time_of_request = datetime.utcnow()

    except sqlite3.Error as e:
        #just a safe guard here maybe add a print statement to debug it @
        return

    try:
        with sqlite3.connect('request.db') as request_connect:
            request_cursor = request_connect.cursor()
            
            #check for an existing request for the same room number
            request_cursor.execute("SELECT username FROM request WHERE room_number = ?", (room_number,))
            existing_request = request_cursor.fetchone()

            if existing_request:
                existing_usernames = existing_request[0].split(',') #usernames are seperated by comma here
                if username in existing_usernames:
                    #send a signal to front end that the request to clean the room has already been made @
                    1
                
                else:
                    updated_usernames = ','.join(existing_usernames + [username])
                    update_query = "UPDATE request SET username = ? WHERE room_number = ?"
                    request_cursor.execute(update_query, (updated_usernames, room_number))
                    request_connect.commit()
            else:
                insertion_query = "INSERT INTO request (username, room_number, cleaning_type, done_by, time_of_request) VALUES (?, ?, ?, ?, ?)"
                request_cursor.execute(insertion_query, (username, room_number, cleaning_type, None, time_of_request))
                request_connect.commit()
    except sqlite3.Error as e:
        return False

def add_request(username, cleaning_type):

    try: #find the room number
        with sqlite3.connect('student_info.db') as info_conn:
            cur = info_conn.cursor()
            # NOTE: your column is 'name' (not 'username'); consider renaming for clarity
            cur.execute("SELECT room_number FROM student_info WHERE name = ? LIMIT 1", (username,))
            row = cur.fetchone()
            if not row:
                return 'error'
            room_number = row[0]
    except sqlite3.Error:
        return 'error' #db error or missing student

    try: #insert/update request
        with sqlite3.connect('request.db') as req_conn:
            req_conn.execute("BEGIN IMMEDIATE")  # prevent concurrent duplicate inserts
            cur = req_conn.cursor()

            # Look for the latest OPEN request for this room
            cur.execute("SELECT id, username FROM request WHERE room_number = ? AND done_by IS NULL ORDER BY time_of_request DESC LIMIT 1", (room_number,))
            row = cur.fetchone()

            now_iso = datetime.utcnow().isoformat(timespec='seconds') + "Z"

            if row:
                req_id, usernames_csv = row
                users = [u.strip() for u in (usernames_csv or "").split(",") if u.strip()] #case-sensitive
                if username in users:
                    return 'already_requested'
                users.append(username)
                updated_usernames = ",".join(sorted(set(users)))
                cur.execute("UPDATE request SET username = ? WHERE id = ?", (updated_usernames, req_id))
                cur.execute("UPDATE request SET cleaning_type = ? WHERE id = ?", (cleaning_type, req_id))
                return 'joined_existing'
            else:
                cur.execute("INSERT INTO request (username, room_number, cleaning_type, done_by, time_of_request) VALUES (?, ?, ?, ?, ?)", (username, room_number, cleaning_type, None, now_iso))
                return 'created'
    except sqlite3.Error:
        return 'error'

def staff_cleaned_room(staff_name, room_number):
    try:
        with sqlite3.connect('request.db') as conn:
            cur = conn.cursor()
            
            # Update only open requests (where done_by is NULL)
            cur.execute("UPDATE request SET done_by = ? WHERE room_number = ? AND done_by IS NULL", (staff_name, room_number))
            
            updated = cur.rowcount

        return updated > 0 #true if 1 row was updated

    except sqlite3.Error as e:
        return False