package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.UserRepository;
import com.cohabit.cohabit.security.AuthTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthTokenService authTokenService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String email = payload.get("email");
        String password = payload.get("password");

        if (name == null || name.isBlank() || email == null || !email.contains("@")
                || password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid name, email, and password are required"));
        }
        name = name.trim();
        email = email.trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("userId", user.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || email.isBlank() || password == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }
        email = email.trim().toLowerCase();

        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPasswordHash())) {
            User user = userOpt.get();
            if (Boolean.TRUE.equals(user.getSuspended())) {
                return ResponseEntity.status(403).body(Map.of("error", "This account is suspended"));
            }
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", authTokenService.createToken(user.getId()));
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("householdId", user.getHouseholdId());
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
    }
}
