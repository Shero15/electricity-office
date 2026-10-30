import { createActor } from "@/backend";
import type {
  AppointmentFilter,
  AppointmentId,
  AppointmentStatus,
  BookingInput,
  BranchId,
  BranchView,
  DeviceId,
  NotificationSettingsView,
  ProfileUpdate,
  RegisterInput,
  RetentionSettingsView,
  ServiceId,
  ServiceView,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function useActorInstance() {
  return useActor(createActor);
}

/* ------------------------------------------------------------------ */
/* Catalogue & locations                                               */
/* ------------------------------------------------------------------ */

export function useServiceCatalogue() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["serviceCatalogue"],
    queryFn: async (): Promise<ServiceView[]> => {
      if (!actor) return [];
      return actor.getServiceCatalogue();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOfficeLocations() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["officeLocations"],
    queryFn: async (): Promise<BranchView[]> => {
      if (!actor) return [];
      return actor.getOfficeLocations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAvailability(
  serviceId: ServiceId | null,
  branchId: BranchId | null,
  date: string,
) {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["availability", String(serviceId), String(branchId), date],
    queryFn: async () => {
      if (!actor || serviceId === null || branchId === null) return [];
      return actor.getAvailability(serviceId, branchId, date);
    },
    enabled: !!actor && !isFetching && serviceId !== null && branchId !== null,
  });
}

/* ------------------------------------------------------------------ */
/* Customer profile & devices                                          */
/* ------------------------------------------------------------------ */

export function useMyProfile() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getMyProfile();
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterCustomer() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.registerCustomer(input);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useUpdateMyProfile() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.updateMyProfile(update);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useMyDevices() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["myDevices"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyDevices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterMyDevice() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceLabel: string) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.registerMyDevice(deviceLabel);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myDevices"] });
    },
  });
}

export function useRevokeMyDevice() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceId: DeviceId) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.revokeMyDevice(deviceId);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myDevices"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Appointments (customer)                                             */
/* ------------------------------------------------------------------ */

export function useMyAppointments() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["myAppointments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyAppointments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyAppointment(appointmentId: AppointmentId | null) {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["myAppointment", String(appointmentId)],
    queryFn: async () => {
      if (!actor || appointmentId === null) return null;
      const result = await actor.getMyAppointment(appointmentId);
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !isFetching && appointmentId !== null,
  });
}

export function useBookAppointment() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookingInput) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.bookAppointment(input);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useCancelMyAppointment() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: AppointmentId) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.cancelMyAppointment(appointmentId);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: (_data, appointmentId) => {
      void queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      void queryClient.invalidateQueries({
        queryKey: ["myAppointment", String(appointmentId)],
      });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useRescheduleMyAppointment() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      appointmentId: AppointmentId;
      date: string;
      slot: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.rescheduleMyAppointment(
        args.appointmentId,
        args.date,
        args.slot,
      );
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      void queryClient.invalidateQueries({
        queryKey: ["myAppointment", String(args.appointmentId)],
      });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Administration                                                      */
/* ------------------------------------------------------------------ */

export function useIsAdmin() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async (): Promise<boolean> => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllAppointments(filter: AppointmentFilter) {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["allAppointments", filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllAppointments(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAppointmentStatus() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      appointmentId: AppointmentId;
      status: AppointmentStatus;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.setAppointmentStatus(
        args.appointmentId,
        args.status,
      );
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allAppointments"] });
      void queryClient.invalidateQueries({ queryKey: ["auditLog"] });
    },
  });
}

export function useVerifyAppointmentQr() {
  const { actor } = useActorInstance();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.verifyAppointmentQr(token);
    },
  });
}

export function useCheckInAppointment() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.checkInAppointment(token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allAppointments"] });
      void queryClient.invalidateQueries({ queryKey: ["auditLog"] });
    },
  });
}

export function useAuditLog(limit: bigint) {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["auditLog", String(limit)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAuditLog(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useNotificationSettings() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["notificationSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getNotificationSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateNotificationSettings() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: NotificationSettingsView) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateNotificationSettings(settings);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notificationSettings"],
      });
    },
  });
}

export function useRetentionSettings() {
  const { actor, isFetching } = useActorInstance();
  return useQuery({
    queryKey: ["retentionSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRetentionSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateRetentionSettings() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: RetentionSettingsView) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateRetentionSettings(settings);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["retentionSettings"] });
    },
  });
}

export function useUpsertService() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: ServiceView) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.upsertService(service);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["serviceCatalogue"] });
    },
  });
}

export function useUpsertBranch() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (branch: BranchView) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.upsertBranch(branch);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["officeLocations"] });
    },
  });
}

export function useSetSlotCapacity() {
  const { actor } = useActorInstance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      branchId: BranchId;
      serviceId: ServiceId;
      perSlot: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.setSlotCapacity(
        args.branchId,
        args.serviceId,
        args.perSlot,
      );
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
