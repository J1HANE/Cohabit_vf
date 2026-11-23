package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.User;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class MarketplaceService {

    private static final int MAX_PHOTOS = 5;
    private static final int MAX_PHOTO_BYTES = 2 * 1024 * 1024;

    private final JdbcTemplate jdbc;

    public MarketplaceService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Details(
            @NotBlank @Size(max = 160) String title,
            String description,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            String priceType, // FIXED or NEGOTIABLE
            @NotBlank String category,
            String itemSize,
            @NotBlank String itemCondition, // NEW, LIKE_NEW, VERY_GOOD, GOOD, FAIR
            String status, // AVAILABLE, RESERVED, SOLD
            List<Long> photoIds
    ) {}

    public record ItemDto(
            Long id,
            String title,
            String description,
            BigDecimal price,
            String priceType,
            String category,
            String itemSize,
            String itemCondition,
            String status,
            Long householdId,
            String householdName,
            Long sellerId,
            String sellerName,
            String sellerColor,
            Instant createdAt,
            List<Long> photoIds
    ) {}

    public record Photo(String contentType, byte[] content) {}

    @Transactional(readOnly = true)
    public List<ItemDto> browse(String category, String condition, String priceType, String status, String search,
                                BigDecimal minPrice, BigDecimal maxPrice) {
        StringBuilder sql = new StringBuilder("""
                SELECT m.id, m.title, m.description, m.price, m.price_type, m.category,
                       m.item_size, m.item_condition, m.status, m.household_id, h.name AS household_name,
                       m.seller_id, u.name AS seller_name, u.color AS seller_color, m.created_at
                FROM marketplace_items m
                JOIN users u ON u.id = m.seller_id
                LEFT JOIN households h ON h.id = m.household_id
                WHERE u.suspended = FALSE
                """);
        List<Object> params = new ArrayList<>();

        if (status != null && !status.isBlank()) {
            sql.append(" AND m.status = ?");
            params.add(status.strip().toUpperCase());
        } else {
            // Default: show available and reserved items, put sold at the bottom
            sql.append(" AND (m.status = 'AVAILABLE' OR m.status = 'RESERVED')");
        }

        if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
            sql.append(" AND m.category = ?");
            params.add(category.strip().toUpperCase());
        }

        if (condition != null && !condition.isBlank() && !"ALL".equalsIgnoreCase(condition)) {
            sql.append(" AND m.item_condition = ?");
            params.add(condition.strip().toUpperCase());
        }

        if (priceType != null && !priceType.isBlank() && !"ALL".equalsIgnoreCase(priceType)) {
            sql.append(" AND m.price_type = ?");
            params.add(priceType.strip().toUpperCase());
        }

        if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) >= 0) {
            sql.append(" AND m.price >= ?");
            params.add(minPrice);
        }

        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0) {
            sql.append(" AND m.price <= ?");
            params.add(maxPrice);
        }

        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(m.title) LIKE ? OR LOWER(m.description) LIKE ? OR LOWER(COALESCE(h.name, '')) LIKE ?)");
            String term = "%" + search.strip().toLowerCase() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
        }

        sql.append(" ORDER BY m.created_at DESC");

        return jdbc.query(sql.toString(), (rs, rowNum) -> {
            Long id = rs.getLong("id");
            return new ItemDto(
                    id,
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getBigDecimal("price"),
                    rs.getString("price_type"),
                    rs.getString("category"),
                    rs.getString("item_size"),
                    rs.getString("item_condition"),
                    rs.getString("status"),
                    rs.getObject("household_id", Long.class),
                    rs.getString("household_name"),
                    rs.getLong("seller_id"),
                    rs.getString("seller_name"),
                    rs.getString("seller_color"),
                    rs.getTimestamp("created_at").toInstant(),
                    photoIds(id)
            );
        }, params.toArray());
    }

    @Transactional(readOnly = true)
    public ItemDto getById(Long id) {
        return jdbc.query("""
                SELECT m.id, m.title, m.description, m.price, m.price_type, m.category,
                       m.item_size, m.item_condition, m.status, m.household_id, h.name AS household_name,
                       m.seller_id, u.name AS seller_name, u.color AS seller_color, m.created_at
                FROM marketplace_items m
                JOIN users u ON u.id = m.seller_id
                LEFT JOIN households h ON h.id = m.household_id
                WHERE m.id = ?
                """, (rs, rowNum) -> new ItemDto(
                rs.getLong("id"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getBigDecimal("price"),
                rs.getString("price_type"),
                rs.getString("category"),
                rs.getString("item_size"),
                rs.getString("item_condition"),
                rs.getString("status"),
                rs.getObject("household_id", Long.class),
                rs.getString("household_name"),
                rs.getLong("seller_id"),
                rs.getString("seller_name"),
                rs.getString("seller_color"),
                rs.getTimestamp("created_at").toInstant(),
                photoIds(rs.getLong("id"))
        ), id).stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
    }

    @Transactional(readOnly = true)
    public List<ItemDto> getMine(User actor) {
        return jdbc.query("""
                SELECT m.id, m.title, m.description, m.price, m.price_type, m.category,
                       m.item_size, m.item_condition, m.status, m.household_id, h.name AS household_name,
                       m.seller_id, u.name AS seller_name, u.color AS seller_color, m.created_at
                FROM marketplace_items m
                JOIN users u ON u.id = m.seller_id
                LEFT JOIN households h ON h.id = m.household_id
                WHERE m.seller_id = ? OR (m.household_id IS NOT NULL AND m.household_id = ?)
                ORDER BY m.created_at DESC
                """, (rs, rowNum) -> {
            Long id = rs.getLong("id");
            return new ItemDto(
                    id,
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getBigDecimal("price"),
                    rs.getString("price_type"),
                    rs.getString("category"),
                    rs.getString("item_size"),
                    rs.getString("item_condition"),
                    rs.getString("status"),
                    rs.getObject("household_id", Long.class),
                    rs.getString("household_name"),
                    rs.getLong("seller_id"),
                    rs.getString("seller_name"),
                    rs.getString("seller_color"),
                    rs.getTimestamp("created_at").toInstant(),
                    photoIds(id)
            );
        }, actor.getId(), actor.getHouseholdId());
    }

    @Transactional
    public ItemDto createItem(User actor, Details details, List<MultipartFile> files) {
        validateDetails(details);
        List<Photo> photos = (files == null ? List.<MultipartFile>of() : files).stream().map(this::readPhoto).toList();
        if (photos.size() > MAX_PHOTOS) {
            throw new IllegalArgumentException("Vous pouvez ajouter jusqu’à 5 photos.");
        }

        String priceType = "NEGOTIABLE".equalsIgnoreCase(details.priceType()) ? "NEGOTIABLE" : "FIXED";
        String status = details.status() != null && !details.status().isBlank() ? details.status().toUpperCase() : "AVAILABLE";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO marketplace_items (household_id, seller_id, title, description, price, price_type,
                                                  category, item_size, item_condition, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            if (actor.getHouseholdId() != null) {
                ps.setLong(1, actor.getHouseholdId());
            } else {
                ps.setNull(1, java.sql.Types.BIGINT);
            }
            ps.setLong(2, actor.getId());
            ps.setString(3, details.title().strip());
            ps.setString(4, details.description() != null ? details.description().strip() : null);
            ps.setBigDecimal(5, details.price().setScale(2, RoundingMode.HALF_UP));
            ps.setString(6, priceType);
            ps.setString(7, details.category().strip().toUpperCase());
            ps.setString(8, details.itemSize() != null && !details.itemSize().isBlank() ? details.itemSize().strip() : null);
            ps.setString(9, details.itemCondition().strip().toUpperCase());
            ps.setString(10, status);
            return ps;
        }, keyHolder);

        long itemId = Objects.requireNonNull(keyHolder.getKey()).longValue();

        for (Photo photo : photos) {
            jdbc.update("INSERT INTO marketplace_item_photos (item_id, content_type, content) VALUES (?, ?, ?)",
                    itemId, photo.contentType(), photo.content());
        }

        return getById(itemId);
    }

    @Transactional
    public ItemDto updateItem(Long id, User actor, Details details, List<MultipartFile> files) {
        validateDetails(details);
        ItemDto existing = getById(id);
        requireOwnerOrAdmin(existing, actor);

        List<Long> retained = details.photoIds() == null ? List.of() : details.photoIds();
        List<Photo> newPhotos = (files == null ? List.<MultipartFile>of() : files).stream().map(this::readPhoto).toList();
        if (retained.size() + newPhotos.size() > MAX_PHOTOS) {
            throw new IllegalArgumentException("Vous pouvez conserver jusqu’à 5 photos au total.");
        }

        List<Long> currentPhotoIds = photoIds(id);
        for (Long pId : currentPhotoIds) {
            if (!retained.contains(pId)) {
                jdbc.update("DELETE FROM marketplace_item_photos WHERE id = ? AND item_id = ?", pId, id);
            }
        }

        for (Photo photo : newPhotos) {
            jdbc.update("INSERT INTO marketplace_item_photos (item_id, content_type, content) VALUES (?, ?, ?)",
                    id, photo.contentType(), photo.content());
        }

        String priceType = "NEGOTIABLE".equalsIgnoreCase(details.priceType()) ? "NEGOTIABLE" : "FIXED";
        String status = details.status() != null && !details.status().isBlank() ? details.status().toUpperCase() : existing.status();

        jdbc.update("""
                UPDATE marketplace_items
                SET title = ?, description = ?, price = ?, price_type = ?, category = ?,
                    item_size = ?, item_condition = ?, status = ?
                WHERE id = ?
                """,
                details.title().strip(),
                details.description() != null ? details.description().strip() : null,
                details.price().setScale(2, RoundingMode.HALF_UP),
                priceType,
                details.category().strip().toUpperCase(),
                details.itemSize() != null && !details.itemSize().isBlank() ? details.itemSize().strip() : null,
                details.itemCondition().strip().toUpperCase(),
                status,
                id
        );

        return getById(id);
    }

    @Transactional
    public ItemDto updateStatus(Long id, User actor, String newStatus) {
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("Statut requis");
        }
        String status = newStatus.strip().toUpperCase();
        if (!List.of("AVAILABLE", "RESERVED", "SOLD").contains(status)) {
            throw new IllegalArgumentException("Statut invalide : doit être AVAILABLE, RESERVED ou SOLD");
        }

        ItemDto existing = getById(id);
        requireOwnerOrAdmin(existing, actor);

        jdbc.update("UPDATE marketplace_items SET status = ? WHERE id = ?", status, id);
        return getById(id);
    }

    @Transactional
    public void deleteItem(Long id, User actor) {
        ItemDto existing = getById(id);
        requireOwnerOrAdmin(existing, actor);
        jdbc.update("DELETE FROM marketplace_items WHERE id = ?", id);
    }

    @Transactional(readOnly = true)
    public Photo getPhoto(Long photoId) {
        return jdbc.query("SELECT content_type, content FROM marketplace_item_photos WHERE id = ?",
                (rs, rowNum) -> new Photo(rs.getString(1), rs.getBytes(2)), photoId)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo introuvable"));
    }

    private List<Long> photoIds(Long itemId) {
        return jdbc.queryForList("SELECT id FROM marketplace_item_photos WHERE item_id = ? ORDER BY id", Long.class, itemId);
    }

    private void validateDetails(Details details) {
        if (details.title() == null || details.title().isBlank()) {
            throw new IllegalArgumentException("Le titre de l’article est requis.");
        }
        if (details.price() == null || details.price().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le prix doit être supérieur à zéro.");
        }
        if (details.category() == null || details.category().isBlank()) {
            throw new IllegalArgumentException("La catégorie est requise.");
        }
        if (details.itemCondition() == null || details.itemCondition().isBlank()) {
            throw new IllegalArgumentException("L’état de l’article est requis.");
        }
    }

    private void requireOwnerOrAdmin(ItemDto item, User actor) {
        boolean isSeller = Objects.equals(item.sellerId(), actor.getId());
        boolean isHouseholdAdmin = actor.getHouseholdId() != null
                && Objects.equals(item.householdId(), actor.getHouseholdId())
                && jdbc.queryForList("SELECT id FROM households WHERE id = ? AND administrator_id = ?",
                Long.class, actor.getHouseholdId(), actor.getId()).size() > 0;
        boolean isPlatformAdmin = "ADMIN".equals(actor.getRole());

        if (!isSeller && !isHouseholdAdmin && !isPlatformAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action réservée au vendeur ou à l’administrateur du foyer.");
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
                        if ("JPEG".equalsIgnoreCase(format) || "PNG".equalsIgnoreCase(format) || "WEBP".equalsIgnoreCase(format)) {
                            reader.setInput(input);
                            long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                            if (pixels > 0 && pixels <= 24_000_000) {
                                return new Photo("image/" + format.toLowerCase(), bytes);
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
}
