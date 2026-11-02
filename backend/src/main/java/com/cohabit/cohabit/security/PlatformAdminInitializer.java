package com.cohabit.cohabit.security;

import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PlatformAdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public PlatformAdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                    @Value("${cohabit.admin.email:}") String adminEmail,
                                    @Value("${cohabit.admin.password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() || adminPassword.length() < 8) return;
        User admin = userRepository.findByEmail(adminEmail.trim().toLowerCase()).orElseGet(() -> {
            User newAdmin = new User();
            newAdmin.setName("Platform Administrator");
            newAdmin.setEmail(adminEmail.trim().toLowerCase());
            return newAdmin;
        });
        if (!"ADMIN".equals(admin.getRole())) {
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        }
        admin.setRole("ADMIN");
        userRepository.save(admin);
    }
}