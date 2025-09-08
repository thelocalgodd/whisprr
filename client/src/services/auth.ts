import api from "@/utils/axios";

interface User {
  username: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}

const Login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with a status other than 2xx
      return {
        success: false,
        message: error.response.data?.message || "Login failed. Please try again.",
        user: {
          username: "",
          role: "",
        },
        token: "",
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        message: "No response from server. Please check your network connection.",
        user: {
          username: "",
          role: "",
        },
        token: "",
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: "An unexpected error occurred during login.",
        user: {
          username: "",
          role: "",
        },
        token: "",
      };
    }
  }
};

const Register = async (
  username: string,
  password: string,
  role: string
): Promise<RegisterResponse> => {
  try {
    const response = await api.post("/auth/register", {
      username,
      password,
      role,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Registration failed. Please try again."
      );
    } else if (error.request) {
      throw new Error(
        "No response from server. Please check your network connection."
      );
    } else {
      throw new Error("An unexpected error occurred during registration.");
    }
  }
};

const Logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Logout failed. Please try again."
      );
    } else if (error.request) {
      throw new Error(
        "No response from server. Please check your network connection."
      );
    } else {
      throw new Error("An unexpected error occurred during logout.");
    }
  }
};

export { Login, Register, Logout };
export type { User, LoginResponse, RegisterResponse };