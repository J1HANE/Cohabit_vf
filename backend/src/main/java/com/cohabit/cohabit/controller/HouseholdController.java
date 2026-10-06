package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Household;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.HouseholdRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/households")
public class HouseholdController {

    private static final String INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @GetMapping("/{householdId}")
    public ResponseEntity<?> getHousehold(@PathVariable Long householdId) {
        return householdRepository.findById(householdId)
                .map(h -> ResponseEntity.ok(toHouseholdMap(h)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{householdId}/members")
    public List<Map<String, Object>> getMembers(@PathVariable Long householdId) {
        List<User> users = userRepository.findByHouseholdId(householdId);
        return users.stream().map(this::toMemberMap).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> createHousehold(@RequestBody Map<String, Object> payload) {
        String name = payload.get("name") != null ? payload.get("name").toString().trim() : "";
        Long userId = toLong(payload.get("userId"));

        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Household name is required"));
        }
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        if (user.getHouseholdId() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User already belongs to a household"));
        }

        Household household = new Household();
        household.setName(name);
        household.setInviteCode(generateUniqueInviteCode());
        household = householdRepository.save(household);

        user.setHouseholdId(household.getId());
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("household", toHouseholdMap(household));
        response.put("members", List.of(toMemberMap(user)));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinHousehold(@RequestBody Map<String, Object> payload) {
        String inviteCode = payload.get("inviteCode") != null
                ? payload.get("inviteCode").toString().trim().toUpperCase()
                : "";
        Long userId = toLong(payload.get("userId"));

        if (inviteCode.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invitation code is required"));
        }
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        if (user.getHouseholdId() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User already belongs to a household"));
        }

        Household household = householdRepository.findByInviteCode(inviteCode).orElse(null);
        if (household == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid invitation code"));
        }

        user.setHouseholdId(household.getId());
        userRepository.save(user);

        List<Map<String, Object>> members = userRepository.findByHouseholdId(household.getId())
                .stream().map(this::toMemberMap).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("household", toHouseholdMap(household));
        response.put("members", members);
        return ResponseEntity.ok(response);
    }

    private String generateUniqueInviteCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = randomInviteCode(6);
            if (householdRepository.findByInviteCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate a unique invite code");
    }

    private String randomInviteCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(INVITE_ALPHABET.charAt(RANDOM.nextInt(INVITE_ALPHABET.length())));
        }
        return sb.toString();
    }

    private Map<String, Object> toHouseholdMap(Household h) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", h.getId());
        map.put("name", h.getName());
        map.put("invite_code", h.getInviteCode());
        map.put("created_at", h.getCreatedAt());
        return map;
    }

    private Map<String, Object> toMemberMap(User u) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("color", u.getColor());
        map.put("household_id", u.getHouseholdId());
        return map;
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
