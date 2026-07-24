import type { Appointment } from "@/lib/agenda/types";

/**
 * Clusters appointments whose time ranges overlap so the caller can render
 * each cluster as a row of side-by-side columns instead of one appointment
 * hiding behind another at the same time. Input must already be sorted by
 * start_time ascending.
 */
export function groupOverlapping(appointments: Appointment[]): Appointment[][] {
  const groups: Appointment[][] = [];
  let currentGroup: Appointment[] = [];
  let currentGroupEnd = "";

  for (const appointment of appointments) {
    if (currentGroup.length > 0 && appointment.start_time < currentGroupEnd) {
      currentGroup.push(appointment);
      if (appointment.end_time > currentGroupEnd) currentGroupEnd = appointment.end_time;
    } else {
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [appointment];
      currentGroupEnd = appointment.end_time;
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  return groups;
}
