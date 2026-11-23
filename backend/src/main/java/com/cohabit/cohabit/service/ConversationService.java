package com.cohabit.cohabit.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class ConversationService {
    private static final String PARTICIPANT = "(c.seeker_id = ? OR c.owner_id = ?)";
    private final JdbcTemplate jdbc;

    public ConversationService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Conversation(long id, String householdName, String otherName, String lastMessage, int unread) {}
    public record Message(long id, long senderId, String body, Instant sentAt) {}

    @Transactional
    public long open(long householdId, long actorId) {
        var owners = jdbc.queryForList("""
                SELECT u.id FROM households h
                JOIN household_listings l ON l.household_id = h.id
                JOIN users u ON u.id = h.administrator_id
                WHERE h.id = ? AND
                """ + HouseholdListingService.VISIBLE + " FOR UPDATE", Long.class, householdId);
        if (owners.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        long ownerId = owners.get(0);
        if (ownerId == actorId) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        jdbc.update("""
                INSERT INTO conversations (household_id, seeker_id, owner_id) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE id = id
                """, householdId, actorId, ownerId);
        return jdbc.queryForObject("""
                SELECT id FROM conversations WHERE household_id = ? AND seeker_id = ? AND owner_id = ?
                """, Long.class, householdId, actorId, ownerId);
    }

    @Transactional
    public long openForMarketplace(long itemId, long actorId) {
        var items = jdbc.queryForList("""
                SELECT m.household_id, m.seller_id, m.title, m.price, u.household_id AS user_household_id
                FROM marketplace_items m
                JOIN users u ON u.id = m.seller_id
                WHERE m.id = ? AND u.suspended = FALSE
                """, itemId);
        if (items.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable");
        var row = items.get(0);
        Long householdId = (Long) row.get("household_id");
        if (householdId == null) {
            householdId = (Long) row.get("user_household_id");
        }
        long sellerId = ((Number) row.get("seller_id")).longValue();
        String title = (String) row.get("title");
        java.math.BigDecimal price = (java.math.BigDecimal) row.get("price");

        if (sellerId == actorId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous ne pouvez pas vous contacter vous-même");
        }

        if (householdId == null) {
            Long actorHousehold = jdbc.queryForObject("SELECT household_id FROM users WHERE id = ?", Long.class, actorId);
            householdId = actorHousehold != null ? actorHousehold : 1L;
        }

        jdbc.update("""
                INSERT INTO conversations (household_id, seeker_id, owner_id) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE id = id
                """, householdId, actorId, sellerId);
        long convId = jdbc.queryForObject("""
                SELECT id FROM conversations WHERE household_id = ? AND seeker_id = ? AND owner_id = ?
                """, Long.class, householdId, actorId, sellerId);

        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = ?", Integer.class, convId);
        if (count == null || count == 0) {
            String initialMessage = "Bonjour ! Je suis intéressé(e) par votre article sur le Marketplace : \"" + title + "\" (" + price + " MAD). Est-il toujours disponible ?";
            jdbc.update("INSERT INTO conversation_messages (conversation_id, sender_id, body) VALUES (?, ?, ?)",
                    convId, actorId, initialMessage);
        }

        return convId;
    }

    @Transactional(readOnly = true)
    public List<Conversation> inbox(long actorId) {
        return jdbc.query("""
                SELECT c.id, h.name, other_user.name, latest.body,
                       (SELECT COUNT(*) FROM conversation_messages m WHERE m.conversation_id = c.id
                        AND m.sender_id <> ? AND m.read_at IS NULL) AS unread
                FROM conversations c
                JOIN households h ON h.id = c.household_id
                JOIN users other_user ON other_user.id = CASE WHEN c.seeker_id = ? THEN c.owner_id ELSE c.seeker_id END
                LEFT JOIN conversation_messages latest ON latest.id =
                    (SELECT MAX(m.id) FROM conversation_messages m WHERE m.conversation_id = c.id)
                WHERE
                """ + PARTICIPANT + """
                 AND (latest.id IS NOT NULL OR c.seeker_id = ?)
                ORDER BY latest.id DESC, c.id DESC
                """, (rs, row) -> new Conversation(rs.getLong(1), rs.getString(2), rs.getString(3),
                rs.getString(4), rs.getInt(5)), actorId, actorId, actorId, actorId, actorId);
    }

    @Transactional(readOnly = true)
    public List<Message> history(long conversationId, long actorId, Long before, Long after) {
        requireParticipant(conversationId, actorId, false);
        String page = after == null ? "id < ? ORDER BY id DESC" : "id > ? ORDER BY id ASC";
        long cursor = after != null ? after : before == null ? Long.MAX_VALUE : before;
        return jdbc.query("""
                SELECT id, sender_id, body, sent_at FROM conversation_messages
                WHERE conversation_id = ? AND
                """ + page + " LIMIT 50", (rs, row) -> new Message(rs.getLong(1), rs.getLong(2), rs.getString(3),
                rs.getTimestamp(4).toInstant()), conversationId, cursor);
    }

    @Transactional
    public void send(long conversationId, long actorId, String body) {
        requireParticipant(conversationId, actorId, true);
        jdbc.update("INSERT INTO conversation_messages (conversation_id, sender_id, body) VALUES (?, ?, ?)",
                conversationId, actorId, body.strip());
    }

    @Transactional
    public void markRead(long conversationId, long actorId, long through) {
        requireParticipant(conversationId, actorId, false);
        jdbc.update("""
                UPDATE conversation_messages SET read_at = CURRENT_TIMESTAMP
                WHERE conversation_id = ? AND sender_id <> ? AND id <= ? AND read_at IS NULL
                """, conversationId, actorId, through);
    }

    private void requireParticipant(long conversationId, long actorId, boolean lock) {
        if (jdbc.queryForList("SELECT c.id FROM conversations c WHERE c.id = ? AND " + PARTICIPANT
                + (lock ? " FOR UPDATE" : ""), Long.class, conversationId, actorId, actorId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
