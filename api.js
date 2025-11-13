// api.js
// All backend API connection functions are stored here

const API_BASE_URL = "http://192.168.88.39:3000/api"; 
// 🔧 Backend team: replace with your actual base URL later

// ======================
// LOGIN FUNCTION
// ======================
const MOCK_ACCOUNTS = {
  "admin@smartplant.dev": { password: "admin123", role: "admin" },
  "ranger@smartplant.dev": { password: "user1234", role: "user" },
};

//mock version for testing
export const loginUser = async (email, password) => {
  const key = email.trim().toLowerCase();
  console.log("Logging in:", key);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const account = MOCK_ACCOUNTS[key];
      if (account && account.password === password) {
        resolve({ success: true, role: account.role, email: key });
      } else {
        reject(new Error("Invalid email or password"));
      }
    }, 700);
  });
};

//handle MFA
export const verifyMFA = async (userId, code) => {
  // This would call your actual backend
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1000);
  });
};

export const resendMFACode = async (userId) => {
  // This would call your actual backend
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1000);
  });
};

//remove mock and use this real one
//export const loginUser = async (email, password) => {
  //try {
    //const response = await fetch(`${API_BASE_URL}/login`, {
      //method: "POST",
      //headers: {
        //"Content-Type": "application/json",
      //},
      //body: JSON.stringify({ email, password }),
    //});

    //if (!response.ok) {
      //throw new Error("Login failed. Please check your credentials.");
    //}

    //const data = await response.json();
    //return data; // backend should return something like { success: true, token: "..." }
  //} catch (error) {
    //console.error("Login API error:", error);
    //throw error;
  //}
//};

// ======================
// SIGN UP FUNCTION
// ======================
// Temporary mock backend
//replace the fake version after come out with the real one
export const registerUser = async (userData) => { 
  console.log("Registering user:", userData);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate success if email not already “taken”
      if (userData.email !== "taken@example.com") {
        resolve({ success: true });
      } else {
        reject(new Error("Email already registered"));
      }
    }, 1000);
  });
};

//replace the api url after this and remove the mock version above
//export const registerUser = async (userData) => {
  //try {
    //const response = await fetch(`${API_BASE_URL}/register`, {
      //method: "POST",
      //headers: {
        //"Content-Type": "application/json",
      //},
      //body: JSON.stringify(userData),
    //});

    //if (!response.ok) {
      //throw new Error("Failed to register. Please try again.");
    //}

    //const data = await response.json();
    //return data;
  //} catch (error) {
    //console.error("Register API error:", error);
    //throw error;
  //}
//};

// ======================
// FORGOT PASSWORD FUNCTION
// ======================
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Failed to send reset link.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Forgot Password API error:", error);
    throw error;
  }
};

// ======================
// IOT SENSOR FUNCTIONS
// ======================

// Fetch all sensor readings
export const fetchSensorData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/iot/latest`);
    if (!response.ok) throw new Error("Failed to fetch sensor data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    throw error;
  }
};

export const fetchAllDeviceData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/all`);
    if (!response.ok) {
      throw new Error('Failed to fetch all device data');
    }
    return await response.json(); // This will be an array
  } catch (error) {
    console.error("Error fetching all device data:", error);
    throw error;
  }
};

export const postChatMessage = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to get chat response');
    }
    
    return response.json();
  } catch (error) {
    console.error("Error in postChatMessage:", error);
    throw error;
  }
};

export const resolveAlertsForDevice = async (deviceId) => {
  try {
    // Note: deviceId here is the raw ID (e.g., 1, 2)
    const response = await fetch(`${API_BASE_URL}/alerts/resolve/device/${deviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to resolve alerts for device');
    }
    return await response.json();
  } catch (error) {
    console.error("Error resolving alerts for device:", error);
    throw error;
  }
};

export const fetchDeviceHistory = async (deviceId, rangeKey) => {
  try {
    // deviceId is the raw ID (e.g., 1), rangeKey is '1H', '24H', or '7D'
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/history?range=${rangeKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch device history');
    }
    return await response.json(); // This will be an array of readings
  } catch (error) {
    console.error("Error fetching device history:", error);
    throw error;
  }
};