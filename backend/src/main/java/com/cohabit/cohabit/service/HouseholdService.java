package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Household;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.HouseholdRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;

@Service
public class HouseholdService {

    private static final String INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;

    @Autowired
    public HouseholdService(HouseholdRepository householdRepository, UserRepository userRepository) {
        this.householdRepository = householdRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Household> getAllHouseholds() {
        return householdRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Household> getHouseholdById(Long id) {
        return householdRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<User> getHouseholdMembers(Long householdId) {
        return userRepository.findByHouseholdId(householdId);
    }

    @Transactional
    public Household createHousehold(String name, Long userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Household name is required");
        }
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getHousehold() != null) {
            throw new IllegalStateException("Leave the current household before creating another one");
        }

        Household household = new Household();
        household.setName(name.trim());
        household.setInviteCode(generateUniqueInviteCode());
        household = householdRepository.save(household);

        user.setHousehold(household);
        userRepository.save(user);
        household.setAdministrator(user);
        household = householdRepository.save(household);

        return household;
    }

    @Transactional
    public Household updateHousehold(Long id, String name, Long actorId) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Household name is required");
        }

        Household household = householdRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Household not found with id " + id));
        requireAdministrator(household, actorId);

        household.setName(name.trim());
        return householdRepository.save(household);
    }

    @Transactional
    public void deleteHousehold(Long id, Long actorId) {
        Household household = householdRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Household not found with id " + id));
        requireAdministrator(household, actorId);

        // Detach all members before deleting
        List<User> members = userRepository.findByHouseholdId(id);
        for (User member : members) {
            member.setHousehold(null);
            userRepository.save(member);
        }

        householdRepository.delete(household);
    }

    @Transactional
    public Household joinHousehold(String inviteCode, Long userId) {
        if (inviteCode == null || inviteCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Invitation code is required");
        }
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getHousehold() != null) {
            throw new IllegalStateException("User already belongs to a household");
        }

        Household household = householdRepository.findByInviteCode(inviteCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation code"));

        user.setHousehold(household);
        userRepository.save(user);

        return household;
    }

    @Transactional
    public void leaveHousehold(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getHousehold() != null && userId.equals(user.getHousehold().getAdministratorId())) {
            throw new IllegalStateException("Transfer household administration before leaving");
        }

        user.setHousehold(null);
        userRepository.save(user);
    }

    @Transactional
    public Household regenerateInviteCode(Long householdId, Long actorId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found with id " + householdId));
        requireAdministrator(household, actorId);

        String newCode = generateUniqueInviteCode();
        household.setInviteCode(newCode);
        return householdRepository.save(household);
    }

    @Transactional
    public void removeMember(Long householdId, Long memberId, Long actorId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found with id " + householdId));
        requireAdministrator(household, actorId);
        if (memberId.equals(household.getAdministratorId())) {
            throw new IllegalStateException("Transfer household administration before removing the administrator");
        }
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!householdId.equals(member.getHouseholdId())) {
            throw new IllegalArgumentException("User is not a member of this household");
        }
        member.setHousehold(null);
        userRepository.save(member);
    }

    @Transactional
    public Household appointAdministrator(Long householdId, Long memberId, Long actorId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found with id " + householdId));
        requireAdministrator(household, actorId);
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!householdId.equals(member.getHouseholdId())) {
            throw new IllegalArgumentException("The new administrator must belong to this household");
        }
        household.setAdministrator(member);
        return householdRepository.save(household);
    }

    private void requireAdministrator(Household household, Long actorId) {
        if (actorId == null || !actorId.equals(household.getAdministratorId())) {
            throw new SecurityException("Only the household administrator can perform this action");
        }
    }

    private String generateUniqueInviteCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = randomInviteCode(6);
            if (householdRepository.findByInviteCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate a unique invite code");
    }

    private String randomInviteCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(INVITE_ALPHABET.charAt(RANDOM.nextInt(INVITE_ALPHABET.length())));
        }
        return sb.toString();
    }
}
