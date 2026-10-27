# Spin the Wheel Feature

## Overview

The "Spin the Wheel" feature allows users to randomly assign tasks to household members using an animated wheel interface. This makes task assignment fun and fair by introducing an element of randomness.

## Features

### 1. Random Task Assignment (When Creating a Task)
- Location: **TaskNew.jsx** (Add Task page)
- Button: 🎰 icon next to the "Assigned to" dropdown
- Functionality:
  - Opens a modal with a spinning wheel
  - Wheel shows all household members as colored segments
  - Spin animation lasts 4 seconds with smooth deceleration
  - Randomly selects one member
  - Option to confirm selection or spin again
  - Selected member is automatically assigned to the task

### 2. Task Reassignment (From Tasks List)
- Location: **Tasks.jsx** (Tasks list page)
- Two ways to access:
  1. **Individual Reassignment**: 🎰 button on each task card
  2. **Bulk Reassignment**: "🎰 Reassign All" button in header
- Functionality:
  - For individual: Opens wheel to reassign specific task
  - For bulk: Opens wheel to reassign all pending tasks randomly
  - Same spinning experience as creation flow
  - Tasks are updated immediately after selection

## Component Structure

### Files Created/Modified

1. **New Component**: `src/components/SpinWheel/SpinWheel.jsx`
   - Main wheel component with animation logic
   - Handles spinning, random selection, and UI states
   - Props: `members`, `onClose`, `onSelect`

2. **New Styles**: `src/components/SpinWheel/SpinWheel.css`
   - Wheel styling with conic gradient
   - Animation effects (spin, fade, bounce)
   - Responsive design
   - Modal and button styling

3. **Modified**: `src/pages/app/TaskNew.jsx`
   - Added SpinWheel import
   - Added 🎰 button next to assignment dropdown
   - Added state management for wheel modal
   - Added handler for wheel selection

4. **Modified**: `src/pages/app/Tasks.jsx`
   - Added SpinWheel import
   - Added "Reassign All" button in header
   - Added reassign logic for individual tasks
   - Added handler for wheel selection

5. **Modified**: `src/components/shared/SharedComponents.jsx`
   - Added `onReassign` prop to TaskCard
   - Added 🎰 button to task card

6. **Modified**: `src/components/shared/SharedComponents.css`
   - Added styling for task card actions
   - Added styling for reassign button

## How It Works

### Wheel Generation

```javascript
// Calculate segment angle based on number of members
const segmentAngle = 360 / members.length;

// Create conic gradient for colored segments
const gradientStops = members.map((member, index) => {
  const startAngle = (index * segmentAngle) / 360;
  const endAngle = ((index + 1) * segmentAngle) / 360;
  return `${colors[index % colors.length]} ${startAngle * 100}% ${endAngle * 100}%`;
}).join(', ');
```

### Spinning Logic

```javascript
const spinWheel = () => {
  // At least 3 full spins + random position
  const spins = 3;
  const randomIndex = Math.floor(Math.random() * members.length);
  const randomOffset = Math.random() * (segmentAngle - 10) + 5;
  const targetRotation = rotation + (spins * 360) + (randomIndex * segmentAngle) + randomOffset;

  setRotation(targetRotation);

  // Determine winner after spin completes
  setTimeout(() => {
    const totalRotation = targetRotation % 360;
    const effectiveRotation = (360 - totalRotation) % 360;
    const winnerIndex = Math.floor(effectiveRotation / segmentAngle);
    setSelectedMember(members[winnerIndex]);
    setIsSpinning(false);
  }, 4000);
};
```

### Animation Timing

- **Spin Duration**: 4 seconds
- **Easing**: `cubic-bezier(0.17, 0.67, 0.12, 0.99)` (slow start, fast middle, slow end)
- **Modal Fade-in**: 0.3s
- **Result Bounce**: 0.5s
- **Button Pulse**: 2s loop

## Color Palette

The wheel uses 12 distinct colors for maximum visual separation:

```javascript
const colors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Purple
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Orchid
  '#85C1E9', // Sky Blue
  '#F8B500', // Orange
  '#00CED1', // Dark Cyan
];
```

## User Flow

### Creating a Task with Random Assignment

1. User navigates to "Add Task"
2. Fills in task details (name, frequency, due date)
3. Instead of selecting from dropdown, clicks 🎰 button
4. Wheel modal opens with all household members
5. User clicks "🎲 SPIN THE WHEEL"
6. Wheel spins for 4 seconds with animation
7. Wheel stops on a random member
8. Member is highlighted with their avatar
9. User can:
   - Click "✓ Confirm Selection" to assign
   - Click "🔄 Spin Again" to try again
10. Selected member is automatically set in the form
11. User proceeds to create the task

### Reassigning a Task

1. User navigates to Tasks list
2. Clicks 🎰 button on a specific task card
3. Wheel modal opens
4. Spin and select process same as above
5. Task is immediately updated with new assignee
6. UI refreshes to show new assignment

### Bulk Reassignment

1. User clicks "🎰 Reassign All" in header
2. Wheel modal opens
3. Spin and select a member
4. All pending tasks are randomly reassigned to different members
5. UI refreshes with new assignments

## Accessibility

- Keyboard navigation: Enter to spin, Escape to close
- ARIA labels on buttons
- High contrast colors
- Clear visual feedback
- Disabled state when no members available

## Responsive Design

- Wheel size: 300px (desktop), 250px (mobile)
- Modal width: 90% max, max-width 500px
- Text size adjusts for smaller screens
- Buttons stack vertically on mobile
- Touch-friendly button sizes

## Error Handling

- Shows empty state if no household members
- Disables spin button when no members
- Prevents spinning while already spinning
- Closes modal on cancel or confirm

## Future Enhancements

Potential improvements:
- Add sound effects during spin
- Add confetti on win
- Support custom wheel segments
- Add spin history
- Add weighted randomization (some members less likely)
- Add "exclude" option to skip certain members
- Add wheel customization (colors, themes)

## Integration with Backend

The feature works entirely on the frontend:
- No backend changes required
- Uses existing task update API
- Random selection is client-side
- Task reassignment uses PUT /api/tasks/{id}

## Testing Checklist

- [ ] Wheel appears with correct number of segments
- [ ] Spinning animation works smoothly
- [ ] Random selection is fair (tested with many spins)
- [ ] Confirm selection updates form/task correctly
- [ ] Spin again works without page reload
- [ ] Close button dismisses modal
- [ ] Works with 2+ household members
- [ ] Shows empty state with 0 members
- [ ] Reassign button appears on task cards
- [ ] Bulk reassign button appears in header
- [ ] Responsive on mobile devices
