from flask import Flask, jsonify, render_template, request, redirect, url_for,session, flash
import sqlite3
import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_goes_here'

@app.route('/')
def home():
    return render_template('selection.html') # Assuming this is your selection page filename

@app.route('/stafflog', methods=['GET', 'POST'])
def staff_login():
    if request.method == 'POST':
        # Your staff login logic here (e.g., check against staff_users table)
        email = request.form['email']
        password = request.form['password']
        
        conn = sqlite3.connect('DORM_FRESH')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # Assuming you have a 'staff_users' table for staff login
        c.execute("SELECT * FROM staff WHERE email = ? AND staff_id = ?", (email, password))
        staff_user = c.fetchone()
        conn.close()
        
        if staff_user:
            session['staff_email'] = staff_user['email'] # Store staff email in session
            return redirect(url_for('stadash')) # Redirect to staff dashboard
        else:
            return "Staff Login Failed"
    return render_template('stafflog.html')

@app.route('/stulogin', methods=['GET', 'POST'])
def stulog():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        print("--- STUDENT LOGIN ATTEMPT ---")
        print(f"Form Email: '{email}'")
        print(f"Form Password (ID): '{password}'")

        conn = sqlite3.connect('DORM_FRESH')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        # This assumes your student table is 'users' and has a 'password' column
        c.execute("SELECT * FROM Students WHERE email = ? AND student_id = ?", (email, password))
        user = c.fetchone()
        conn.close()

        if user:
            session['email'] = user['email'] # Save email in session
            return redirect(url_for('studash'))
        else:
            return "Student Login Failed"

    return render_template('stuLogin.html')
@app.route('/studash', methods=['GET', 'POST'])
def studash():
    if 'email' not in session:
        return redirect(url_for('stulog'))
    
    student_email = session['email']

    if request.method == 'POST':
        room = request.form['form_room_name'] 
        issue = request.form['form_issue_name']
        priority = request.form['form_priority'] # <-- 1. GET THE NEW DATA
        
        now = datetime.datetime.now()
        current_time = now.strftime("%Y-%m-%d %H:%M") 

        conn = sqlite3.connect('DORM_FRESH')
        c = conn.cursor()
        
        # 2. UPDATE THE SQL COMMAND (added 'priority', added one '?')
        c.execute("INSERT INTO requests (room, issue, status, email, time, priority) VALUES (?, ?, ?, ?, ?, ?)", 
                  (room, issue, 'Pending', student_email, current_time, priority)) # <-- 3. ADD THE VARIABLE
        
        conn.commit()
        conn.close()
       
        
        flash("Your cleaning request has been submitted successfully!", 'success') # <-- ADD THIS
        
        return redirect(url_for('studash'))

    return render_template('snt_dashboard.html')

@app.route('/stadash')
def stadash():
    if 'staff_email' not in session:
        return redirect(url_for('staff_login'))

    conn = sqlite3.connect('DORM_FRESH')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Get all PENDING requests for the table
    c.execute("SELECT * FROM requests WHERE status = 'Pending' ORDER BY time DESC")
    pending_requests_list = c.fetchall()

    # Get count for "Total Requests" card (which is total PENDING)
    pending_count = len(pending_requests_list)

    # Get count for "High Priority" card
    high_priority_count = 0
    for req in pending_requests_list:
        if req['priority'] == 'High':
            high_priority_count += 1

    # Get count for "Completed Today" card
    # (This counts all completed, you can add date logic later)
    c.execute("SELECT COUNT(*) FROM requests WHERE status = 'Completed'")
    completed_count = c.fetchone()[0]

    conn.close()

    return render_template(
        'staffdash2.html', 
        data=pending_requests_list, # Send only pending requests
        total_requests=pending_count,
        high_priority_requests=high_priority_count,
        completed_today=completed_count 
    )
@app.route('/mark_complete/<int:request_id>')
def mark_complete(request_id):
    # Check if staff is logged in before allowing them to change data
    if 'staff_email' not in session:
        return redirect(url_for('staff_login'))

    conn = sqlite3.connect('DORM_FRESH')
    c = conn.cursor()
    
    # Find the request by its ID and update its status
    c.execute("UPDATE requests SET status = 'Completed' WHERE id = ?", (request_id,))
    
    conn.commit()
    conn.close()

    flash("The request has been marked as 'Completed'.", 'success') # <-- ADD THIS
    
    # Send the staff member back to the dashboard
    return redirect(url_for('stadash'))

@app.route('/clear_completed')
def clear_completed():
    if 'staff_email' not in session:
        return redirect(url_for('staff_login'))

    conn = sqlite3.connect('DORM_FRESH')
    c = conn.cursor()
    c.execute("DELETE FROM requests WHERE status = 'Completed'")
    conn.commit()
    conn.close()
    
    flash("All completed requests have been cleared.", 'success') # <-- ADD THIS
    
    # Send the staff member back to the dashboard
    return redirect(url_for('stadash'))

@app.route('/staffdash2')
def stdash2():
    return render_template('staffdash2.html')

@app.route('/api/students')
def get_students():
    conn = sqlite3.connect('DORM_FRESH')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM Students")
    students = cursor.fetchall()
    
    students_list = [dict(row) for row in students]
    conn.close()
    
    return jsonify(students_list)

@app.route('/logout')
def logout():
    # Clear the user's email from the session
    session.pop('email', None)
    session.pop('staff_email', None)
    # Redirect to the main homepage
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
