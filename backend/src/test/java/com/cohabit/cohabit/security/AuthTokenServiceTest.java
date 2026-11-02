package com.cohabit.cohabit.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthTokenServiceTest {

    private final AuthTokenService tokenService = new AuthTokenService("test-secret-with-more-than-32-bytes");

    @Test
    void acceptsValidTokenAndRejectsTamperedToken() {
        String token = tokenService.createToken(42L);

        assertEquals(42L, tokenService.getUserId(token).orElseThrow());
        assertTrue(tokenService.getUserId(token + "x").isEmpty());
        assertTrue(tokenService.getUserId("invalid").isEmpty());
    }
}