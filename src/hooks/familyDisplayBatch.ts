import { supabase } from "@/integrations/supabase/client";

export type FamilyDisplayBatch = {
  id: string;
  name: string;
  contact_person: string;
  members_count: number;
  is_blocked: boolean;
  blocked_until: string | null;
  block_reason: string | null;
  blocked_by_institution_name: string | null;
};

export type DeliveryFamilyEmbed = {
  id: string;
  name: string;
  contact_person: string;
  members_count: number;
  is_blocked: boolean;
  blocked_until: string | null;
  block_reason: string | null;
  blocked_by_institution: { name: string } | null;
};

export const mapFamilyDisplayToDeliveryEmbed = (
  display: FamilyDisplayBatch
): DeliveryFamilyEmbed => ({
  id: display.id,
  name: display.name,
  contact_person: display.contact_person,
  members_count: display.members_count,
  is_blocked: display.is_blocked,
  blocked_until: display.blocked_until,
  block_reason: display.block_reason,
  blocked_by_institution: display.blocked_by_institution_name
    ? { name: display.blocked_by_institution_name }
    : null,
});

export const fetchFamiliesDisplayBatch = async (
  familyIds: string[]
): Promise<Map<string, DeliveryFamilyEmbed>> => {
  if (familyIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.rpc("get_families_display_batch", {
    p_family_ids: familyIds,
  });

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((family) => [
      family.id,
      mapFamilyDisplayToDeliveryEmbed(family as FamilyDisplayBatch),
    ])
  );
};

export const enrichDeliveriesWithFamilyDisplay = async <
  T extends { family_id: string; family?: unknown },
>(
  deliveries: T[]
): Promise<Array<T & { family: DeliveryFamilyEmbed | null }>> => {
  const familyIds = [
    ...new Set(
      deliveries
        .map((delivery) => delivery.family_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (familyIds.length === 0) {
    return deliveries.map((delivery) => ({
      ...delivery,
      family: null,
    }));
  }

  const familyMap = await fetchFamiliesDisplayBatch(familyIds);

  return deliveries.map((delivery) => ({
    ...delivery,
    family: familyMap.get(delivery.family_id) ?? null,
  }));
};
