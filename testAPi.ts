import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

interface RegisterResponse {
    email: string;
    name: string;
    id: string;
    token?: string; // Adjust based on your API response
}

interface LoginResponse {
    token: string;
    message?: string;
}

interface MeResponse {
    user: {
        id: string;
        email: string;
        name: string;
        [key: string]: any;
    };
    error?: string;
}

async function userRouteTest() {
    try {
        // Step 1: Register a new user
        const registerResponse = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testuser@example.com',
                password: 'password123',
                name: 'Test User',
            }),
        });

        const registerData: RegisterResponse = await registerResponse.json();
        console.log('Register response:', registerData);

        if (!registerResponse.ok) {
            throw new Error(`Register failed: ${registerData}`);
        }

        // Step 2: Log in to get a token
        const loginResponse = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testuser@example.com',
                password: 'password123',
            }),
        });

        const loginData: LoginResponse = await loginResponse.json();
        console.log('Login response:', loginData);

        if (!loginResponse.ok || !loginData.token) {
            throw new Error('Login failed or token missing');
        }

        const token = loginData.token;

        // Step 3: Use the token to access the /me endpoint
        const meResponse = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const meData: MeResponse = await meResponse.json();
        console.log('Me response:', meData);

        if (!meResponse.ok) {
            throw new Error(`Failed to retrieve /me: ${meData.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

userRouteTest();
