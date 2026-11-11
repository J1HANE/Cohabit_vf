package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.service.HouseholdListingService;
import com.cohabit.cohabit.service.HouseholdListingService.Details;
import com.cohabit.cohabit.service.HouseholdListingService.Listing;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/household-listings")
public class HouseholdListingController {
    private final HouseholdListingService service;

    public HouseholdListingController(HouseholdListingService service) {
        this.service = service;
    }

    @GetMapping
    public List<Listing> browse() {
        return service.browse();
    }

    @GetMapping("/mine")
    public Listing settings(@AuthenticationPrincipal User actor) {
        return service.getSettings(actor);
    }

    @PutMapping(value = "/mine", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Listing save(@AuthenticationPrincipal User actor, @Valid @RequestPart("details") Details details,
                        @RequestPart(value = "photos", required = false) List<MultipartFile> photos) {
        return service.save(actor, details, photos == null ? List.of() : photos);
    }

    @GetMapping("/photos/{id}")
    public ResponseEntity<byte[]> photo(@AuthenticationPrincipal User actor, @PathVariable Long id) {
        var photo = service.getPhoto(id, actor);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .header("X-Content-Type-Options", "nosniff").body(photo.content());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> invalid(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
    }
}
