import axios from "@/utils/axios";

export const getProfile = async () => {
  try {
    const response = await axios.get("/auth/profile");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await axios.put("/auth/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await axios.put("/auth/change-password", passwordData);
    return response.data;
  } catch (error) {
    console.error("Failed to change password:", error);
    throw error;
  }
};
