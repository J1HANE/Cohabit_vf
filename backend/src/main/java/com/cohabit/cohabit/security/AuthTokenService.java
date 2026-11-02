package com.cohabit.cohabit.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class AuthTokenService {

    private static final long TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
    private final byte[] secret;

    public AuthTokenService(@Value("${cohabit.auth.secret:cohabit-local-development-secret-change-me}") String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("Auth token secret must be at least 32 bytes");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String createToken(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("A valid user id is required");
        }
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                (userId + ":" + (Instant.now().getEpochSecond() + TOKEN_LIFETIME_SECONDS))
                        .getBytes(StandardCharsets.UTF_8));
        return payload + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(sign(payload));
    }

    public Optional<Long> getUserId(String token) {
        if (token == null) return Optional.empty();
        String[] parts = token.split("\\.", -1);
        if (parts.length != 2 || !MessageDigest.isEqual(sign(parts[0]), decode(parts[1]))) {
            return Optional.empty();
        }

        try {
            String[] values = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8).split(":", -1);
            if (values.length != 2) return Optional.empty();
            long userId = Long.parseLong(values[0]);
            long expiresAt = Long.parseLong(values[1]);
            return userId > 0 && expiresAt > Instant.now().getEpochSecond()
                    ? Optional.of(userId)
                    : Optional.empty();
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    private byte[] sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not sign authentication token", exception);
        }
    }

    private byte[] decode(String value) {
        try {
            return Base64.getUrlDecoder().decode(value);
        } catch (IllegalArgumentException exception) {
            return new byte[0];
        }
    }
}