const API_URL = 'http://localhost:8081/api/households';

export const getHouseholds = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch households');
    }
    return response.json();
};

export const getHousehold = async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch household with id ${id}`);
    }
    return response.json();
};

export const getHouseholdMembers = async (householdId) => {
    const response = await fetch(`${API_URL}/${householdId}/members`);
    if (!response.ok) {
        throw new Error('Failed to fetch household members');
    }
    return response.json();
};

export const createHousehold = async (name, userId) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, userId }),
    });
    if (!response.ok) {
        throw new Error('Failed to create household');
    }
    return response.json();
};

export const updateHousehold = async (id, name) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        throw new Error(`Failed to update household with id ${id}`);
    }
    return response.json();
};

export const deleteHousehold = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete household with id ${id}`);
    }
};

export const joinHousehold = async (inviteCode, userId) => {
    const response = await fetch(`${API_URL}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode, userId }),
    });
    if (!response.ok) {
        throw new Error('Failed to join household');
    }
    return response.json();
};

export const leaveHousehold = async (userId) => {
    const response = await fetch(`${API_URL}/leave`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        throw new Error('Failed to leave household');
    }
    return response.json();
};

export const regenerateInviteCode = async (householdId) => {
    const response = await fetch(`${API_URL}/${householdId}/regenerate-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Failed to regenerate invite code');
    }
    return response.json();
};
