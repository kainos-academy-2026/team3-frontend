import apiClient from "../config/apiClient.js";

interface LoginResponse {
	token: string;
	role: string;
}

interface RegisterResponse {
	id: number;
	email: string;
	role: string;
}

export class AuthService {
	async login(email: string, password: string): Promise<LoginResponse> {
		const response = await apiClient.post<LoginResponse>("/auth/login", {
			email,
			password,
		});
		return response.data;
	}

	async register(email: string, password: string): Promise<RegisterResponse> {
		const response = await apiClient.post<RegisterResponse>("/auth/register", {
			email,
			password,
		});
		return response.data;
	}
}
