import apiClient from "../config/apiClient.js";

interface LoginResponse {
	token: string;
}

export class AuthService {
	async login(email: string, password: string): Promise<LoginResponse> {
		const response = await apiClient.post<LoginResponse>("/auth/login", {
			email,
			password,
		});
		return response.data;
	}
}
