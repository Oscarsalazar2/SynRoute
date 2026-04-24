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
