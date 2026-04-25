const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Ocurrió un error en la API");
  }

  return data;
};

export const loginUser = async ({ email, password }) => {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.user;
};

export const registerUser = async ({ name, email, password, role }) => {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
  return data.user;
};

export const getUsers = async () => {
  const data = await request("/api/users");
  return data.users || [];
};

export const updateUser = async (id, payload) => {
  const data = await request(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.user;
};

export const deleteUser = async (id) => {
  await request(`/api/users/${id}`, {
    method: "DELETE",
  });
};

export const updateOnboardingProfile = async (id, payload) => {
  const data = await request(`/api/users/${id}/onboarding`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.user;
};

export const getCloudinarySignature = async (folder) => {
  return request("/api/cloudinary/signature", {
    method: "POST",
    body: JSON.stringify({ folder }),
  });
};

export const getRides = async ({ role, userId } = {}) => {
  const search = new URLSearchParams();
  if (role) search.set("role", role);
  if (userId) search.set("userId", String(userId));

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const data = await request(`/api/rides${suffix}`);
  return data.rides || [];
};

export const createRide = async (payload) => {
  const data = await request("/api/rides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.ride;
};

export const updateRide = async (id, payload) => {
  const data = await request(`/api/rides/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.ride;
};

export const deleteRide = async (id, driverId) => {
  const suffix = driverId
    ? `?driverId=${encodeURIComponent(String(driverId))}`
    : "";
  await request(`/api/rides/${id}${suffix}`, {
    method: "DELETE",
  });
};

export const finishRide = async (id, driverId, ratings = []) => {
  return request(`/api/rides/${id}/finish`, {
    method: "POST",
    body: JSON.stringify({ driverId, ratings }),
  });
};

export const getDriverSummary = async (driverId) => {
  const data = await request(
    `/api/drivers/${encodeURIComponent(String(driverId))}/summary`,
  );
  return data.summary || { balance: 0, weeklyIncome: 0, completedRides: 0 };
};

export const getRideRequests = async (driverId) => {
  const data = await request(
    `/api/ride-requests?driverId=${encodeURIComponent(String(driverId))}`,
  );
  return data.requests || [];
};

export const createRideRequest = async ({ rideId, passengerId, message }) => {
  const data = await request("/api/ride-requests", {
    method: "POST",
    body: JSON.stringify({ rideId, passengerId, message }),
  });
  return data.request;
};

export const updateRideRequest = async (id, { driverId, status }) => {
  await request(`/api/ride-requests/${id}`, {
    method: "PUT",
    body: JSON.stringify({ driverId, status }),
  });
};

export const getNotifications = async (userId) => {
  const data = await request(
    `/api/notifications?userId=${encodeURIComponent(String(userId))}`,
  );
  return data.notifications || [];
};

export const markAllNotificationsAsRead = async (userId) => {
  await request("/api/notifications/read-all", {
    method: "PUT",
    body: JSON.stringify({ userId }),
  });
};
