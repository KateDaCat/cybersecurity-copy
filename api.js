const API_ORIGIN = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) || "http://192.168.88.39:3000";
const API_BASE_URL = `${API_ORIGIN.replace(/\/$/, "")}/api`;
const JSON_HEADERS = { Accept: "application/json", "Content-Type": "application/json" };

async function handleResponse(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Some endpoints might not return JSON (204, etc.)
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...JSON_HEADERS,
      ...headers,
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse(response);
}

export async function registerUser({ name, email, password, role }) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const payload = {
    email,
    password,
    username: name ?? null,
    role: role ?? "public",
  };

  return request("/auth/register", { method: "POST", body: payload });
}

export async function startPasswordLogin(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function verifyMfaCode(code) {
  if (!code) {
    throw new Error("Verification code is required.");
  }
  return request("/auth/verify-mfa", {
    method: "POST",
    body: { code },
  });
}

export async function fetchCurrentProfile() {
  return request("/auth/me");
}

export async function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}

export async function forgotPassword(_email) {
  throw new Error("Password reset is not available yet.");
}

export async function fetchSensorData() {
  return request("/iot/latest");
}

export async function fetchAllDeviceData() {
  return request("/devices/all");
}

export async function postChatMessage(query) {
  return request("/chat", {
    method: "POST",
    body: { query },
  });
}

export async function resolveAlertsForDevice(deviceId) {
  return request(`/alerts/resolve/device/${deviceId}`, { method: "POST" });
}

export async function fetchDeviceHistory(deviceId, rangeKey) {
  return request(`/devices/${deviceId}/history?range=${rangeKey}`);
}