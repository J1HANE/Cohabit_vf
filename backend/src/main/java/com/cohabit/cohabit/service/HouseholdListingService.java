package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.User;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@Service
public class HouseholdListingService {
    private static final int MAX_PHOTOS = 5;
    private static final int MAX_PHOTO_BYTES = 2 * 1024 * 1024;
    private static final String LISTING_QUERY = """
            SELECT h.id, h.name, u.name AS administrator_name, l.location, l.monthly_rent, l.bedrooms,
                   l.contact_email, l.contact_phone, l.published, l.contact_user_id = u.id AS owns_contact
            FROM households h JOIN users u ON u.id = h.administrator_id
            """;
    private static final String VISIBLE = """
            h.suspended = FALSE AND u.suspended = FALSE AND u.household_id = h.id
            AND l.published = TRUE AND l.contact_user_id = u.id
            """;

    private final JdbcTemplate jdbc;

    public HouseholdListingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Details(
            @Size(max = 160) String location,
            @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal monthlyRent,
            @Min(1) Integer bedrooms,
            @Size(max = 254) @Email String contactEmail,
            @Size(max = 32) @Pattern(regexp = "[+0-9 ()-]*") String contactPhone,
            boolean published, @Size(max = MAX_PHOTOS) List<Long> photoIds) {}

    public record Listing(Long householdId, String name, String administratorName, String location,
                          BigDecimal monthlyRent, Integer bedrooms, String contactEmail, String contactPhone,
                          boolean published, List<Long> photoIds) {}

    public record Photo(String contentType, byte[] content) {}

    @Transactional(readOnly = true)
    public List<Listing> browse() {
        return listings("JOIN household_listings l ON l.household_id = h.id WHERE " + VISIBLE
                + " ORDER BY h.name, h.id");
    }

    @Transactional(readOnly = true)
    public Listing getSettings(User actor) {
        requireAdministrator(actor, false);
        return listings("LEFT JOIN household_listings l ON l.household_id = h.id WHERE h.id = ?", actor.getHouseholdId())
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional
    public Listing save(User actor, Details details, List<MultipartFile> files) {
        Long householdId = actor.getHouseholdId();
        List<Long> retained = details.photoIds() == null ? List.of() : details.photoIds();
        if (retained.size() + files.size() > MAX_PHOTOS) {
            throw new IllegalArgumentException("Vous pouvez ajouter jusqu’à cinq photos.");
        }
        List<Photo> photos = files.stream().map(this::readPhoto).toList();
        requireAdministrator(actor, true);
        List<Long> existing = photoIds(householdId);
        if (!existing.containsAll(retained) || retained.stream().distinct().count() != retained.size()) {
            throw new IllegalArgumentException("Les photos ont changé. Rechargez l’annonce avant de réessayer.");
        }

        String location = clean(details.location());
        String email = clean(details.contactEmail());
        String phone = clean(details.contactPhone());
        if (phone != null && phone.chars().filter(Character::isDigit).count() < 6) {
            throw new IllegalArgumentException("Saisissez un numéro de téléphone valide.");
        }
        if (details.published() && (location == null || details.monthlyRent() == null || details.bedrooms() == null
                || (email == null && phone == null) || (retained.isEmpty() && photos.isEmpty()))) {
            throw new IllegalArgumentException("Ajoutez la localisation, le loyer, le nombre de chambres, un contact et au moins une photo.");
        }

        jdbc.update("INSERT INTO household_listings (household_id) VALUES (?) ON DUPLICATE KEY UPDATE household_id = household_id",
                householdId);
        jdbc.update("""
                UPDATE household_listings SET location = ?, monthly_rent = ?, bedrooms = ?, contact_email = ?,
                    contact_phone = ?, published = ?, contact_user_id = ? WHERE household_id = ?
                """, location, details.monthlyRent(), details.bedrooms(), email, phone, details.published(),
                actor.getId(), householdId);
        for (Long id : existing) {
            if (!retained.contains(id)) jdbc.update("DELETE FROM household_listing_photos WHERE id = ?", id);
        }
        for (Photo photo : photos) {
            jdbc.update("INSERT INTO household_listing_photos (household_id, content_type, content) VALUES (?, ?, ?)",
                    householdId, photo.contentType(), photo.content());
        }
        return getSettings(actor);
    }

    @Transactional(readOnly = true)
    public Photo getPhoto(Long id, User actor) {
        return jdbc.query("""
                SELECT p.content_type, p.content
                FROM household_listing_photos p
                JOIN household_listings l ON l.household_id = p.household_id
                JOIN households h ON h.id = l.household_id
                JOIN users u ON u.id = h.administrator_id
                WHERE p.id = ? AND (h.administrator_id = ? OR (
                """ + VISIBLE + "))",
                (rs, row) -> new Photo(rs.getString(1), rs.getBytes(2)), id, actor.getId())
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private List<Listing> listings(String clause, Object... parameters) {
        return jdbc.query(LISTING_QUERY + clause, (rs, row) -> {
            Long id = rs.getLong("id");
            boolean ownsContact = rs.getBoolean("owns_contact");
            return new Listing(id, rs.getString("name"), rs.getString("administrator_name"),
                    rs.getString("location"), rs.getBigDecimal("monthly_rent"), rs.getObject("bedrooms", Integer.class),
                    ownsContact ? rs.getString("contact_email") : null, ownsContact ? rs.getString("contact_phone") : null,
                    ownsContact && rs.getBoolean("published"), photoIds(id));
        }, parameters);
    }

    private List<Long> photoIds(Long id) {
        return jdbc.queryForList("SELECT id FROM household_listing_photos WHERE household_id = ? ORDER BY id", Long.class, id);
    }

    private void requireAdministrator(User actor, boolean lock) {
        Long householdId = actor.getHouseholdId();
        if (householdId == null || jdbc.queryForList(
                "SELECT id FROM households WHERE id = ? AND administrator_id = ? AND suspended = FALSE"
                        + (lock ? " FOR UPDATE" : ""), Long.class, householdId, actor.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private Photo readPhoto(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_PHOTO_BYTES) {
            throw new IllegalArgumentException("Chaque photo doit peser au maximum 2 Mo.");
        }
        try {
            byte[] bytes = file.getBytes();
            try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(input);
                if (readers.hasNext()) {
                    var reader = readers.next();
                    try {
                        String format = reader.getFormatName();
                        if ("JPEG".equalsIgnoreCase(format) || "PNG".equalsIgnoreCase(format)) {
                            reader.setInput(input);
                            long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                            if (pixels > 0 && pixels <= 24_000_000) {
                                return new Photo("JPEG".equalsIgnoreCase(format) ? "image/jpeg" : "image/png", bytes);
                            }
                        }
                    } finally {
                        reader.dispose();
                    }
                }
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Impossible de lire cette photo.", exception);
        }
        throw new IllegalArgumentException("Choisissez une photo JPEG ou PNG valide, de 24 mégapixels maximum.");
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
