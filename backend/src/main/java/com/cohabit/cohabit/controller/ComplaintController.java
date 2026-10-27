package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Complaint;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.ComplaintRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private static final Set<String> CATEGORIES = Set.of("ACCOUNT", "HOUSEHOLD", "PAYMENT", "BUG", "OTHER");

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintController(ComplaintRepository complaintRepository, UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createComplaint(@RequestBody Map<String, Object> payload) {
        Long userId = toLong(payload.get("userId"));
        String category = text(payload.get("category")).toUpperCase();
        String subject = text(payload.get("subject"));
        String description = text(payload.get("description"));

        if (userId == null || subject.length() < 5 || subject.length() > 120 || description.length() < 20 || description.length() > 5000 || !CATEGORIES.contains(category)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provide a valid category, a 5-120 character subject, and a 20-5000 character description"));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setCategory(category);
        complaint.setSubject(subject);
        complaint.setDescription(description);
        return ResponseEntity.status(201).body(toResponse(complaintRepository.save(complaint)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserComplaints(@PathVariable Long userId) {
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