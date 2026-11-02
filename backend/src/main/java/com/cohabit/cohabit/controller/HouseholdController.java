package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Household;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.service.HouseholdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public List<Map<String, Object>> getAllHouseholds(@AuthenticationPrincipal User actor) {
        return householdService.getAllHouseholds().stream()
                .filter(household -> "ADMIN".equals(actor.getRole())
                || household.getId().equals(actor.getHouseholdId()))
                .map(this::toHouseholdMap)
                .collect(Collectors.toList());
    }

    // READ BY ID
    @GetMapping("/{householdId}")
    public ResponseEntity<?> getHousehold(@PathVariable Long householdId, @AuthenticationPrincipal User actor) {
        return householdService.getHouseholdById(householdId)
                .filter(h -> hasAccess(h, actor))
                .map(h -> ResponseEntity.ok(toHouseholdMap(h)))
                .orElse(ResponseEntity.notFound().build());
    }

    // READ MEMBERS
    @GetMapping("/{householdId}/members")
    public ResponseEntity<?> getMembers(@PathVariable Long householdId, @AuthenticationPrincipal User actor) {
        if (!householdId.equals(actor.getHouseholdId()) && !"ADMIN".equals(actor.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        List<User> users = householdService.getHouseholdMembers(householdId);
        return ResponseEntity.ok(users.stream().map(user -> toMemberMap(user, householdId)).collect(Collectors.toList()));
    }

    // CREATE
    @PostMapping
    public ResponseEntity<?> createHousehold(@RequestBody Map<String, Object> payload,
                                             @AuthenticationPrincipal User actor) {
        String name = payload.get("name") != null ? payload.get("name").toString().trim() : "";

        try {
            Household household = householdService.createHousehold(name, actor.getId());
            List<User> members = householdService.getHouseholdMembers(household.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("household", toHouseholdMap(household));
            response.put("members", members.stream().map(member -> toMemberMap(member, household.getId())).collect(Collectors.toList()));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // UPDATE
    @PutMapping("/{householdId}")
    public ResponseEntity<?> updateHousehold(@PathVariable Long householdId, @RequestBody Map<String, Object> payload,
                                             @AuthenticationPrincipal User actor) {
        String name = payload.get("name") != null ? payload.get("name").toString().trim() : "";
        try {
            Household updated = householdService.updateHousehold(householdId, name, actor.getId());
            return ResponseEntity.ok(toHouseholdMap(updated));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE
    @DeleteMapping("/{householdId}")
    public ResponseEntity<?> deleteHousehold(@PathVariable Long householdId, @AuthenticationPrincipal User actor) {
        try {
            householdService.deleteHousehold(householdId, actor.getId());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // JOIN
    @PostMapping("/join")
    public ResponseEntity<?> joinHousehold(@RequestBody Map<String, Object> payload,
                                           @AuthenticationPrincipal User actor) {
        String inviteCode = payload.get("inviteCode") != null
                ? payload.get("inviteCode").toString().trim().toUpperCase()
                : "";

        try {
            Household household = householdService.joinHousehold(inviteCode, actor.getId());
            List<User> members = householdService.getHouseholdMembers(household.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("household", toHouseholdMap(household));
            response.put("members", members.stream().map(member -> toMemberMap(member, household.getId())).collect(Collectors.toList()));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // LEAVE
    @PostMapping("/leave")
    public ResponseEntity<?> leaveHousehold(@AuthenticationPrincipal User actor) {
        try {
            householdService.leaveHousehold(actor.getId());
            return ResponseEntity.ok(Map.of("message", "Successfully left household"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // REGENERATE INVITE CODE
    @PostMapping("/{householdId}/regenerate-code")
    public ResponseEntity<?> regenerateInviteCode(@PathVariable Long householdId,
                                                  @AuthenticationPrincipal User actor) {
        try {
            Household household = householdService.regenerateInviteCode(householdId, actor.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("household", toHouseholdMap(household));
            response.put("inviteCode", household.getInviteCode());
            response.put("message", "New invitation code generated successfully");
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{householdId}/members/{memberId}")
    public ResponseEntity<?> removeMember(@PathVariable Long householdId, @PathVariable Long memberId,
                                          @AuthenticationPrincipal User actor) {
        try {
            householdService.removeMember(householdId, memberId, actor.getId());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{householdId}/administrator/{memberId}")
    public ResponseEntity<?> appointAdministrator(@PathVariable Long householdId, @PathVariable Long memberId,
                                                  @AuthenticationPrincipal User actor) {
        try {
            Household updated = householdService.appointAdministrator(householdId, memberId, actor.getId());
            return ResponseEntity.ok(toHouseholdMap(updated));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private Map<String, Object> toHouseholdMap(Household h) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", h.getId());
        map.put("name", h.getName());
        map.put("invite_code", h.getInviteCode());
        map.put("administrator_id", h.getAdministratorId());
        map.put("created_at", h.getCreatedAt());
        return map;
    }

    private Map<String, Object> toMemberMap(User u, Long householdId) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("color", u.getColor());
        map.put("household_id", u.getHouseholdId());
        map.put("is_administrator", householdService.getHouseholdById(householdId)
                .map(household -> u.getId().equals(household.getAdministratorId())).orElse(false));
        return map;
    }

    private boolean hasAccess(Household household, User actor) {
        return "ADMIN".equals(actor.getRole()) || actor.getId().equals(household.getAdministratorId())
                || household.getId().equals(actor.getHouseholdId());
    }

}
