document.addEventListener("DOMContentLoaded", () => {
    navigateTo('home');
});

let pools = [];

async function navigateTo(page, routeId = null) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const loggedInUser = await isLoggedIn();

    if (page === 'home') {
        content.innerHTML = `
            <section id="home">
                <h1>Welcome to Carpooling Service</h1>
                <p>Connect with drivers and riders for a shared ride experience.</p>
                <div class="home-buttons">
                    ${loggedInUser ? `
                        <button onclick="navigateTo('create-pool')">Create Pool</button>
                        <button onclick="navigateTo('available-pools')">Available Pools</button>
                    ` : `
                        <button onclick="navigateTo('create-pool')">Create Pool</button>
                    `}
                </div>
            </section>
        `;
        updateNavLinks(loggedInUser, 'home');
    } else if (page === 'create-pool') {
        if (loggedInUser) {
            // Fetch user information
            const userInfoResponse = await fetch('/api/userInfo'); // Replace with your API endpoint to fetch user info
            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
    
                content.innerHTML = `
                    <section id="create-pool">
                        <h2>Create a Car Pool</h2>
                        <form id="createPoolForm">
                            <input type="text" id="driverName" name="driverName" value="${userInfo.firstName} ${userInfo.lastName}" placeholder="Driver Name" required>
                            <input type="text" id="driverPhone" name="driverPhone" value="${userInfo.mobileNumber}" placeholder="Driver Phone" required>
                            <textarea id="driverNote" name="driverNote" placeholder="Driver Note"></textarea>
                            <input type="text" id="pickupLocation" name="pickupLocation" placeholder="Pickup Location" required>
                            <input type="text" id="dropLocation" name="dropLocation" placeholder="Drop Location" required>
                            <input type="datetime-local" id="time" name="time" required>
                            <input type="number" id="seats" name="seats" min="1" max="6" placeholder="Seats Available" required>
                            <button type="submit">Create Pool</button>
                        </form>
                    </section>
                `;
                document.getElementById('createPoolForm').addEventListener('submit', createPool);
                updateNavLinks(loggedInUser, 'create-pool');
            } else {
                alert('Failed to fetch user information');
                navigateTo('home'); // Redirect to home or handle error as needed
            }
        } else {
            navigateTo('login');
        }
    } else if (page === 'request-ride') {
        if (loggedInUser) {
            let pickupLocation = '';
            let dropLocation = '';
            if (routeId !== 'other') {
                const route = routeId.replace(/_/g, ' ');
                [pickupLocation, dropLocation] = route.split(' to ');
            }
    
            // Fetch user information
            const userInfoResponse = await fetch('/api/userInfo');
            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
    
                content.innerHTML = `
                    <section id="request-ride">
                        <h2>Request a Ride</h2>
                        <form id="requestRideForm">
                            ${routeId !== 'other' ? `
                                <select id="pool" name="pool" required></select>
                            ` : ''}
                            <input type="text" id="riderName" name="riderName" value="${userInfo.firstName} ${userInfo.lastName}" placeholder="Name" required>
                            <input type="text" id="riderPhone" name="riderPhone" value="${userInfo.mobileNumber}" placeholder="Phone" required>
                            <input type="text" id="pickupLocation" name="pickupLocation" value="${pickupLocation}" placeholder="Pickup Location" required>
                            <input type="text" id="dropLocation" name="dropLocation" value="${dropLocation}" placeholder="Drop Location" required>
                            <input type="number" id="numberOfPersons" name="numberOfPersons" placeholder="Number of Persons" min="1" required>
                            <button type="submit">Request Ride</button>
                        </form>
                    </section>
                `;
                document.getElementById('requestRideForm').addEventListener('submit', requestRide);
                if (routeId !== 'other') {
                    await populatePoolOptions(routeId);
                }
                updateNavLinks(loggedInUser, 'request-ride');
            }
    
            const availablePoolsElement = document.getElementById('availablePools');
            if (availablePoolsElement) {
                availablePoolsElement.innerHTML = pools.map((pool, index) => `
                    <li>
                        <strong>Pool ${index + 1}:</strong> ${pool.driverName} is offering a ride from ${pool.pickupLocation} to ${pool.dropLocation} at ${new Date(pool.time).toLocaleString()}.
                        <br>Seats Available: ${pool.seats}
                    </li>
                `).join('');
            }
        } else {
            navigateTo('login');
        }
    }
    else if (page === 'custom-request-ride') {
        if (loggedInUser) {
            // Fetch user information
            const userInfoResponse = await fetch('/api/userInfo');
            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
    
                content.innerHTML = `
                    <section id="custom-request-ride">
                        <h2>Request a Custom Ride</h2>
                        <form id="customRequestRideForm">
                            <input type="text" id="riderName" name="riderName" value="${userInfo.firstName} ${userInfo.lastName}" placeholder="Name" required>
                            <input type="text" id="riderPhone" name="riderPhone" value="${userInfo.mobileNumber}" placeholder="Phone" required>
                            <input type="text" id="pickupLocation" name="pickupLocation" placeholder="Pickup Location" required>
                            <input type="text" id="dropLocation" name="dropLocation" placeholder="Drop Location" required>
                            <input type="number" id="numberOfPersons" name="numberOfPersons" placeholder="Number of Persons" min="1" required>
                            <input type="datetime-local" id="requestTime" name="requestTime" required>
                            <textarea id="requestNote" name="requestNote" placeholder="Request Note"></textarea>
                            <button type="submit">Request Custom Ride</button>
                        </form>
                    </section>
                `;
                document.getElementById('customRequestRideForm').addEventListener('submit', createCustomRequest);
                updateNavLinks(loggedInUser, 'custom-request-ride');
            } else {
                alert('Failed to fetch user information');
                navigateTo('home'); // Redirect to home or handle error as needed
            }
        } else {
            navigateTo('login');
        }


    } else if (page === 'available-pools') {
        content.innerHTML = `
            <section id="available-pools">
                <h2>Available Pools</h2>
                <ul id="availablePoolsList"></ul>
            </section>
        `;
        await fetchAvailablePools();
        updateNavLinks(loggedInUser, 'available-pools');

    } else if (page === 'signup') {
        content.innerHTML = `
            <section id="signup">
                <h2>Sign Up</h2>
                <form id="signupForm">
                    <input type="email" id="email" name="email" placeholder="Email" required>
                    <input type="password" id="password" name="password" placeholder="Password" required>
                    <input type="text" id="firstName" name="firstName" placeholder="First Name" required>
                    <input type="text" id="lastName" name="lastName" placeholder="Last Name" required>
                    <input type="text" id="mobileNumber" name="mobileNumber" placeholder="Mobile Number" required>
                    <input type="text" id="optionalMobileNumber" name="optionalMobileNumber" placeholder="Optional Mobile Number">
                    <button type="submit">Sign Up</button>
                </form>
            </section>
        `;
        document.getElementById('signupForm').addEventListener('submit', signup);
        updateNavLinks(loggedInUser, 'signup');
    }else if (page === 'login') {
        content.innerHTML = `
            <section id="login">
                <h2>Login</h2>
                <form id="loginForm">
                    <input type="email" id="email" name="email" placeholder="Email" required>
                    <input type="password" id="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
            </section>
        `;
        document.getElementById('loginForm').addEventListener('submit', login);
        updateNavLinks(loggedInUser, 'login');
    } 
    else if (page === 'my-requests') {
        if (loggedInUser) {
            content.innerHTML = `
                <section id="my-requests">
                    <h2>My Requests</h2>
                    <ul id="myRequestsList"></ul>
                </section>
            `;
            await fetchUserRequests(loggedInUser.id);
            updateNavLinks(loggedInUser, 'my-requests');
        } else {
            navigateTo('login');
        }
    } else if (page === 'user-info') {
        if (loggedInUser) {
            // Fetch user information
            const userInfoResponse = await fetch('/api/userInfo'); // Replace with your API endpoint to fetch user info
            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
    
                content.innerHTML = `
                    <section id="user-info">
                        <h2>User Information</h2>
                        <form id="updateUserInfoForm">
                            <input type="text" id="firstName" name="firstName" placeholder="First Name" value="${userInfo.firstName}" required>
                            <input type="text" id="lastName" name="lastName" placeholder="Last Name" value="${userInfo.lastName}" required>
                            <input type="text" id="mobileNumber" name="mobileNumber" placeholder="Mobile Number" value="${userInfo.mobileNumber}">
                            <input type="text" id="optionalMobileNumber" name="optionalMobileNumber" placeholder="Optional Mobile Number" value="${userInfo.optionalMobileNumber}">
                            <button type="submit">Update Information</button>
                        </form>
                    </section>
                `;
                document.getElementById('updateUserInfoForm').addEventListener('submit', updateUserInfo);
                updateNavLinks(loggedInUser, 'user-info');
            } else {
                alert('Failed to fetch user information');
                navigateTo('home'); // Redirect to home or handle error as needed
            }
        } else {
            navigateTo('login');
        }
    } else if (page === 'history') {
        if (loggedInUser) {
            console.log('Logged in user:', loggedInUser); // Add this line for debugging
            content.innerHTML = `
                <section id="history">
                    <h2>Ride History</h2>
                    <ul id="historyList"></ul>
                </section>
            `;
            await fetchRideHistory(loggedInUser.id);
            updateNavLinks(loggedInUser, 'history');
        } else {
            navigateTo('login');
        }
    } else if (page === 'pool-status') {
        if (loggedInUser) {
            try {
                const [poolStatusResponse, customRequestsResponse] = await Promise.all([
                    fetch(`/api/pools?createdBy=${loggedInUser.id}`),
                    fetch('/api/custom-requests')
                ]);
                
                if (!poolStatusResponse.ok || !customRequestsResponse.ok) {
                    throw new Error('Failed to fetch data');
                }
    
                const pools = await poolStatusResponse.json();
                const customRequests = await customRequestsResponse.json();
    
                console.log('Fetched pools:', pools);
                console.log('Fetched custom requests:', customRequests);
    
                content.innerHTML = `
                <section id="pool-status">
                    <h2>Pool Status</h2>
                    <h3>Your Pools</h3>
                    ${pools.length > 0 ? `
                        <ul id="poolStatusList">
                            ${pools.map(pool => {
                                const hasAcceptedRequest = pool.requests.some(request => request.status === 'Accepted');
                                return `
                                    <li data-pool-id="${pool._id}">
                                        <strong>Pool Details:</strong> ${pool.driverName} is offering a ride from ${pool.pickupLocation} to ${pool.dropLocation} at ${new Date(pool.time).toLocaleString()}.
                                        <br>Seats Available: <span class="seats-available">${pool.seats}</span>
                                        <br>Requests:
                                        <ul>
                                            ${pool.requests.length > 0 ? pool.requests.map(request => `
                                                <li data-request-id="${request._id}">
                                                    Rider: ${request.riderName} (${request.riderPhone})<br>
                                                    From: ${request.pickupLocation}<br>
                                                    To: ${request.dropLocation}<br>
                                                    Status: <span class="request-status">${request.status}</span>
                                                    ${request.requestNote ? `<br>Rider Note: ${request.requestNote}` : ''}
                                                    ${request.status === 'Pending' ? `
                                                        <button id="acceptButton_${request._id}" data-request-id="${request._id}" data-pool-id="${pool._id}">Accept</button>
                                                        <button id="deleteButton_${request._id}" data-request-id="${request._id}" data-pool-id="${pool._id}">Delete</button>
                                                    ` : ''}
                                                </li>
                                            `).join('') : 'No requests yet'}
                                        </ul>
                                        <button id="editButton_${pool._id}" data-pool-id="${pool._id}">Edit Pool</button>
                                        ${!hasAcceptedRequest ? `<button id="deleteButton_${pool._id}" data-pool-id="${pool._id}">Delete Pool</button>` : ''}
                                        <button id="completeButton_${pool._id}" data-pool-id="${pool._id}">Complete Pool</button>
                                    </li>
                                `;
                            }).join('')}
                        </ul>
                    ` : '<p>You have not created any pools yet.</p>'}
                    ${pools.length === 0 ? '<button onclick="navigateTo(\'create-pool\')">Create New Pool</button>' : ''}
                    <h3>Custom Requests</h3>
                    <ul id="customRequestsList">
                        ${customRequests.length > 0 ? customRequests.map(request => `
                            <li data-request-id="${request._id}">
                                Rider: ${request.riderName} (${request.riderPhone})<br>
                                From: ${request.pickupLocation}<br>
                                To: ${request.dropLocation}<br>
                                Time: ${request.requestTime}<br>
                                Persons: ${request.numberOfPersons}<br>
                                Status: ${request.status}<br>
                                ${request.requestNote ? `Rider Note: ${request.requestNote}<br>` : ''}
                                ${request.status === 'Pending' ? `<button id="acceptCustomButton_${request._id}" data-request-id="${request._id}">Accept Custom Request</button>` : ''}
                            </li>
                        `).join('') : '<li>No custom requests available</li>'}
                    </ul>
                </section>
            `;
    
                // Add event listeners for pool buttons
                if (pools.length > 0) {
                    pools.forEach(pool => {
                        const editButton = document.getElementById(`editButton_${pool._id}`);
                        editButton.addEventListener('click', () => editPool(pool));
    
                        const hasAcceptedRequest = pool.requests.some(request => request.status === 'Accepted');
                        if (!hasAcceptedRequest) {
                            const deleteButton = document.getElementById(`deleteButton_${pool._id}`);
                            deleteButton.addEventListener('click', () => deletePool(pool._id));
                        }
    
                        const completeButton = document.getElementById(`completeButton_${pool._id}`);
                        completeButton.addEventListener('click', () => completePool(pool._id));
    
                        pool.requests.forEach(request => {
                            if (request.status === 'Pending') {
                                const acceptButton = document.getElementById(`acceptButton_${request._id}`);
                                acceptButton.addEventListener('click', () => acceptRequest(request._id, pool._id));
                                
                                const deleteButton = document.getElementById(`deleteButton_${request._id}`);
                                deleteButton.addEventListener('click', () => deleteRequest(request._id, pool._id));
                            }
                        });
                    });
                }
    
                // Add event listeners for custom request buttons
                customRequests.forEach(request => {
                    if (request.status === 'Pending') {
                        const acceptCustomButton = document.getElementById(`acceptCustomButton_${request._id}`);
                        acceptCustomButton.addEventListener('click', () => acceptCustomRequest(request._id));
                    }
                });
            } catch (error) {
                console.error('Error fetching pool status or custom requests:', error);
                content.innerHTML = '<p>Error loading pool status and custom requests. Please try again later.</p>';
            }
        } else {
            navigateTo('login');
        }
    }


    async function completePool(poolId) {
        try {
            console.log(`Attempting to complete pool: ${poolId}`);
            const response = await fetch(`/api/pools/${poolId}/complete`, {
                method: 'POST',
            });
    
            const responseData = await response.json();
            console.log('Server response:', responseData);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${responseData.error || 'Unknown error'}`);
            }
    
            console.log('Pool completion result:', responseData);
            alert(responseData.message);
            navigateTo('pool-status'); // Refresh pool status after completion
        } catch (error) {
            console.error('Error completing pool:', error);
            alert(`Failed to complete pool: ${error.message}`);
        }
    }


    async function fetchRideHistory(userId) {
        try {
            console.log(`Fetching ride history for user: ${userId}`);
            const response = await fetch(`/api/users/${userId}/history`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const history = await response.json();
            console.log(`Received ${history.length} historical rides:`, history);
            
            const historyList = document.getElementById('historyList');
            if (historyList) {
                historyList.innerHTML = history.map(ride => `
                    <li>
                        <strong>Ride:</strong> From ${ride.pickupLocation} to ${ride.dropLocation}
                        <br>Date: ${new Date(ride.time).toLocaleString()}
                        <br>Driver: ${ride.driverName}
                        <br>Status: Completed
                    </li>
                `).join('');
            }
        } catch (error) {
            console.error('Error fetching ride history:', error);
            alert(`Failed to fetch ride history: ${error.message}`);
        }
    }


    async function updateNavLinks(loggedInUser, currentPage) {
        const navLinks = document.getElementById('nav-links');
        navLinks.innerHTML = '';
    
        const hasRequests = await userHasRequests(loggedInUser?.id);
        const hasCreatedPoolsOrCustomRequests = await userHasCreatedPoolsOrCustomRequests(loggedInUser?.id);
    
        if (loggedInUser) {
            navLinks.innerHTML = `
                <li><a href="#" onclick="navigateTo('home')" ${currentPage === 'home' ? 'class="active"' : ''}>Home</a></li>
                ${hasRequests ? `<li><a href="#" onclick="navigateTo('my-requests')" ${currentPage === 'my-requests' ? 'class="active"' : ''}>My Requests</a></li>` : ''}
                ${hasCreatedPoolsOrCustomRequests ? `<li><a href="#" onclick="navigateTo('pool-status')" ${currentPage === 'pool-status' ? 'class="active"' : ''}>Pool Status</a></li>` : ''}
                <li><a href="#" id="history-link" ${currentPage === 'history' ? 'class="active"' : ''}>History</a></li>
                <li><a href="#" onclick="navigateTo('user-info')" ${currentPage === 'user-info' ? 'class="active"' : ''}>User Info</a></li>
                <li><a href="#" data-user-id="${loggedInUser.id}" id="logout-link">Sign Out</a></li>
            `;
        } else {
            navLinks.innerHTML = `
                <li><a href="#" onclick="navigateTo('home')" ${currentPage === 'home' ? 'class="active"' : ''}>Home</a></li>
                <li><a href="#" onclick="navigateTo('signup')" ${currentPage === 'signup' ? 'class="active"' : ''}>Sign Up</a></li>
                <li><a href="#" onclick="navigateTo('login')" ${currentPage === 'login' ? 'class="active"' : ''}>Login</a></li>
    
            `;
        }
        // Attach the logout event listener
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', async (event) => {
                event.preventDefault();
                const userId = logoutLink.getAttribute('data-user-id');
                await logout(userId);
            });
        }

        const historyLink = document.getElementById('history-link');
        if (historyLink) {
            historyLink.addEventListener('click', (event) => {
                event.preventDefault();
                navigateTo('history');
            });
        }

    
    
        console.log('Nav links updated:', navLinks.innerHTML); // Debugging
    
    }


    function editPool(pool) {
        const content = document.getElementById('content');
        content.innerHTML = `
            <section id="edit-pool">
                <h2>Edit Pool</h2>
                <form id="editPoolForm">
                    <input type="text" id="driverName" name="driverName" value="${pool.driverName}" required>
                    <input type="text" id="driverPhone" name="driverPhone" value="${pool.driverPhone}" required>
                    <textarea id="driverNote" name="driverNote">${pool.driverNote}</textarea>
                    <input type="text" id="pickupLocation" name="pickupLocation" value="${pool.pickupLocation}" required>
                    <input type="text" id="dropLocation" name="dropLocation" value="${pool.dropLocation}" required>
                    <input type="datetime-local" id="time" name="time" value="${pool.time.slice(0, 16)}" required>
                    <input type="number" id="seats" name="seats" min="1" max="6" value="${pool.seats}" required>
                    <button type="submit">Update Pool</button>
                </form>
            </section>
        `;
        document.getElementById('editPoolForm').addEventListener('submit', (event) => updatePool(event, pool._id));
    }
    
    async function updatePool(event, poolId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const updatedPool = Object.fromEntries(formData.entries());
    
        try {
            console.log('Sending update request for pool:', poolId);
            console.log('Updated pool data:', updatedPool);
    
            const response = await fetch(`/api/pools/${poolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedPool),
            });
    
            console.log('Server response status:', response.status);
    
            const responseData = await response.json();
            console.log('Server response data:', responseData);
    
            if (response.ok) {
                alert('Pool updated successfully');
                navigateTo('pool-status');
            } else {
                alert(`Failed to update pool: ${responseData.message || responseData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating pool:', error);
            alert(`Failed to update pool. Error: ${error.message}`);
        }
    }

    

    
    async function acceptRequest(requestId, poolId) {
        try {
            console.log(`Sending request to accept requestId: ${requestId} for poolId: ${poolId}`);
    
            const response = await fetch(`/api/pools/${poolId}/requests/${requestId}/accept`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            console.log(`Response status: ${response.status}`);
    
            const result = await response.json();
    
            if (!response.ok) {
                console.error('Error response data:', result);
                throw new Error(result.message || `Failed to accept request. HTTP status ${response.status}`);
            }
    
            console.log('Accept request result:', result);
    
            // Update the UI immediately
            updateUIAfterAccept(requestId, poolId, result);
    
            // Optionally, refresh the available pools list
            await fetchAvailablePools();
    
        } catch (error) {
            console.error('Error accepting request:', error);
            alert(error.message || 'Error accepting request. Please try again.');
        }
    }
    
    function updateUIAfterAccept(requestId, poolId, result) {
        const poolElement = document.querySelector(`li[data-pool-id="${poolId}"]`);
        if (!poolElement) {
            console.warn(`Pool element not found for poolId: ${poolId}`);
            return;
        }
    
        const requestElement = poolElement.querySelector(`li[data-request-id="${requestId}"]`);
        if (!requestElement) {
            console.warn(`Request element not found for requestId: ${requestId}`);
            return;
        }
    
        // Update request status
        const statusElement = requestElement.querySelector('.request-status');
        if (statusElement) {
            statusElement.textContent = 'Accepted';
        }
    
        // Remove the Accept button
        const acceptButton = requestElement.querySelector(`button[id^="acceptButton_"]`);
        if (acceptButton) {
            acceptButton.remove();
        }
    
        // Update available seats
        const seatsElement = poolElement.querySelector('.seats-available');
        if (seatsElement) {
            seatsElement.textContent = result.remainingSeats;
        }
    
        // Hide the delete button if there's an accepted request
        const deleteButton = poolElement.querySelector(`button[id^="deleteButton_"]`);
        if (deleteButton) {
            deleteButton.style.display = 'none';
        }
    
        // If the pool was completed, remove it from the list
        if (result.poolCompleted) {
            alert('Pool completed and moved to history as all seats are filled');
            poolElement.remove();
        }
    }
    


    async function signup(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const mobileNumber = document.getElementById('mobileNumber').value;
        const optionalMobileNumber = document.getElementById('optionalMobileNumber').value;
    
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, firstName, lastName, mobileNumber, optionalMobileNumber }),
            });
    
            if (response.ok) {
                const data = await response.json();
                alert('Signup successful');
                navigateTo('home');
            } else {
                const errorData = await response.json();
                alert(`Signup failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('Signup failed. Please try again.');
        }
    }


    async function hasCreatedPool(userId) {
        try {
            const response = await fetch(`/api/pools?createdBy=${userId}`);
            if (response.ok) {
                const pools = await response.json();
                return pools.length > 0;
            }
        } catch (error) {
            console.error('Error checking user created pools:', error);
        }
        return false;
    }
    

    async function userHasCreatedPoolsOrCustomRequests(userId) {
        try {
            const [poolsResponse, customRequestsResponse] = await Promise.all([
                fetch(`/api/pools?createdBy=${userId}`),
                fetch('/api/custom-requests')
            ]);
            
            if (poolsResponse.ok && customRequestsResponse.ok) {
                const pools = await poolsResponse.json();
                const customRequests = await customRequestsResponse.json();
                return pools.length > 0 || customRequests.length > 0;
            }
        } catch (error) {
            console.error('Error checking user created pools or custom requests:', error);
        }
        return false;
    }
    
    

    async function deletePool(poolId) {
        try {
            const response = await fetch(`/api/pools/${poolId}`, {
                method: 'DELETE',
            });
    
            if (response.ok) {
                alert('Pool deleted successfully');
                navigateTo('pool-status'); // Refresh pool status after deletion
            } else {
                const errorData = await response.json();
                alert(`Failed to delete pool: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error deleting pool:', error);
            alert('Failed to delete pool. Please try again.');
        }
    }
     




async function isLoggedIn() {
    try {
        const response = await fetch('/api/isLoggedIn');
        if (response.ok) {
            const user = await response.json();
            console.log('Logged in user:', user); // Debugging
            return user;
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
    return null;
}




async function login(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            alert('Login successful');
            navigateTo('home');
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Login failed. Please try again.');
    }
}

async function logout(userId) {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: userId }) // Sending user id in the request body
        });

        if (response.ok) {
            alert('Logout successful');
            navigateTo('home');
        } else {
            const errorData = await response.json();
            alert(`Logout failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Logout failed. Please try again.');
    }
}



async function createPool(event) {
    event.preventDefault();
    const driverName = document.getElementById('driverName').value;
    const driverPhone = document.getElementById('driverPhone').value;
    const driverNote = document.getElementById('driverNote').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const dropLocation = document.getElementById('dropLocation').value;
    const time = document.getElementById('time').value;
    const seats = document.getElementById('seats').value;

    try {
        // Check if the user has already created a pool
        const hasPool = await hasCreatedPool(loggedInUser.id);
        if (hasPool) {
            alert('You have already created a pool. You cannot create another one.');
            return; // Exit function if user has already created a pool
        }

        const response = await fetch('/api/pools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ driverName, driverPhone, driverNote, pickupLocation, dropLocation, time, seats }),
        });

        if (response.ok) {
            alert('Pool created successfully');
            navigateTo('pool-status');
        } else {
            const errorData = await response.json();
            alert(`Failed to create pool: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error creating pool:', error);
        alert('Failed to create pool. Please try again.');
    }
}


//Requesting a ride
async function requestRide(event) {
    event.preventDefault();
    const poolId = document.getElementById('pool')?.value || 'custom';
    const riderName = document.getElementById('riderName').value;
    const riderPhone = document.getElementById('riderPhone').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const dropLocation = document.getElementById('dropLocation').value;
    const numberOfPersons = parseInt(document.getElementById('numberOfPersons').value);
    const requestTime = document.getElementById('requestTime').value;
    const requestNote = document.getElementById('requestNote').value;

    if (isNaN(numberOfPersons) || numberOfPersons <= 0) {
        alert('Please enter a valid number of persons');
        return;
    }

    try {
        const endpoint = poolId === 'custom' ? '/api/custom-requests' : `/api/pools/${poolId}/requests`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                riderName, 
                riderPhone, 
                pickupLocation, 
                dropLocation, 
                numberOfPersons, 
                requestTime,
                requestNote,
                isCustomRequest: poolId === 'custom'
            }),
        });

        if (response.ok) {
            const requestData = await response.json();
            alert('Ride requested successfully');
            
            if (poolId !== 'custom') {
                // Check if the pool's seat count has become zero
                const updatedPoolResponse = await fetch(`/api/pools/${poolId}`);
                if (updatedPoolResponse.ok) {
                    const updatedPool = await updatedPoolResponse.json();
                    if (updatedPool.seats === 0) {
                        // Move the pool to history
                        await completePool(poolId);
                    }
                }
            }
            
            navigateTo('home');
        } else {
            const errorData = await response.json();
            alert(`Failed to request ride: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error requesting ride:', error);
        alert('Failed to request ride. Please try again.');
    }
}

async function createCustomRequest(event) {
    event.preventDefault();
    const riderName = document.getElementById('riderName').value;
    const riderPhone = document.getElementById('riderPhone').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const dropLocation = document.getElementById('dropLocation').value;
    const numberOfPersons = parseInt(document.getElementById('numberOfPersons').value);
    const requestTime = document.getElementById('requestTime').value;
    const requestNote = document.getElementById('requestNote').value;

    if (isNaN(numberOfPersons) || numberOfPersons <= 0) {
        alert('Please enter a valid number of persons');
        return;
    }

    try {
        const response = await fetch('/api/custom-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                riderName,
                riderPhone,
                pickupLocation,
                dropLocation,
                numberOfPersons,
                requestTime,
                requestNote
            }),
        });

        if (response.ok) {
            const requestData = await response.json();
            alert('Custom ride request created successfully');
            navigateTo('pool-status'); // Refresh the pool status
        } else {
            const errorData = await response.json();
            alert(`Failed to create custom ride request: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error creating custom request:', error);
        alert('Failed to create custom ride request. Please try again.');
    }
}


async function fetchAvailablePools() {
    try {
        console.log('Fetching available pools...');
        const response = await fetch('/api/pools');
        console.log('Response status:', response.status);
        if (response.ok) {
            pools = await response.json();
            console.log('Fetched pools:', pools);
            // Filter out pools with zero seats
            pools = pools.filter(pool => pool.seats > 0);
            console.log('Filtered pools:', pools);
            
            // Group pools by route
            const poolsByRoute = {};
            pools.forEach(pool => {
                const route = `${pool.pickupLocation} to ${pool.dropLocation}`;
                if (!poolsByRoute[route]) {
                    poolsByRoute[route] = [];
                }
                poolsByRoute[route].push(pool);
            });
            console.log('Pools by route:', poolsByRoute);

            const availablePoolsList = document.getElementById('availablePoolsList');
            if (availablePoolsList) {
                availablePoolsList.innerHTML = Object.entries(poolsByRoute).map(([route, routePools]) => {
                    const routeId = route.replace(/\s/g, '_');
                    return `
                        <li>
                            <h3>${route}</h3>
                            <button id="toggleButton_${routeId}">Show Details</button>
                            <button onclick="navigateTo('request-ride', '${routeId}')">Request Ride</button>
                            <ul id="${routeId}" style="display: none;">
                                ${routePools.map(pool => `
                                    <li>
                                        <strong>${pool.driverName}</strong> is offering a ride at ${new Date(pool.time).toLocaleString()}.
                                        <br>Seats Available: ${pool.seats}
                                        <br>Driver Phone: ${pool.driverPhone}
                                        <br>Driver Note: ${pool.driverNote || 'N/A'}
                                    </li>
                                `).join('')}
                            </ul>
                        </li>
                    `;
                }).join('') + `
                    <li>
                        <h3>Other</h3>
                        <button type="button" onclick="navigateTo('custom-request-ride')">Request Custom Ride</button>
                    </li>
                `;

                // Add event listeners to toggle buttons
                Object.keys(poolsByRoute).forEach(route => {
                    const routeId = route.replace(/\s/g, '_');
                    const toggleButton = document.getElementById(`toggleButton_${routeId}`);
                    if (toggleButton) {
                        toggleButton.addEventListener('click', () => toggleRouteDetails(routeId));
                    }
                });
            } else {
                console.error('availablePoolsList element not found');
            }
        } else {
            console.error('Failed to fetch pools:', await response.text());
            alert('Failed to fetch pools');
        }
    } catch (error) {
        console.error('Error fetching pools:', error);
    }
}

function toggleRouteDetails(routeId) {
    const routeElement = document.getElementById(routeId);
    if (routeElement) {
        const isHidden = routeElement.style.display === 'none';
        routeElement.style.display = isHidden ? 'block' : 'none';
        
        // Update button text
        const toggleButton = document.getElementById(`toggleButton_${routeId}`);
        if (toggleButton) {
            toggleButton.textContent = isHidden ? 'Hide Details' : 'Show Details';
        }
    }
}


async function userHasRequests(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/requests`);
        if (response.ok) {
            const requests = await response.json();
            return requests.length > 0;
        }
    } catch (error) {
        console.error('Error checking user requests:', error);
    }
    return false;
}

async function fetchUserRequests(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/requests`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const requests = await response.json();
        console.log('Fetched requests:', requests);

        const myRequestsList = document.getElementById('myRequestsList');
        if (myRequestsList) {
            if (requests.length === 0) {
                myRequestsList.innerHTML = '<li>No requests found.</li>';
            } else {
                myRequestsList.innerHTML = requests.map(request => {
                    let driverName = request.driverName || 'Not assigned';
                    let formattedTime = request.time ? new Date(request.time).toLocaleString() : 'Time not set';
                    
                    let driverInfo = '';
                    if (request.status === 'Accepted') {
                        driverInfo += `<br>Driver Phone: ${request.driverPhone || 'Not provided'}`;
                        if (request.driverNote) {
                            driverInfo += `<br>Driver Note: ${request.driverNote}`;
                        }
                    }
                    
                    const deleteButton = request.status !== 'Accepted'
                        ? `<button class="deleteRequestButton" data-request-id="${request._id}">Delete Request</button>`
                        : '<span class="accepted-status">Accepted</span>';
                    
                    const noteDisplay = request.requestNote ? `<br><em>Rider Note: ${request.requestNote}</em>` : '';
                    
                    return `
                        <li data-request-id="${request._id}">
                            <strong>Request:</strong> Ride from ${request.pickupLocation} to ${request.dropLocation}
                            <br>Status: ${request.status}
                            <br>Driver: ${driverName}
                            ${driverInfo}
                            <br>Time: ${formattedTime}
                            <br>Source: ${request.source || (request.isCustomRequest ? 'Custom Request' : 'Unknown')}
                            ${noteDisplay}
                            <br>${deleteButton}
                        </li>
                    `;
                }).join('');

                // Add event listeners for delete buttons
                const deleteButtons = document.querySelectorAll('.deleteRequestButton');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        const requestId = event.target.getAttribute('data-request-id');
                        deleteRequest(requestId);
                    });
                });
            }
        } else {
            console.error('myRequestsList element not found');
        }
    } catch (error) {
        console.error('Error fetching requests:', error);
        alert(`Error fetching requests: ${error.message}. Please try again.`);
    }
}


async function deleteRequest(requestId) {
    try {
        console.log(`Deleting request with ID: ${requestId}`);

        const response = await fetch(`/api/requests/${requestId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Request deleted successfully');
            
            // Remove the request from the UI
            const requestElement = document.querySelector(`li[data-request-id="${requestId}"]`);
            if (requestElement) {
                requestElement.remove();
            }

            // Check if there are no more requests
            const myRequestsList = document.getElementById('myRequestsList');
            if (myRequestsList && myRequestsList.children.length === 0) {
                myRequestsList.innerHTML = '<li>No requests found.</li>';
            }

            alert('Request deleted successfully');
        } else {
            const errorData = await response.json();
            console.error('Failed to delete request:', errorData.message);
            alert(`Failed to delete request: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        alert('Failed to delete request. Please try again.');
    }
}


async function populatePoolOptions(routeId) {
    const poolSelect = document.getElementById('pool');
    if (poolSelect) {
        const route = routeId.replace(/_/g, ' ');
        const [pickupLocation, dropLocation] = route.split(' to ');
        // Filter pools based on the selected route and available seats
        const availablePools = pools.filter(pool => 
            pool.seats > 0 && 
            pool.pickupLocation === pickupLocation && 
            pool.dropLocation === dropLocation
        );
        poolSelect.innerHTML = availablePools.map((pool, index) => `
            <option value="${pool._id}">
                Pool ${index + 1}: ${pool.driverName} - ${new Date(pool.time).toLocaleString()} (${pool.seats} seats)
            </option>
        `).join('');
    }
}




// Update User Information
async function updateUserInfo(event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const optionalMobileNumber = document.getElementById('optionalMobileNumber').value;

    try {
        const response = await fetch('/api/userInfo', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName, mobileNumber, optionalMobileNumber }),
        });

        if (response.ok) {
            alert('User information updated successfully');
            navigateTo('home'); // Navigate to home page or any appropriate page after update
        } else {
            const errorData = await response.json();
            alert(`Failed to update user information: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error updating user information:', error);
        alert('Failed to update user information. Please try again.');
    }
}



async function userHasCreatedPools(userId) {
    try {
        const response = await fetch(`/api/pools?createdBy=${userId}`);
        if (response.ok) {
            const pools = await response.json();
            return pools.length > 0;
        }
    } catch (error) {
        console.error('Error checking user created pools:', error);
    }
    return false;
}



async function acceptCustomRequest(requestId) {
    try {
        const response = await fetch(`/api/custom-requests/${requestId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (response.ok) {
            const result = await response.json();
            alert('Custom request accepted successfully');
            navigateTo('pool-status'); // Refresh the pool status
        } else {
            const errorData = await response.json();
            alert(`Failed to accept request: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error accepting custom request:', error);
        alert('Failed to accept custom request. Please try again.');
    }
}






}