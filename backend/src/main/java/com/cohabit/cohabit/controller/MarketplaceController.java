package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.service.MarketplaceService;
import com.cohabit.cohabit.service.MarketplaceService.Details;
import com.cohabit.cohabit.service.MarketplaceService.ItemDto;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    private final MarketplaceService service;

    public MarketplaceController(MarketplaceService service) {
        this.service = service;
    }

    @GetMapping
    public List<ItemDto> browse(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String priceType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return service.browse(category, condition, priceType, status, search, minPrice, maxPrice);
    }

    @GetMapping("/{id}")
    public ItemDto getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/mine")
    public List<ItemDto> getMine(@AuthenticationPrincipal User actor) {
        return service.getMine(actor);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ItemDto create(
            @AuthenticationPrincipal User actor,
            @Valid @RequestPart("details") Details details,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) {
        return service.createItem(actor, details, photos);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ItemDto update(
            @PathVariable Long id,
            @AuthenticationPrincipal User actor,
            @Valid @RequestPart("details") Details details,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) {
        return service.updateItem(id, actor, details, photos);
    }

    @PatchMapping("/{id}/status")
    public ItemDto updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User actor,
            @RequestBody Map<String, String> payload
    ) {
        String status = payload.get("status");
        return service.updateStatus(id, actor, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        service.deleteItem(id, actor);
    }

    @GetMapping("/photos/{photoId}")
    public ResponseEntity<byte[]> photo(@PathVariable Long photoId) {
        var photo = service.getPhoto(photoId);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .header("X-Content-Type-Options", "nosniff")
                .body(photo.content());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + " : " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(Map.of("error", message.isEmpty() ? "Champs invalides" : message));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException exception) {
        String reason = exception.getReason() != null ? exception.getReason() : exception.getMessage();
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("error", reason));
    }
}
