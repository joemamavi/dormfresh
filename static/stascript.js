// Sample data - this would be replaced with actual database queries
let cleaningRequests = [];
let completedToday = 0;

// Priority mapping
const priorityMap = {
    'high': { text: 'High', class: 'bg-red-100 text-red-800 border-red-200', icon: 'fas fa-exclamation-triangle' },
    'medium': { text: 'Medium', class: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'fas fa-exclamation-circle' },
    'low': { text: 'Low', class: 'bg-green-100 text-green-800 border-green-200', icon: 'fas fa-info-circle' }
};

// Issue type mapping
const issueTypeMap = {
    'spill': 'Spill/Mess',
    'maintenance': 'Maintenance Issue',
    'general': 'General Cleaning',
    'urgent': 'Urgent Cleaning'
};

function updateStats() {
    const totalRequests = cleaningRequests.length;
    const highPriorityRequests = cleaningRequests.filter(req => req.priority === 'high').length;
    
    document.getElementById('totalRequests').textContent = totalRequests;
    document.getElementById('highPriorityRequests').textContent = highPriorityRequests;
    document.getElementById('completedToday').textContent = completedToday;
}

function renderRequests() {
    const tbody = document.getElementById('requestsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (cleaningRequests.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Sort by request time (oldest first)
    const sortedRequests = [...cleaningRequests].sort((a, b) => new Date(a.requestTime) - new Date(b.requestTime));
    
    tbody.innerHTML = sortedRequests.map(request => {
        const priority = priorityMap[request.priority];
        const issueType = issueTypeMap[request.issueType] || request.issueType;
        
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${priority.class}">
                        <i class="${priority.icon}"></i>
                        ${priority.text}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="font-semibold text-gray-800 text-lg">${request.roomNumber}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm">
                        <div class="font-medium text-gray-800">${formatDate(request.requestTime)}</div>
                        <div class="text-gray-500">${formatTime(request.requestTime)}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm">
                        <div class="font-medium text-gray-800">${request.requestedBy}</div>
                        <div class="text-gray-500">${request.userType}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700">${issueType}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <i class="fas fa-clock"></i>
                        Pending
                    </span>
                </td>
                <td class="px-6 py-4">
                    <button onclick="markCompleted(${request.id})" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow hover:shadow-lg">
                        <i class="fas fa-check"></i>
                        Complete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function markCompleted(requestId) {
    const requestIndex = cleaningRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
        const completedRequest = cleaningRequests[requestIndex];
        
        // In a real app, this would send a DELETE request to your Flask backend
        // fetch('/api/cleaning-requests/' + requestId, { method: 'DELETE' })
        
        // Remove from array
        cleaningRequests.splice(requestIndex, 1);
        completedToday++;
        
        // Add to recent activity
        addToRecentActivity(`Room ${completedRequest.roomNumber} cleaning completed`, 'completed');
        
        // Update UI
        renderRequests();
        updateStats();
        showSuccessModal();
        
        console.log(`Marked request ${requestId} as completed`);
    }
}

function addToRecentActivity(message, type) {
    const activityContainer = document.getElementById('recentActivity');
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const iconMap = {
        'completed': 'fas fa-check-circle text-green-600',
        'new': 'fas fa-plus-circle text-blue-600',
        'updated': 'fas fa-edit text-yellow-600'
    };
    
    const activityItem = document.createElement('div');
    activityItem.className = 'flex items-center gap-3 p-3 bg-gray-50 rounded-lg';
    activityItem.innerHTML = `
        <i class="${iconMap[type] || 'fas fa-info-circle text-gray-600'}"></i>
        <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">${message}</p>
            <p class="text-xs text-gray-500">${timeString}</p>
        </div>
    `;
    
    // Remove "No recent activity" message if it exists
    const noActivity = activityContainer.querySelector('p.italic');
    if (noActivity) {
        noActivity.remove();
    }
    
    activityContainer.insertBefore(activityItem, activityContainer.firstChild);
    
    // Keep only last 5 activities
    while (activityContainer.children.length > 5) {
        activityContainer.removeChild(activityContainer.lastChild);
    }
}

function showSuccessModal() {
    document.getElementById('successModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('successModal').classList.add('hidden');
}

function refreshRequests() {
    // In a real app, this would fetch data from your Flask backend
    // fetch('/api/cleaning-requests')
    //     .then(response => response.json())
    //     .then(data => {
    //         cleaningRequests = data;
    //         renderRequests();
    //         updateStats();
    //     });
    
    addToRecentActivity('Request list refreshed', 'updated');
    console.log('Refreshing requests...');
}

function clearCompleted() {
    // In a real app, this would clear completed requests from the database
    completedToday = 0;
    updateStats();
    addToRecentActivity('All completed requests cleared', 'updated');
    console.log('Cleared completed requests');
}

// Initialize the page
function initializePage() {
    // Sample data - replace with actual database queries
    cleaningRequests = [
        {
            id: 1,
            roomNumber: '101',
            requestTime: '2025-01-25T08:30:00',
            requestedBy: 'John Doe',
            userType: 'Student',
            issueType: 'spill',
            priority: 'high'
        },
        {
            id: 2,
            roomNumber: '205',
            requestTime: '2025-01-25T09:15:00',
            requestedBy: 'Jane Smith',
            userType: 'Staff',
            issueType: 'general',
            priority: 'medium'
        },
        {
            id: 3,
            roomNumber: '310',
            requestTime: '2025-01-25T10:00:00',
            requestedBy: 'Mike Johnson',
            userType: 'Student',
            issueType: 'maintenance',
            priority: 'low'
        }
    ];
    
    renderRequests();
    updateStats();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePage);

// Auto-refresh every 30 seconds (optional)
setInterval(() => {
    // Only refresh if there are requests
    if (cleaningRequests.length > 0) {
        console.log('Auto-refreshing...');
    }
}, 30000);

let students = [];

        // Sample data for demonstration (replace with your actual API)
        const sampleData = [
    {
        "student_id": "420",
        "student_name": "SAATHWIK DASARI",
        "email": "10:00AM"
    },
    {
        "student_id": "101",
        "student_name": "Student1",
        "email": "10:05AM"
    },
    {
        "student_id": "102",
        "student_name": "Student4",
        "email": "10:10AM"
    },
    {
        "student_id": "103",
        "student_name": "Student7",
        "email": "10:15AM"
    },
    {
        "student_id": "104",
        "student_name": "Student10",
        "email": "10:20AM"
    },
    {
        "student_id": "105",
        "student_name": "Student13",
        "email": "10:25AM"
    },
    {
        "student_id": "106",
        "student_name": "Student16",
        "email": "10:30AM"
    },
    {
        "student_id": "107",
        "student_name": "Student19",
        "email": "10:35AM"
    },
    {
        "student_id": "108",
        "student_name": "Student22",
        "email": "10:40AM"
    },
    {
        "student_id": "109",
        "student_name": "Student25",
        "email": "10:45AM"
    },
    {
        "student_id": "110",
        "student_name": "Student28",
        "email": "10:50AM"
    },
    {
        "student_id": "111",
        "student_name": "Student31",
        "email": "10:55AM"
    },
    {
        "student_id": "112",
        "student_name": "Student34",
        "email": "11:00AM"
    },
    {
        "student_id": "113",
        "student_name": "Student37",
        "email": "11:05AM"
    },
    {
        "student_id": "114",
        "student_name": "Student40",
        "email": "11:10AM"
    },
    {
        "student_id": "115",
        "student_name": "Student43",
        "email": "11:15AM"
    },
    {
        "student_id": "116",
        "student_name": "Student46",
        "email": "11:20AM"
    }
];;

        // Load data when page loads
        document.addEventListener('DOMContentLoaded', function() {
            loadStudents();
        });

        // Load students from database
        async function loadStudents() {
            try {
                // Try to fetch from API first
                const response = await fetch('/api/students');
                if (response.ok) {
                    students = await response.json();
                } else {
                    // Fallback to sample data
                    students = sampleData;
                }
                
                updateStats();
                renderTable();
                
            } catch (error) {
                console.log('Using sample data for demo');
                students = sampleData;
                updateStats();
                renderTable();
            }
        }

        // Update the statistics cards
        function updateStats() {
            document.getElementById('totalRequests').textContent = students.length;
            
            const room420Students = students.filter(s => s.room_no === 420).length;
            document.getElementById('highPriorityRequests').textContent = room420Students;
            
            const becStudents = students.filter(s => s.student_id.includes('BEC')).length;
            document.getElementById('completedToday').textContent = becStudents;
        }

        // Render students in the table
        function renderTable() {
            const tableBody = document.getElementById('requestsTableBody');
            const emptyState = document.getElementById('emptyState');
            
            if (students.length === 0) {
                showEmptyState();
                return;
            }
            
            emptyState.style.display = 'none';
            
            tableBody.innerHTML = students.map(student => {
                const program = student.student_id.includes('BEC') ? 'Computer Science' : 
                               student.student_id.includes('BCE') ? 'Civil Engineering' : 'General';
                const status = student.room_no === 420 ? 'VIP' : 'Active';
                
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium text-blue-600">${student.student_id}</td>
                        <td class="px-6 py-4 font-medium text-gray-900">${student.student_name}</td>
                        <td class="px-6 py-4 text-gray-600">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                Room ${student.room_no}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-gray-600 text-sm">${student.email}</td>
                        <td class="px-6 py-4 text-gray-600">${program}</td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}">
                                ${status}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <button onclick="viewStudent('${student.student_id}')" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-eye mr-1"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Get status badge color
        function getStatusColor(status) {
            switch(status?.toLowerCase()) {
                case 'vip': return 'bg-purple-100 text-purple-800';
                case 'active': return 'bg-green-100 text-green-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }

        // Show empty state
        function showEmptyState() {
            document.getElementById('requestsTableBody').innerHTML = '';
            document.getElementById('emptyState').style.display = 'block';
        }

        // View student details
        function viewStudent(studentId) {
            const student = students.find(s => s.student_id === studentId);
            if (student) {
                showModal();
                addRecentActivity(`Viewed details for ${student.student_name}`);
            }
        }

        // Refresh the data
        function refreshRequests() {
            loadStudents();
            addRecentActivity('Refreshed student data');
        }

        // Filter students (demo function)
        function clearCompleted() {
            students = students.filter(s => s.room_no !== 420);
            renderTable();
            updateStats();
            addRecentActivity('Applied room filter');
        }

        // Show success modal
        function showModal() {
            document.getElementById('successModal').classList.remove('hidden');
        }

        // Close modal
        function closeModal() {
            document.getElementById('successModal').classList.add('hidden');
        }

        // Add recent activity
        function addRecentActivity(message) {
            const activityDiv = document.getElementById('recentActivity');
            
            const noActivity = activityDiv.querySelector('.italic');
            if (noActivity) {
                noActivity.remove();
            }
            
            const activityItem = document.createElement('div');
            activityItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            activityItem.innerHTML = `
                <span class="text-gray-700">${message}</span>
                <span class="text-gray-500 text-sm">just now</span>
            `;
            
            activityDiv.insertBefore(activityItem, activityDiv.firstChild);
        }