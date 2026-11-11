package com.cohabit.cohabit.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class HouseholdChatService {
    private static final String MEMBERSHIP = """
            FROM users u JOIN households h ON h.id = u.household_id
            """;
    private static final String ACTIVE_MEMBER = "u.id = ? AND u.suspended = FALSE AND h.suspended = FALSE";

    private final JdbcTemplate jdbc;

    public HouseholdChatService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Room(long householdId, String householdName, String lastMessage, int unread) {}
    public record Message(long id, Long senderId, String senderName, String body, Instant sentAt) {}
    public record Member(long id, String name, String color, boolean administrator) {}

    @Transactional(readOnly = true)
    public Optional<Room> room(long actorId) {
        return jdbc.query("""
                SELECT h.id, h.name, latest.body,
                       (SELECT COUNT(*) FROM household_chat_messages m
                        WHERE m.household_id = h.id AND (m.sender_id IS NULL OR m.sender_id <> u.id)
                        AND m.id > COALESCE(r.last_read_id, 0)) AS unread
                """ + MEMBERSHIP + """
                LEFT JOIN household_chat_reads r ON r.household_id = h.id AND r.user_id = u.id
                LEFT JOIN household_chat_messages latest ON latest.id =
                    (SELECT MAX(m.id) FROM household_chat_messages m WHERE m.household_id = h.id)
                WHERE
                """ + ACTIVE_MEMBER,
                (rs, row) -> new Room(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getInt(4)),
                actorId).stream().findFirst();
    }

    @Transactional(readOnly = true)
    public List<Member> members(long householdId, long actorId) {
        requireMember(householdId, actorId, false);
        return jdbc.query("""
                SELECT u.id, u.name, u.color, u.id = h.administrator_id AS is_administrator
                """ + MEMBERSHIP + """
                WHERE h.id = ? AND u.suspended = FALSE
                ORDER BY is_administrator DESC, u.name, u.id
                """, (rs, row) -> new Member(rs.getLong("id"), rs.getString("name"),
                rs.getString("color"), rs.getBoolean("is_administrator")), householdId);
    }

    @Transactional(readOnly = true)
    public List<Message> history(long householdId, long actorId, Long before, Long after) {
        requireMember(householdId, actorId, false);
        String page = after == null ? "id < ? ORDER BY id DESC" : "id > ? ORDER BY id ASC";
        long cursor = after != null ? after : before == null ? Long.MAX_VALUE : before;
        return jdbc.query("""
                SELECT id, sender_id, sender_name, body, sent_at FROM household_chat_messages
                WHERE household_id = ? AND
                """ + page + " LIMIT 50",
                (rs, row) -> new Message(rs.getLong(1), rs.getObject(2, Long.class), rs.getString(3),
                        rs.getString(4), rs.getTimestamp(5).toInstant()), householdId, cursor);
    }

    @Transactional
    public void send(long householdId, long actorId, String body) {
        // Serialize sends within a household so polling by message ID cannot skip a late commit.
        String senderName = requireMember(householdId, actorId, true);
        jdbc.update("""
                INSERT INTO household_chat_messages (household_id, sender_id, sender_name, body)
                VALUES (?, ?, ?, ?)
                """, householdId, actorId, senderName, body.strip());
    }

    @Transactional
    public void markRead(long householdId, long actorId, long through) {
        requireMember(householdId, actorId, false);
        Long lastRead = jdbc.queryForObject("""
                SELECT MAX(id) FROM household_chat_messages WHERE household_id = ? AND id <= ?
                """, Long.class, householdId, through);
        if (lastRead == null) return;
        jdbc.update("""
                INSERT INTO household_chat_reads (household_id, user_id, last_read_id) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE last_read_id = GREATEST(last_read_id, ?)
                """, householdId, actorId, lastRead, lastRead);
    }

    private String requireMember(long householdId, long actorId, boolean lock) {
        return jdbc.queryForList("SELECT u.name " + MEMBERSHIP + "WHERE " + ACTIVE_MEMBER + " AND h.id = ?"
                        + (lock ? " FOR UPDATE" : ""), String.class, actorId, householdId)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
