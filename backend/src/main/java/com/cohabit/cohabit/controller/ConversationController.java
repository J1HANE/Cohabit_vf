package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.service.ConversationService;
import com.cohabit.cohabit.service.HouseholdChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {
    private final ConversationService service;

    private final HouseholdChatService householdChat;

    public ConversationController(ConversationService service, HouseholdChatService householdChat) {
        this.service = service;
        this.householdChat = householdChat;
    }

    public record Opened(long id) {}
    public record Draft(@NotBlank @Size(max = 2000) String body) {}

    @PostMapping("/households/{householdId}")
    public Opened open(@PathVariable long householdId, @AuthenticationPrincipal User actor) {
        return new Opened(service.open(householdId, actor.getId()));
    }

    @GetMapping
    public List<ConversationService.Conversation> inbox(@AuthenticationPrincipal User actor) {
        return service.inbox(actor.getId());
    }

    @GetMapping("/{id}/messages")
    public List<ConversationService.Message> history(@PathVariable long id, @RequestParam(required = false) Long before,
                                                      @RequestParam(required = false) Long after,
                                                      @AuthenticationPrincipal User actor) {
        return service.history(id, actor.getId(), before, after);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void send(@PathVariable long id, @Valid @RequestBody Draft draft, @AuthenticationPrincipal User actor) {
        service.send(id, actor.getId(), draft.body());
    }

    @PutMapping("/{id}/read/{through}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@PathVariable long id, @PathVariable long through, @AuthenticationPrincipal User actor) {
        service.markRead(id, actor.getId(), through);
    }

    @GetMapping("/household")
    public ResponseEntity<HouseholdChatService.Room> room(@AuthenticationPrincipal User actor) {
        return householdChat.room(actor.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/household/{householdId}/messages")
    public List<HouseholdChatService.Message> householdHistory(@PathVariable long householdId,
            @RequestParam(required = false) Long before, @RequestParam(required = false) Long after,
            @AuthenticationPrincipal User actor) {
        return householdChat.history(householdId, actor.getId(), before, after);
    }

    @PostMapping("/household/{householdId}/messages")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void householdSend(@PathVariable long householdId, @Valid @RequestBody Draft draft,
                              @AuthenticationPrincipal User actor) {
        householdChat.send(householdId, actor.getId(), draft.body());
    }

    @PutMapping("/household/{householdId}/read/{through}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void householdRead(@PathVariable long householdId, @PathVariable long through,
                              @AuthenticationPrincipal User actor) {
        householdChat.markRead(householdId, actor.getId(), through);
    }
}
