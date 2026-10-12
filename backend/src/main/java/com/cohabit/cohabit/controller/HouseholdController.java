package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Household;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.service.HouseholdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/households")
public class HouseholdController {

    private final HouseholdService householdService;

    @Autowired
    public HouseholdController(HouseholdService householdService) {
        this.householdService = householdService;
    }

    // READ ALL
    @GetMapping
    public List<Map<String, Object>> getAllHouseholds() {
        return householdService.getAllHouseholds().stream()
                .map(this::toHouseholdMap)
                .collect(Collectors.toList());
    }

    // READ BY ID
    @GetMapping("/{householdId}")
    public ResponseEntity<?> getHousehold(@PathVariable Long householdId) {
        return householdService.getHouseholdById(householdId)
                .map(h -> ResponseEntity.ok(toHouseholdMap(h)))
                .orElse(ResponseEntity.notFound().build());
    }

    // READ MEMBERS
    @GetMapping("/{householdId}/members")
    public List<Map<String, Object>> getMembers(@PathVariable Long householdId) {
        List<User> users = householdService.getHouseholdMembers(householdId);
        return users.stream().map(this::toMemberMap).collect(Collectors.toList());
    }

    // CREATE
    @PostMapping
    public ResponseEntity<?> createHousehold(@RequestBody Map<String, Object> payload) {
        String name = payload.get("name") != null ? payload.get("name").toString().trim() : "";
        Long userId = toLong(payload.get("userId"));

        try {
            Household household = householdService.createHousehold(name, userId);
            List<User> members = householdService.getHouseholdMembers(household.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("household", toHouseholdMap(household));
            response.put("members", members.stream().map(this::toMemberMap).collect(Collectors.toList()));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // UPDATE
    @PutMapping("/{householdId}")
    public ResponseEntity<?> updateHousehold(@PathVariable Long householdId, @RequestBody Map<String, Object> payload) {
        String name = payload.get("name") != null ? payload.get("name").toString().trim() : "";
        try {
            Household updated = householdService.updateHousehold(householdId, name);
            return ResponseEntity.ok(toHouseholdMap(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE
    @DeleteMapping("/{householdId}")
    public ResponseEntity<?> deleteHousehold(@PathVariable Long householdId) {
        try {
            householdService.deleteHousehold(householdId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // JOIN
    @PostMapping("/join")
    public ResponseEntity<?> joinHousehold(@RequestBody Map<String, Object> payload) {
        String inviteCode = payload.get("inviteCode") != null
                ? payload.get("inviteCode").toString().trim().toUpperCase()
                : "";
        Long userId = toLong(payload.get("userId"));

        try {
            Household household = householdService.joinHousehold(inviteCode, userId);
            List<User> members = householdService.getHouseholdMembers(household.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("household", toHouseholdMap(household));
            response.put("members", members.stream().map(this::toMemberMap).collect(Collectors.toList()));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // LEAVE
    @PostMapping("/leave")
    public ResponseEntity<?> leaveHousehold(@RequestBody Map<String, Object> payload) {
        Long userId = toLong(payload.get("userId"));
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        try {
            householdService.leaveHousehold(userId);
            return ResponseEntity.ok(Map.of("message", "Successfully left household"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // REGENERATE INVITE CODE
    @PostMapping("/{householdId}/regenerate-code")
    public ResponseEntity<?> regenerateInviteCode(@PathVariable Long householdId, @RequestBody(required = false) Map<String, Object> payload) {
        try {
            Household household = householdService.regenerateInviteCode(householdId);

            Map<String, Object> response = new HashMap<>();
            response.put("household", toHouseholdMap(household));
            response.put("inviteCode", household.getInviteCode());
            response.put("message", "New invitation code generated successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
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
