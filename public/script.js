document.addEventListener("DOMContentLoaded", () => {
    navigateTo('home');
});

let pools = [];

async function navigateTo(page) {
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
                        <button onclick="navigateTo('request-ride')">Request Ride</button>
                        <button onclick="navigateTo('available-pools')">Available Pools</button>
                        
                    ` : `
                        <button onclick="navigateTo('create-pool')">Create Pool</button>
                        <button onclick="navigateTo('request-ride')">Request Ride</button>
                    `}
                </div>
            </section>
        `;
        updateNavLinks(loggedInUser, 'home');
    } else  if (page === 'create-pool') {
        if (loggedInUser) {
            // Allow pool creation
            content.innerHTML = `
                <section id="create-pool">
                    <h2>Create a Car Pool</h2>
                    <form id="createPoolForm">
                        <input type="text" id="driverName" name="driverName" placeholder="Driver Name" required>
                        <input type="text" id="driverPhone" name="driverPhone" placeholder="Driver Phone" required>
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
            navigateTo('login');
        }
    } else if (page === 'request-ride') {
        if (loggedInUser) {
            content.innerHTML = `
                <section id="request-ride" style="display: flex;">
                    <div style="flex: 1;">
                        <h2>Request a Ride</h2>
                        <form id="requestRideForm">
                            <select id="pool" name="pool" required></select>
                            <input type="text" id="riderName" name="riderName" placeholder="Name" required>
                            <input type="text" id="riderPhone" name="riderPhone" placeholder="Phone" required>
                            <input type="text" id="pickupLocation" name="pickupLocation" placeholder="Pickup Location" required>
                            <input type="text" id="dropLocation" name="dropLocation" placeholder="Drop Location" required>
                            <input type="number" id="numberOfPersons" name="numberOfPersons" placeholder="Number of Persons" min="1" required>
                            <textarea id="requestNote" name="requestNote" placeholder="Request Note"></textarea>
                            <button type="submit">Request Ride</button>
                        </form>
                    </div>
                    <div style="flex: 1;">
                        <h2>Available Pools</h2>
                        <ul id="availablePools"></ul>
                    </div>
                </section>
            `;
            document.getElementById('requestRideForm').addEventListener('submit', requestRide);
            await fetchAvailablePools();
            await populatePoolOptions();
            updateNavLinks(loggedInUser, 'request-ride');

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
    } else if (page === 'available-pools') {
        await fetchAvailablePools();
        content.innerHTML = `
            <section id="available-pools">
                <h2>Available Pools</h2>
                <ul id="availablePoolsList">
                    ${pools.map((pool, index) => `
                        <li>
                            <strong>Pool ${index + 1}:</strong> ${pool.driverName} is offering a ride from ${pool.pickupLocation} to ${pool.dropLocation} at ${new Date(pool.time).toLocaleString()}.
                            <br>Seats Available: ${pool.seats}
                        </li>
                    `).join('')}
                </ul>
            </section>
        `;
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
            const poolStatusResponse = await fetch(`/api/pools?createdBy=${loggedInUser.id}`);
            if (poolStatusResponse.ok) {
                const pools = await poolStatusResponse.json();
    
                content.innerHTML = `
    <section id="pool-status">
        <h2>Pool Status</h2>
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
                                    ${request.status === 'Pending' ? `<button id="acceptButton_${request._id}" data-request-id="${request._id}" data-pool-id="${pool._id}">Accept</button>` : ''}
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
    </section>
`;
    
                // Add event listeners for buttons
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
                        }
                    });
                });
            }
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
        const hasCreatedPools = await userHasCreatedPools(loggedInUser?.id); // Check if user has created pools
    
        if (loggedInUser) {
            navLinks.innerHTML = `
                <li><a href="#" onclick="navigateTo('home')" ${currentPage === 'home' ? 'class="active"' : ''}>Home</a></li>
                ${hasRequests ? `<li><a href="#" onclick="navigateTo('my-requests')" ${currentPage === 'my-requests' ? 'class="active"' : ''}>My Requests</a></li>` : ''}
                ${hasCreatedPools ? `<li><a href="#" onclick="navigateTo('pool-status')" ${currentPage === 'pool-status' ? 'class="active"' : ''}>Pool Status</a></li>` : ''}
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
    const poolId = document.getElementById('pool').value;
    const riderName = document.getElementById('riderName').value;
    const riderPhone = document.getElementById('riderPhone').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const dropLocation = document.getElementById('dropLocation').value;
    const numberOfPersons = parseInt(document.getElementById('numberOfPersons').value);
    const requestNote = document.getElementById('requestNote').value;

    if (isNaN(numberOfPersons) || numberOfPersons <= 0) {
        alert('Please enter a valid number of persons');
        return;
    }

    try {
        const response = await fetch(`/api/pools/${poolId}/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ riderName, riderPhone, pickupLocation, dropLocation, numberOfPersons, requestNote }),
        });

        if (response.ok) {
            const requestData = await response.json();
            alert('Ride requested successfully');
            
            // Check if the pool's seat count has become zero
            const updatedPoolResponse = await fetch(`/api/pools/${poolId}`);
            if (updatedPoolResponse.ok) {
                const updatedPool = await updatedPoolResponse.json();
                if (updatedPool.seats === 0) {
                    // Move the pool to history
                    await completePool(poolId);
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


async function fetchAvailablePools() {
    try {
        const response = await fetch('/api/pools');
        if (response.ok) {
            pools = await response.json();
            // Filter out pools with zero seats
            pools = pools.filter(pool => pool.seats > 0);
            const availablePoolsList = document.getElementById('availablePoolsList');
            if (availablePoolsList) {
                availablePoolsList.innerHTML = pools.map(pool => {
                    const requestStatus = pool.requests.find(req => req.riderName === loggedInUser.name);
                    let statusText = '';
                    if (requestStatus) {
                        statusText = requestStatus.status === 'Accepted' ? 'Accepted' : 'Pending';
                    }
                    return `
                        <li>
                            <strong>${pool.driverName}</strong> is offering a ride from ${pool.pickupLocation} to ${pool.dropLocation} at ${new Date(pool.time).toLocaleString()}.
                            <br>Seats Available: ${pool.seats}
                            <br>Status: ${statusText}
                            ${requestStatus && requestStatus.status === 'Pending' ? `<button onclick="cancelRequest('${pool._id}', '${requestStatus._id}')">Cancel Request</button>` : ''}
                        </li>
                    `;
                }).join('');
            }
        } else {
            alert('Failed to fetch pools');
        }
    } catch (error) {
        console.error('Error fetching pools:', error);
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
        if (response.ok) {
            const requests = await response.json();
            const myRequestsList = document.getElementById('myRequestsList');
            if (myRequestsList) {
                myRequestsList.innerHTML = requests.map(request => {
                    const deleteButton = request.status !== 'Accepted'
                        ? `<button id="deleteRequest_${request._id}" data-request-id="${request._id}" onclick="deleteRequest('${request._id}')">Delete Request</button>`
                        : '<span class="accepted-status">Accepted</span>';
                    
                    const formattedTime = request.time ? new Date(request.time).toLocaleString() : 'Time not set';
                    
                    return `
                        <li>
                            <strong>Request:</strong> Ride from ${request.pickupLocation} to ${request.dropLocation} at ${formattedTime}.
                            <br>Status: ${request.status}
                            <br>Driver: ${request.driverName || 'Not assigned'}
                            <br>${deleteButton}
                        </li>
                    `;
                }).join('');

                // Add event listeners for delete buttons
                requests.forEach(request => {
                    if (request.status !== 'Accepted') {
                        const deleteButton = document.getElementById(`deleteRequest_${request._id}`);
                        if (deleteButton) {
                            deleteButton.addEventListener('click', () => {
                                deleteRequest(request._id);
                            });
                        }
                    }
                });
            }
        } else {
            console.error('Failed to fetch requests:', await response.text());
            alert('Failed to fetch requests');
        }
    } catch (error) {
        console.error('Error fetching requests:', error);
        alert('Error fetching requests. Please try again.');
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
            alert('Request deleted successfully');
            navigateTo('my-requests'); // Refresh my requests after deletion
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


async function populatePoolOptions() {
    const poolSelect = document.getElementById('pool');
    if (poolSelect) {
        // Filter out pools with zero seats
        const availablePools = pools.filter(pool => pool.seats > 0);
        poolSelect.innerHTML = availablePools.map((pool, index) => `
            <option value="${pool._id}">
                Pool ${index + 1}: ${pool.driverName} - ${pool.pickupLocation} to ${pool.dropLocation} at ${new Date(pool.time).toLocaleString()}
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







}