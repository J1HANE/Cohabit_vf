package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Household;
import com.cohabit.cohabit.entity.Complaint;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.ComplaintRepository;
import com.cohabit.cohabit.repository.HouseholdRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final ComplaintRepository complaintRepository;

    @Autowired
    public AdminController(UserRepository userRepository, HouseholdRepository householdRepository, ComplaintRepository complaintRepository) {
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.complaintRepository = complaintRepository;
    }

    // ==================== USER MANAGEMENT ====================

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/users/search")
    public List<User> searchUsers(@RequestParam String query) {
        return userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return userRepository.findById(id)
                .map(user -> {
                    if (updates.containsKey("name")) {
                        user.setName(updates.get("name").toString());
                    }
                    if (updates.containsKey("email")) {
                        user.setEmail(updates.get("email").toString());
                    }
                    if (updates.containsKey("role")) {
                        user.setRole(updates.get("role").toString());
                    }
                    User saved = userRepository.save(user);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setSuspended(true);
                    user.setSuspendedAt(LocalDateTime.now());
                    User saved = userRepository.save(user);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/reactivate")
    public ResponseEntity<?> reactivateUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setSuspended(false);
                    user.setSuspendedAt(null);
                    User saved = userRepository.save(user);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== HOUSEHOLD MANAGEMENT ====================

    @GetMapping("/households")
    public List<Household> getAllHouseholds() {
        return householdRepository.findAll();
    }

    @GetMapping("/households/search")
    public List<Household> searchHouseholds(@RequestParam String query) {
        return householdRepository.findByNameContainingIgnoreCase(query);
    }

    @GetMapping("/households/{id}")
    public ResponseEntity<?> getHousehold(@PathVariable Long id) {
        return householdRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/households/{id}/members")
    public List<User> getHouseholdMembers(@PathVariable Long id) {
        return userRepository.findByHouseholdId(id);
    }

    @PutMapping("/households/{id}")
    public ResponseEntity<?> updateHousehold(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return householdRepository.findById(id)
                .map(household -> {
                    if (updates.containsKey("name")) {
                        household.setName(updates.get("name").toString());
                    }
                    Household saved = householdRepository.save(household);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/households/{id}/suspend")
    public ResponseEntity<?> suspendHousehold(@PathVariable Long id) {
        return householdRepository.findById(id)
                .map(household -> {
                    household.setSuspended(true);
                    household.setSuspendedAt(LocalDateTime.now());
                    Household saved = householdRepository.save(household);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/households/{id}")
    public ResponseEntity<Void> deleteHousehold(@PathVariable Long id) {
        if (householdRepository.existsById(id)) {
            householdRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== COMPLAINT MANAGEMENT ====================

    @GetMapping("/complaints")
    public ResponseEntity<?> getComplaints(@RequestParam(defaultValue = "ALL") String status) {
        String normalizedStatus = status.toUpperCase();
        if (!Set.of("ALL", "OPEN", "IN_REVIEW", "RESOLVED").contains(normalizedStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid complaint status"));
        }
        List<Complaint> complaints = complaintRepository.findAllWithUser();
        return ResponseEntity.ok(complaints.stream()
                .filter(complaint -> normalizedStatus.equals("ALL") || complaint.getStatus().equals(normalizedStatus))
                .map(this::toComplaintResponse)
                .toList());
    }

    @Transactional
    @PutMapping("/complaints/{id}")
    public ResponseEntity<?> updateComplaint(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        Complaint complaint = complaintRepository.findWithUserById(id).orElse(null);
        if (complaint == null) {
            return ResponseEntity.notFound().build();
        }

        if (updates.containsKey("status")) {
            String status = updates.get("status").toUpperCase();
            if (!Set.of("OPEN", "IN_REVIEW", "RESOLVED").contains(status)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid complaint status"));
            }
            complaint.setStatus(status);
        }
        if (updates.containsKey("adminResponse")) {
            String response = updates.get("adminResponse").trim();
            if (response.length() > 5000) {
                return ResponseEntity.badRequest().body(Map.of("error", "Response must be 5000 characters or fewer"));
            }
            complaint.setAdminResponse(response.isEmpty() ? null : response);
        }

        return ResponseEntity.ok(toComplaintResponse(complaintRepository.save(complaint)));
    }

    private Map<String, Object> toComplaintResponse(Complaint complaint) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", complaint.getId());
        response.put("userId", complaint.getUserId());
        response.put("userName", complaint.getUser().getName());
        response.put("userEmail", complaint.getUser().getEmail());
        response.put("category", complaint.getCategory());
        response.put("subject", complaint.getSubject());
        response.put("description", complaint.getDescription());
        response.put("status", complaint.getStatus());
        response.put("adminResponse", complaint.getAdminResponse());
        response.put("createdAt", complaint.getCreatedAt());
        response.put("updatedAt", complaint.getUpdatedAt());
        return response;
    }

    // ==================== PLATFORM STATISTICS ====================

    @GetMapping("/stats")
    public Map<String, Object> getPlatformStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long totalHouseholds = householdRepository.count();
        long suspendedUsers = userRepository.countBySuspendedTrue();
        long suspendedHouseholds = householdRepository.countBySuspendedTrue();
        long activeUsers = totalUsers - suspendedUsers;
        long activeHouseholds = totalHouseholds - suspendedHouseholds;

        stats.put("totalUsers", totalUsers);
        stats.put("totalHouseholds", totalHouseholds);
        stats.put("activeUsers", activeUsers);
        stats.put("activeHouseholds", activeHouseholds);
        stats.put("suspendedUsers", suspendedUsers);
        stats.put("suspendedHouseholds", suspendedHouseholds);
        stats.put("totalComplaints", complaintRepository.count());
        stats.put("openComplaints", complaintRepository.countByStatus("OPEN"));
        stats.put("inReviewComplaints", complaintRepository.countByStatus("IN_REVIEW"));
        stats.put("resolvedComplaints", complaintRepository.countByStatus("RESOLVED"));

        return stats;
    }

    @GetMapping("/stats/activity")
    public Map<String, Object> getActivityStats() {
        Map<String, Object> stats = new HashMap<>();

        // Count users created in last 7 days
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long newUsersLastWeek = userRepository.countByCreatedAtAfter(weekAgo);
        long newHouseholdsLastWeek = householdRepository.countByCreatedAtAfter(weekAgo);
        long newComplaintsLastWeek = complaintRepository.countByCreatedAtAfter(weekAgo);

        stats.put("newUsersLastWeek", newUsersLastWeek);
        stats.put("newHouseholdsLastWeek", newHouseholdsLastWeek);
        stats.put("newComplaintsLastWeek", newComplaintsLastWeek);

        return stats;
    }
}
