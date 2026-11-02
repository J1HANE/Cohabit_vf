import { apiFetch } from './api';

const API_URL = 'http://localhost:8081/api/tasks';

export const getTasks = async () => {
    const response = await apiFetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch tasks');
    }
    return response.json();
};

export const getTask = async (id) => {
    const response = await apiFetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch task with id ${id}`);
    }
    return response.json();
};

export const createTask = async (task) => {
    const response = await apiFetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    });
    if (!response.ok) {
        throw new Error('Failed to create task');
    }
    return response.json();
};

export const updateTask = async (id, task) => {
    const response = await apiFetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    });
    if (!response.ok) {
        throw new Error(`Failed to update task with id ${id}`);
    }
    return response.json();
};

export const deleteTask = async (id) => {
    const response = await apiFetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete task with id ${id}`);
    }
};
