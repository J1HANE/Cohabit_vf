package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Complaint;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.ComplaintRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private static final Set<String> CATEGORIES = Set.of("ACCOUNT", "HOUSEHOLD", "PAYMENT", "BUG", "OTHER", "USER_REPORT");

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintController(ComplaintRepository complaintRepository, UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createComplaint(@RequestBody Map<String, Object> payload,
                                             @AuthenticationPrincipal User actor) {
        String category = text(payload.get("category")).toUpperCase();
        String subject = text(payload.get("subject"));
        String description = text(payload.get("description"));

        if (subject.length() < 5 || subject.length() > 120 || description.length() < 20 || description.length() > 5000 || !CATEGORIES.contains(category)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provide a valid category, a 5-120 character subject, and a 20-5000 character description"));
        }

        User reportedUser = null;
        if ("USER_REPORT".equals(category)) {
            Long reportedUserId = toLong(payload.get("reportedUserId"));
            reportedUser = reportedUserId == null ? null : userRepository.findById(reportedUserId).orElse(null);
            if (reportedUser == null || reportedUserId.equals(actor.getId())
                    || actor.getHouseholdId() == null || !actor.getHouseholdId().equals(reportedUser.getHouseholdId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Select another member of your household"));
            }
        }

        Complaint complaint = new Complaint();
        complaint.setUser(actor);
        complaint.setReportedUser(reportedUser);
        complaint.setCategory(category);
        complaint.setSubject(subject);
        complaint.setDescription(description);
        return ResponseEntity.status(201).body(toResponse(complaintRepository.save(complaint)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserComplaints(@PathVariable Long userId, @AuthenticationPrincipal User actor) {
        if (!userId.equals(actor.getId())) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        List<Map<String, Object>> complaints = complaintRepository.findByUserIdWithUser(userId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(complaints);
    }

    private Map<String, Object> toResponse(Complaint complaint) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", complaint.getId());
        response.put("userId", complaint.getUserId());
        response.put("category", complaint.getCategory());
        response.put("subject", complaint.getSubject());
        response.put("description", complaint.getDescription());
        response.put("status", complaint.getStatus());
        response.put("adminResponse", complaint.getAdminResponse());
        response.put("createdAt", complaint.getCreatedAt());
        response.put("updatedAt", complaint.getUpdatedAt());
        response.put("userName", complaint.getUser().getName());
        response.put("userEmail", complaint.getUser().getEmail());
        response.put("reportedUserId", complaint.getReportedUserId());
        response.put("reportedUserName", complaint.getReportedUser() == null ? null : complaint.getReportedUser().getName());
        return response;
    }

    private String text(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        try {
            return value == null ? null : Long.parseLong(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}