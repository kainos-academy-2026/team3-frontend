import axios from "axios";

const apiClient = axios.create({
	baseURL: process.env.BACKEND_API ?? "http://localhost:4000/api",
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 5000,
});

export default apiClient;
